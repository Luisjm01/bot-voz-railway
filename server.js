const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/audio', upload.single('audio'), async (req, res) => {
  console.log("📥 POST /api/audio recibido");

  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const audioBuffer = req.file?.buffer;

  if (!audioBuffer) {
    return res.status(400).json({ error: 'No se recibió el archivo de audio.' });
  }

  try {
    console.log("🔁 Enviando audio a Whisper...");
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'grabacion.webm',
      contentType: 'audio/webm'
    });
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    const whisperResp = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        }
      }
    );

    const transcripcion = whisperResp.data.text;
    console.log("🗑️ Transcripción recibida:", transcripcion);

    // 🚨 Filtro para ignorar mensajes basura
    const palabrasBasura = ["you", "ok", "ah", "eh", "o", "uh"];
    const palabras = transcripcion.trim().toLowerCase().split(/\s+/);

    if (palabras.length <= 2 || palabras.some(p => palabrasBasura.includes(p))) {
      console.log("⚡️ Mensaje ignorado por ser muy corto o ruido.");
      return res.status(200).json({ error: "Transcripción ignorada por ruido." });
    }

    console.log("🧬 Solicitando respuesta a GPT...");
    const chatResp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Eres Toscanito, un asistente de voz experto en Italia, especializado en la región de Toscana y en la ciudad de Roma. 
Hablas principalmente español, pero si el usuario escribe en inglés (u otro idioma), debes responder en ese idioma. 
Tu función principal es actuar como guía turístico: recomendar lugares que visitar, restaurantes, platillos típicos, experiencias locales, eventos culturales y consejos prácticos para viajeros. 
Responde siempre de manera cordial, entusiasta y amigable, como un verdadero experto local que ama compartir secretos de la Toscana y Roma.`,
          },
          { role: 'user', content: transcripcion }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        }
      }
    );

    const respuestaTexto = chatResp.data.choices[0].message.content;
    console.log("✅ Respuesta GPT:", respuestaTexto);

    console.log("💾 Guardando en Supabase...");
    await supabase.from('memoria').insert([
      {
        user_id: 'default',
        pregunta: transcripcion,
        respuesta: respuestaTexto,
      },
    ]);

    console.log("🔊 Generando audio en ElevenLabs...");
    const audioResp = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        'xi-api-key': process.env.ELEVEN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      data: {
        text: respuestaTexto,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      },
      responseType: 'arraybuffer'
    });

    const filename = `voz-${Date.now()}.mp3`;
    const filePath = path.join(__dirname, 'public', filename);
    fs.writeFileSync(filePath, audioResp.data);

    res.json({
      audioUrl: `/${filename}`,
      transcripcion,
      respuesta: respuestaTexto
    });
  } catch (error) {
    console.error("❌ Error procesando audio:", error.response?.data || error.message);
    res.status(500).json({ error: 'Error procesando el audio.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
