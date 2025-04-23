
const btnHablar = document.getElementById("botonPrincipal");
const btnDetener = document.getElementById("detener");
const chat = document.getElementById("chat");
const audioRespuesta = document.getElementById("audioRespuesta");

let audioContext, mediaStream, recorder, inputNode, processor;
let audioData = [];
let hablando = false;

btnHablar.onclick = async () => {
  hablando = true;
  btnHablar.classList.add("oculto");
  btnDetener.classList.remove("oculto");
  iniciarGrabacion();
};

btnDetener.onclick = () => {
  hablando = false;
  btnHablar.classList.remove("oculto");
  btnDetener.classList.add("oculto");
  detenerGrabacion();
};

async function iniciarGrabacion() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  inputNode = audioContext.createMediaStreamSource(mediaStream);
  processor = audioContext.createScriptProcessor(4096, 1, 1);

  audioData = [];

  processor.onaudioprocess = (e) => {
    audioData.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };

  inputNode.connect(processor);
  processor.connect(audioContext.destination);

  setTimeout(() => {
    if (hablando) {
      detenerGrabacion();
    }
  }, 5000);
}

function detenerGrabacion() {
  processor.disconnect();
  inputNode.disconnect();
  mediaStream.getTracks().forEach(track => track.stop());

  const mergedBuffer = mergeBuffers(audioData, audioData[0].length);
  const wavBlob = encodeWAV(mergedBuffer);

  enviarAudio(wavBlob);
}

async function enviarAudio(blob) {
  const formData = new FormData();
  formData.append("audio", blob, "grabacion.wav");

  agregarMensaje("🗣️ Grabación enviada...", "usuario");

  try {
    const response = await fetch("/api/audio", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.transcripcion) agregarMensaje("🗣️ " + data.transcripcion, "usuario");
    if (data.respuesta) agregarMensaje("🤖 " + data.respuesta, "bot");
    if (data.audioUrl) {
      audioRespuesta.src = data.audioUrl;
      audioRespuesta.classList.remove("oculto");
      audioRespuesta.play();
      audioRespuesta.onended = () => {
        if (hablando) iniciarGrabacion();
      };
    } else {
      if (hablando) iniciarGrabacion();
    }
  } catch (error) {
    agregarMensaje("❌ Error al enviar el audio", "bot");
  }
}

function agregarMensaje(texto, clase) {
  const div = document.createElement("div");
  div.className = `mensaje ${clase}`;
  div.innerText = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function mergeBuffers(bufferArray, length) {
  const result = new Float32Array(bufferArray.length * length);
  let offset = 0;
  bufferArray.forEach(data => {
    result.set(data, offset);
    offset += data.length;
  });
  return result;
}

function encodeWAV(samples) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 44100, true);
  view.setUint32(28, 44100 * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: "audio/wav" });
}
