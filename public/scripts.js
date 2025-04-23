
const btnHablar = document.getElementById("hablar");
const btnDetener = document.getElementById("detener");
const audioRespuesta = document.getElementById("audioRespuesta");
const vozSelect = document.getElementById("voz");

let audioContext;
let mediaStream;
let recorder;
let audioData = [];

btnHablar.onclick = async () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const input = audioContext.createMediaStreamSource(mediaStream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  input.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (e) => {
    audioData.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };

  recorder = processor;
  btnHablar.disabled = true;
  btnDetener.disabled = false;
};

btnDetener.onclick = async () => {
  recorder.disconnect();
  mediaStream.getTracks().forEach((t) => t.stop());

  const mergedBuffer = mergeBuffers(audioData, audioData[0].length);
  const wavBlob = encodeWAV(mergedBuffer);

  const formData = new FormData();
  formData.append("audio", wavBlob, "grabacion.wav");
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

  btnHablar.disabled = false;
  btnDetener.disabled = true;
  audioData = [];
};

function mergeBuffers(channelBuffer, length) {
  const result = new Float32Array(channelBuffer.length * length);
  let offset = 0;
  for (let i = 0; i < channelBuffer.length; i++) {
    result.set(channelBuffer[i], offset);
    offset += channelBuffer[i].length;
  }
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
