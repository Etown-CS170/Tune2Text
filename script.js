res.setHeader('Content-Type', 'application/json');
async function transcribeVideo() {
    const url = document.getElementById('videoUrl').value;
    const transcriptionDiv = document.getElementById('transcription');
    transcriptionDiv.textContent = 'Transcribing... Please wait.';
  
    try {
      const response = await fetch('http://127.0.0.1:5500/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
  
      const data = await response.json();
  
      if (data.transcription) {
        transcriptionDiv.textContent = data.transcription;
      } else {
        transcriptionDiv.textContent = 'Failed to transcribe the video.';
      }
    } catch (error) {
      console.error('Error details:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to fetch captions.' });  
    }
  }
  