const express = require('express'); // Import Express framework
const bodyParser = require('body-parser'); // Middleware for parsing request bodies
const { exec } = require('child_process'); // Module to execute shell commands
const fs = require('fs'); // File system module for file operations
const axios = require('axios'); // Promise-based HTTP client for making requests
const ffmpeg = require('fluent-ffmpeg'); // Library for processing audio and video files

const app = express();
const PORT = 3000;

// Hugging Face API configuration
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/openai/whisper-small";
const HUGGINGFACE_API_KEY = "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";

app.use(bodyParser.json());
app.use(express.static('public'));

// Middleware to set CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Function to extract video ID from a YouTube URL
function extractVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
}

// Function to extract audio from a YouTube video using yt-dlp
function extractAudio(videoId) {
  return new Promise((resolve, reject) => {
    const audioFile = `audio_${videoId}.mp3`;
    const command = `yt-dlp -x --audio-format mp3 -o ${audioFile} https://www.youtube.com/watch?v=${videoId}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error extracting audio: ${stderr}`);
        return reject(error);
      }
      console.log(`Audio extraction output: ${stdout}`);
      resolve(audioFile);
    });
  });
}

// Function to split audio into segments of a specified duration
function splitAudio(filePath, segmentDuration) {
  return new Promise((resolve, reject) => {
    const segments = [];
    const outputPattern = 'output%03d.mp3';

    ffmpeg(filePath)
      .outputOptions('-f', 'segment')
      .outputOptions('-segment_time', segmentDuration)
      .outputOptions('-reset_timestamps', '1')
      .output(outputPattern)
      .on('end', () => {
        const segmentFiles = fs.readdirSync('./').filter(file => file.startsWith('output') && file.endsWith('.mp3'));
        console.log('Audio segments created:', segmentFiles);
        resolve(segmentFiles.sort());
      })
      .on('error', (err) => {
        console.error('Error splitting audio:', err);
        reject(err);
      })
      .run();
  });
}

// Function to transcribe audio segments using Hugging Face API
async function transcribeAudio(filePath, { language }) {
  const segments = await splitAudio(filePath, 30); // Generate 30-second segments
  console.log('Segments for transcription:', segments);
  const transcriptions = [];

  if (!segments || segments.length === 0) {
    console.error('No audio segments created for transcription.');
    throw new Error('No audio segments available for transcription.');
  }

  for (const segment of segments) {
    try {
      const fileData = fs.readFileSync(segment);
      console.log('Sending audio data to Hugging Face API for segment:', segment);
      const response = await axios.post(HUGGINGFACE_API_URL, fileData, {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/octet-stream',
        },
      });

      // Log the response from the API
      console.log(`Hugging Face API response for ${segment}:`, response.data);

      // Check if the response contains the expected structure
      if (response.data && response.data.text) {
        transcriptions.push(response.data.text); // Add transcription text to the array
        console.log(`Transcription for ${segment}:`, response.data.text);
      } else {
        console.warn('No transcription text found for segment:', segment);
      }
    } catch (error) {
      console.error('Error during transcription for segment:', segment, error.response ? error.response.data : error.message);
    }
  }

  // Cleanup segment files after transcription is done
  console.log('Cleaning up files...');
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath); // Delete the temporary audio file
  }
  for (const segment of segments) {
    if (fs.existsSync(segment)) {
      fs.unlinkSync(segment); // Delete each segment file
    } else {
      console.warn(`Segment file not found for deletion: ${segment}`);
    }
  }

  console.log('Full transcription:', transcriptions.join('\n\n'));
  return { transcription: transcriptions.join('\n\n'), segments }; // Return the full transcription and segments
}

// Function to fetch video details using yt-dlp
async function fetchVideoDetails(videoId) {
  return new Promise((resolve, reject) => {
    const command = `yt-dlp --dump-json https://www.youtube.com/watch?v=${videoId}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error fetching video details: ${stderr}`);
        return reject(error);
      }

      try {
        const videoData = JSON.parse(stdout); // Parse the JSON output
        resolve({
          title: videoData.title,
          channel: videoData.uploader,
          uploadDate: videoData.upload_date,
        });
      } catch (parseError) {
        console.error('Error parsing JSON output:', parseError);
        reject(new Error('Failed to parse video details'));
      }
    });
  });
}

// Endpoint to handle transcription requests
app.post('/transcribe', async (req, res) => {
  console.log('Received request:', req.body);

  try {
    const { url } = req.body;

    if (!url) {
      console.log('No URL provided');
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoId = extractVideoId(url);
    console.log('Extracted video ID:', videoId);

    if (!videoId) {
      console.log('Invalid YouTube URL');
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log('Extracting audio...');
    const audioFile = await extractAudio(videoId);

    console.log('Audio extracted, sending to Hugging Face API...');
    const transcriptionResult = await transcribeAudio(audioFile, { language: 'en' });

    // Check if transcriptionResult is defined and has the transcription property
    if (!transcriptionResult || !transcriptionResult.transcription) {
      console.error('Transcription result is undefined or missing transcription property');
      return res.status(500).json({ error: 'Transcription failed', details: 'No transcription available' });
    }

    const { transcription, segments } = transcriptionResult;

    console.log('Cleaning up files...');
    if (fs.existsSync(audioFile)) {
      fs.unlinkSync(audioFile); // Delete the temporary audio file
    }

    // Cleanup segment files
    for (const segment of segments) {
      if (fs.existsSync(segment)) {
        fs.unlinkSync(segment); // Delete each segment file
      } else {
        console.warn(`Segment file not found for deletion: ${segment}`);
      }
    }

    const videoDetails = await fetchVideoDetails(videoId);

    console.log('Sending transcription response...');
    res.json({ transcription, videoDetails });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({
      error: 'Failed to process transcript',
      details: error.message,
      stack: error.stack,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
