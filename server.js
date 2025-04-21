const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar almacenamiento temporal para audio
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Ruta para HTML en navegador
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta principal para manejar audio grabado
app.post('/api/audio', upload.single('audio'), async (req, res) => {
  const voiceId = 'hYYNmijq0aL07R8FAKj1'; // tu voz personalizada
  const audioBuffer = req.file?.buffer;

  if (!audioBuffer) {
    return res.status(400).json({ error: 'No se recibió el archivo de audio.' });
  }

  try {
    // 1. Transcribir con Whisper
    const whisperResp = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        file: audioBuffer,
        model: 'whisper-1',
        response_format: 'json',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const transcripcion = whisperResp.data.text;
    console.log('📝 Transcripción:', transcripcion);

    // 2. Obtener respuesta de GPT
    const chatResp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: transcripcion }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const respuestaTexto = chatResp.data.choices[0].message.content;
    console.log('🤖 GPT respondió:', respuestaTexto);

    // 3. Guardar en Supabase
    await supabase.from('memoria').insert([
      {
        user_id: 'default',
        pregunta: transcripcion,
        respuesta: respuestaTexto,
      },
    ]);

    // 4. Generar audio con ElevenLabs
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
        model_id: 'eleven_monolingual_v1',
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

    res.json({ audioUrl: `/${filename}` });
  } catch (error) {
    console.error('❌ Error procesando audio:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ocurrió un error procesando tu audio.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
