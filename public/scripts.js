
const grabarBtn = document.getElementById("grabar");
const detenerBtn = document.getElementById("detener");
const estado = document.getElementById("estado");
const audioRespuesta = document.getElementById("audioRespuesta");
const voz = document.getElementById("voz");

let mediaRecorder;
let audioChunks = [];

grabarBtn.onclick = async () => {
  grabarBtn.disabled = true;
  detenerBtn.disabled = false;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    grabarBtn.disabled = false;
    detenerBtn.disabled = true;
    estado.textContent = "Procesando... por favor espera ⏳";

    const mimeType = audioChunks[0].type || 'audio/webm';
    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const formData = new FormData();
    formData.append("audio", audioBlob, "grabacion.webm");
    formData.append("voz", voz.value);

    try {
      const res = await fetch("/api/audio", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Fallo al enviar el audio");

      const data = await res.json();
      audioRespuesta.src = data.audioUrl;
      audioRespuesta.play();
    } catch (err) {
      alert("Error al procesar el audio.");
      console.error(err);
    }

    estado.textContent = "";
  };

  mediaRecorder.start();
  estado.textContent = "🎙️ Grabando... habla ahora";
};

detenerBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    estado.textContent = "⏳ Procesando...";
  }
};
