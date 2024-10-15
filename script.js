async function transcribeVideo() {
    const url = document.getElementById('videoUrl').value;
    const transcriptionDiv = document.getElementById('transcription');
    transcriptionDiv.textContent = 'Transcribing... Please wait.';
  
    try {
      const response = await fetch('http://localhost:3000/transcribe', {
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
      transcriptionDiv.textContent = 'Error occurred: ' + error.message;
    }
  }
  