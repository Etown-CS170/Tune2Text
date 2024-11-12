const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Hugging Face API URL and Token
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/AmirMohseni/YoutubeSummarizer';
const HUGGING_FACE_API_TOKEN = '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'; // Replace with your Hugging Face API token

// Middleware to handle CORS and JSON requests
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Route to handle transcription requests
app.post('/transcribe', async (req, res) => {
  const { url } = req.body;

  try {
    // Send the URL to Hugging Face API for transcription
    const response = await axios.post(
      HUGGING_FACE_API_URL,
      { inputs: url },
      {
        headers: { Authorization: `Bearer ${HUGGING_FACE_API_TOKEN}` },
      }
    );

    // Check if there's an error in the response
    if (response.data.error) {
      return res.status(500).json({ error: 'Failed to transcribe the video.' });
    }

    // Send transcription back to client
    res.json({ transcription: response.data });
  } catch (error) {
    console.error('Error with Hugging Face API:', error.message);
    res.status(500).json({ error: 'Failed to fetch transcription from Hugging Face.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
