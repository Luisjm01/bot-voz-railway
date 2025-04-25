document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('record-button');
  const thinking = document.getElementById('thinking-indicator');
  const chat = document.getElementById('chat-container');
  let mediaRecorder, audioChunks = [];

  async function appendMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = 'message ' + (sender === 'bot' ? 'bot' : 'user');
    msg.textContent = (sender === 'bot' ? 'Toscanito: ' : 'Usuario: ') + text;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(() => {
      // Autoplay blocked, show controls
      const audioEl = document.createElement('audio');
      audioEl.src = url;
      audioEl.controls = true;
      audioEl.style.margin = '0.5rem 0';
      chat.appendChild(audioEl);
      chat.scrollTop = chat.scrollHeight;
    });
  }

  button.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunks = [];
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.start();
      button.textContent = '■ Detener';
    } else {
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        await appendMessage('...', 'user');
        const ext = mediaRecorder.mimeType.split('/')[1].split(';')[0];
        const form = new FormData();
        form.append('audio', blob, `recording.${ext}`);
        thinking.classList.remove('hidden');
        button.disabled = true;
        try {
          const res = await fetch('/api/audio', { method: 'POST', body: form });
          const data = await res.json();
          const lastUser = chat.querySelector('.message.user:last-child');
          if (lastUser) lastUser.textContent = 'Usuario: ' + data.transcripcion;
          await appendMessage(data.respuesta, 'bot');
          playAudio(data.audioUrl);
        } catch {
          await appendMessage('Lo siento, ocurrió un error.', 'bot');
        } finally {
          thinking.classList.add('hidden');
          button.textContent = '🎤 Grabar';
          button.disabled = false;
        }
      };
      mediaRecorder.stop();
    }
  });
});
