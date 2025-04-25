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
  const maxSilence = 5000; // 5 s

  processor.onaudioprocess = (e) => {
    const buffer = e.inputBuffer.getChannelData(0);
    audioData.push(new Float32Array(buffer));
    const rms = Math.sqrt(buffer.reduce((sum, x) => sum + x * x, 0) / buffer.length);

    if (rms < silenceThreshold) {
      silenceDuration += e.inputBuffer.duration * 1000;
      if (silenceDuration > maxSilence) {
        // sólo detenemos la grabación; 'hablando' queda true para reiniciar luego
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
  document.getElementById("thinking").classList.remove("oculto");

  try {
    const response = await fetch("/api/audio", { method: "POST", body: formData });
    const data = await response.json();

    console.log("📝 Transcripción cruda:", data.transcripcion);
    if (!data.transcripcion || data.transcripcion.trim().length < 3 || data.transcripcion.toLowerCase() === "you") {
      console.log("📭 Transcripción vacía o irrelevante. No se continúa.");
      detenerSolicitado = true;
      document.getElementById("thinking").classList.add("oculto");
      return;
    }

    console.log('✅ Mostrando mensaje de usuario:', data.transcripcion);
    agregarMensaje("🗣️ " + data.transcripcion, "usuario");

    if (data.respuesta) {
      document.getElementById("thinking").classList.add("oculto");
      console.log('✅ Mostrando respuesta del bot:', data.respuesta);
      agregarMensaje("🤖 " + data.respuesta, "bot");
    }

    if (data.audioUrl) {
      audioRespuesta.src = data.audioUrl;
      audioRespuesta.classList.remove("oculto");
      console.log('🔊 Reproduciendo audio:', audioRespuesta.src);
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

// rest of mergeBuffers, encodeWAV, iOS warning unchanged...
