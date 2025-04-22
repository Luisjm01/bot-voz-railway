const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const audioElement = document.getElementById("respuestaAudio");

let mediaRecorder;
let audioChunks = [];

startBtn.onclick = async () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    audioChunks = [];
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("voz", document.getElementById("voz").value);

    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.audioUrl) {
        audioElement.src = result.audioUrl;
      } else {
        alert("Error al procesar el audio.");
      }
    } catch (error) {
      alert("Error al procesar el audio.");
    }

    startBtn.disabled = false;
    stopBtn.disabled = true;
  };

  mediaRecorder.start();
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
};
