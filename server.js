const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;

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
  const voiceId = req.body.voz || 'hYYNmijq0aL07R8FAKj1';
  const audioBuffer = req.file?.buffer;

  if (!audioBuffer) {
    return res.status(400).json({ error: 'No se recibió el archivo de audio.' });
  }

  try {
    const tempInput = '/tmp/input.webm';
    const tempOutput = '/tmp/output.mp3';
    fs.writeFileSync(tempInput, audioBuffer);

    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(tempOutput);
    });

    const mp3Data = fs.readFileSync(tempOutput);
    const whisperResp = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      mp3Data,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'audio/mp3',
        },
        params: {
          model: 'whisper-1',
          response_format: 'json',
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
      { user_id: 'default', pregunta: transcripcion, respuesta: respuestaTexto }
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
        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
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
