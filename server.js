const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;
const YOUTUBE_API_KEY = 'AIzaSyB3Joz8OkmrO9oZ7LYgCPb_KdIwAWSrj6U';  // Replace with your API key

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); // Allow only your frontend origin
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/transcribe', async (req, res) => {
  const { url } = req.body;

  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL.' });
    }

    // Fetch captions using YouTube Data API
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (response.data.items.length === 0) {
      return res.json({ transcription: 'No captions available for this video.' });
    }

    // Get caption ID and fetch the caption text
    const captionId = response.data.items[0].id;
    const captionResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=ttml&key=${YOUTUBE_API_KEY}`
    );

    const transcription = captionResponse.data;
    res.json({ transcription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch captions.' });
  }
});

function extractVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
