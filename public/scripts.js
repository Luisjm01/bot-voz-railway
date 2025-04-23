
const btnHablar = document.getElementById("botonPrincipal");
const btnDetener = document.getElementById("detener");
const chat = document.getElementById("chat");
const audioRespuesta = document.getElementById("audioRespuesta");

let mediaRecorder;
let audioChunks = [];
let stream;

let hablando = false;

async function comenzarConversacion() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob);

    agregarMensaje("🗣️ Grabación enviada...", "usuario");

    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.transcripcion) {
        agregarMensaje("🗣️ " + data.transcripcion, "usuario");
      }
      if (data.respuesta) {
        agregarMensaje("🤖 " + data.respuesta, "bot");
      }
      if (data.audioUrl) {
        audioRespuesta.src = data.audioUrl;
        audioRespuesta.classList.remove("oculto");
        audioRespuesta.play();
        audioRespuesta.onended = () => {
          if (hablando) comenzarConversacion();
        };
      } else {
        if (hablando) comenzarConversacion();
      }
    } catch (error) {
      agregarMensaje("❌ Error al enviar el audio", "bot");
    }
  };

  mediaRecorder.start();

  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    }
  }, 5000); // máximo 5 segundos de grabación por turno
}

function agregarMensaje(texto, clase) {
  const div = document.createElement("div");
  div.className = `mensaje ${clase}`;
  div.innerText = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

btnHablar.onclick = () => {
  hablando = true;
  btnHablar.classList.add("oculto");
  btnDetener.classList.remove("oculto");
  comenzarConversacion();
};

btnDetener.onclick = () => {
  hablando = false;
  btnHablar.classList.remove("oculto");
  btnDetener.classList.add("oculto");
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  }
};
