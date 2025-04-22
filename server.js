const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

// Setear ruta de ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar almacenamiento temporal
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
  const voiceId = req.body.voz || 'hYYNmijq0aL07R8FAKj1';
  const audioBuffer = req.file?.buffer;

  if (!audioBuffer) {
    return res.status(400).json({ error: 'No se recibió el archivo de audio.' });
  }

  const tempWebmPath = '/tmp/input.webm';
  const tempMp3Path = '/tmp/output.mp3';
  fs.writeFileSync(tempWebmPath, audioBuffer);

  try {
    // Convertir webm → mp3 con ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(tempWebmPath)
        .audioCodec('libmp3lame')
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(tempMp3Path);
    });

    const mp3Data = fs.readFileSync(tempMp3Path);

    // Enviar a Whisper
    const formData = new FormData();
    formData.append('file', mp3Data, { filename: 'audio.mp3', contentType: 'audio/mp3' });
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    const whisperResp = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );

    const transcripcion = whisperResp.data.text;

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

    await supabase.from('memoria').insert([
      { user_id: 'default', pregunta: transcripcion, respuesta: respuestaTexto },
    ]);

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
    console.error('❌ Error procesando audio:', error.message);
    res.status(500).json({ error: 'Ocurrió un error procesando tu audio.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
