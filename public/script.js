const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const audioPlayer = document.getElementById("respuestaAudio");
const procesando = document.getElementById("procesando");
const vozSelect = document.getElementById("voz");

let mediaRecorder;
let audioChunks = [];

startBtn.onclick = async () => {
  audioChunks = [];
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

  mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

  mediaRecorder.onstop = async () => {
    procesando.style.display = "block";
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("voz", vozSelect.value);

    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (data.audioUrl) {
        audioPlayer.src = data.audioUrl;
        audioPlayer.play();
      } else {
        alert("Error al procesar el audio.");
      }
    } catch (error) {
      alert("Error al enviar el audio.");
      console.error("Error:", error);
    }
    procesando.style.display = "none";
  };

  mediaRecorder.start();
  startBtn.disabled = true;
  stopBtn.disabled = false;
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
};
