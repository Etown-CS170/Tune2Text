const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const YoutubeTranscript = require('youtube-transcript-api');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

function extractVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
}

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

    console.log('Fetching transcript for video ID:', videoId);
    const transcripts = await YoutubeTranscript.getTranscript(videoId);
    
    if (!transcripts || transcripts.length === 0) {
      console.log('No transcripts found');
      return res.status(404).json({ error: 'No transcripts found for this video' });
    }

    console.log('Transcript found, processing...');
    const fullTranscription = transcripts.map(item => ({
      text: item.text,
      start: item.start,
      duration: item.duration
    }));

    console.log('Sending response');
    return res.json({ transcription: fullTranscription });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch transcript',
      details: error.message,
      stack: error.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

console.log(YoutubeTranscript);
