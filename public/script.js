document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('transcribeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url').value;
        const button = document.querySelector('button');
        const originalButtonText = button.innerText;
        button.innerText = 'Loading...';

        try {
            console.log('Sending URL:', url);
            const response = await fetch('/transcribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            console.log('Raw API Response:', response);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response from server:', errorData);
                throw new Error(errorData.error || 'Unknown error occurred');
            }

            const data = await response.json();
            console.log('Parsed API Response:', data);

            const transcriptOutput = document.getElementById('transcriptOutput');
            transcriptOutput.innerHTML = '';

            if (data.videoDetails) {
                const formattedUploadDate = data.videoDetails.uploadDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
                transcriptOutput.innerHTML += `<strong>Title:</strong> ${data.videoDetails.title}<br>`;
                transcriptOutput.innerHTML += `<strong>Artist/Channel:</strong> ${data.videoDetails.channel}<br>`;
                transcriptOutput.innerHTML += `<strong>Upload Date:</strong> ${formattedUploadDate}<br><br>`;
            }

            if (typeof data.transcription === 'string') {
                transcriptOutput.innerHTML += `<strong>Transcription:</strong><br>${data.transcription}`;
            } else {
                console.error('Unexpected transcription format:', data.transcription);
                transcriptOutput.innerText = 'Unexpected response format.';
            }
        } catch (error) {
            console.error('Error fetching transcript:', error);
            document.getElementById('transcriptOutput').innerText = 'Error fetching transcript. Check console for details.';
        } finally {
            button.innerText = originalButtonText;
        }
    });
});