const btnHablar = document.getElementById("botonPrincipal");
const btnDetener = document.getElementById("detener");
const chat = document.getElementById("chat");
const audioRespuesta = document.getElementById("audioRespuesta");

let audioContext, stream, input, processor;
let audioData = [];
let hablando = false;
let detenerSolicitado = false;

btnHablar.onclick = async () => {
  hablando = true;
  detenerSolicitado = false;
  btnHablar.classList.add("oculto");
  btnDetener.classList.remove("oculto");
  iniciarGrabacion();
};

btnDetener.onclick = () => {
  hablando = false;
  detenerSolicitado = true;
  btnHablar.classList.remove("oculto");
  btnDetener.classList.add("oculto");
  detenerGrabacion();
};

async function iniciarGrabacion() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  input = audioContext.createMediaStreamSource(stream);
  processor = audioContext.createScriptProcessor(4096, 1, 1);

  audioData = [];
  const silenceThreshold = 0.01;
  let silenceDuration = 0;
  const maxSilence = 1500;

  processor.onaudioprocess = (e) => {
    const buffer = e.inputBuffer.getChannelData(0);
    audioData.push(new Float32Array(buffer));
    const rms = Math.sqrt(buffer.reduce((sum, x) => sum + x * x, 0) / buffer.length);

    if (rms < silenceThreshold) {
      silenceDuration += e.inputBuffer.duration * 1000;
      if (silenceDuration > maxSilence) {
        detenerGrabacion();
      }
    } else {
      silenceDuration = 0;
    }
  };

  input.connect(processor);
  processor.connect(audioContext.destination);
}

function detenerGrabacion() {
  if (processor) processor.disconnect();
  if (input) input.disconnect();
  if (stream) stream.getTracks().forEach(track => track.stop());

  const merged = mergeBuffers(audioData, audioData[0].length);
  const wavBlob = encodeWAV(merged);

  enviarAudio(wavBlob);
}

async function enviarAudio(blob) {
  if (detenerSolicitado) {
    console.log("🎤 Grabación ignorada porque se solicitó detener.");
    return;
  }
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
        if (hablando && !detenerSolicitado) {
          iniciarGrabacion();
        } else {
          detenerSolicitado = false;
          hablando = false;
        }
      };
    } else {
      if (hablando && !detenerSolicitado) iniciarGrabacion();
    }
  } catch (err) {
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
