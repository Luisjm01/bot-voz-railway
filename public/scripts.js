const btnHablar = document.getElementById("hablar");
const btnDetener = document.getElementById("detener");
const audioRespuesta = document.getElementById("audioRespuesta");
const vozSelect = document.getElementById("voz");

let mediaRecorder;
let audioChunks = [];

btnHablar.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start();
  audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("voz", vozSelect.value);

    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.audioUrl) {
        audioRespuesta.src = data.audioUrl;
        audioRespuesta.play();
      } else {
        alert("Error al procesar el audio.");
      }
    } catch (error) {
      alert("Error al enviar el audio.");
    }
  };

  btnHablar.disabled = true;
  btnDetener.disabled = false;
};

btnDetener.onclick = () => {
  mediaRecorder.stop();
  btnHablar.disabled = false;
  btnDetener.disabled = true;
};