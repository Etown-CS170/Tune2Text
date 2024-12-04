## Overview
Tune2Text is a web application that allows users to extract and transcribe audio from YouTube videos. By simply entering a YouTube video URL, users can obtain a text transcription of the video's audio content.

## Setup Instructions

To run the YouTube Transcript App locally, follow these steps:

1. **Clone the Repository**

2. **Install Dependencies**
   Ensure you have Node.js and npm installed. Then, install the required packages:

3. **Set Up Environment Variables**
   Create a `.env` file in the root directory of the project and add your Hugging Face API key:
   HUGGINGFACE_API_URL="https://api-inference.huggingface.co/models/openai/whisper-small"
   HUGGINGFACE_API_KEY="your_hugging_face_api_key"

4. **Run the Server**
   Start the server using Nodemon for automatic restarts during development:
   npx nodemon server.js

5. **Access the Application**
   Open your web browser and navigate to `http://localhost:3000` to access the YouTube Transcript App.

## Description of Tools Used

- **Hugging Face API**: The application utilizes the Hugging Face API, specifically the Whisper model, to perform audio transcription. Whisper is a state-of-the-art speech recognition model that provides high accuracy in transcribing spoken language into text.

- **yt-dlp**: This tool is used to download audio from YouTube videos. It is a powerful command-line utility that supports a wide range of video and audio formats, making it ideal for extracting audio content for transcription.

- **ffmpeg**: A multimedia framework used to process audio and video files. In this application, ffmpeg is employed to split the downloaded audio into manageable segments for transcription.
