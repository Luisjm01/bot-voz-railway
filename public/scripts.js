const btnHablar = document.getElementById("botonPrincipal");
const btnDetener = document.getElementById("detener");
const chat = document.getElementById("chat");
const audioRespuesta = document.getElementById("audioRespuesta");

let audioContext, stream, input, processor;
let audioData = [];
let hablando = false;
let detenerSolicitado = false;

btnHablar.onclick = async () => {
  if (audioContext?.state === "suspended") {
    await audioContext.resume();
  }
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
  const maxSilence = 5000;

  processor.onaudioprocess = (e) => {
    const buffer = e.inputBuffer.getChannelData(0);
    audioData.push(new Float32Array(buffer));
    const rms = Math.sqrt(buffer.reduce((sum, x) => sum + x * x, 0) / buffer.length);

    if (rms < silenceThreshold) {
      silenceDuration += e.inputBuffer.duration * 1000;
      if (silenceDuration > maxSilence) {
        hablando = false;
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

// rest unchanged...
