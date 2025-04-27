// scripts/upload_lexicon.js
require('dotenv').config();
const fs       = require('fs');
const path     = require('path');
const axios    = require('axios');
const FormData = require('form-data');

const API_KEY  = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const FILE_PATH = path.resolve(__dirname, '../assets/lexicons/spanish.pls');

async function main() {
  // 1) Crear el diccionario
  const form = new FormData();
  form.append('name', 'Toscanito_ES_SpanishRules');
  form.append('file', fs.createReadStream(FILE_PATH));

console.log("→ Leyendo fichero:", FILE_PATH);
console.log(fs.readFileSync(FILE_PATH, "utf8"));  

const createRes = await axios.post(
    'https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-file',
    form,
    { headers: { 
        ...form.getHeaders(),
        'xi-api-key': API_KEY 
      }
    }
  );
  const dictId = createRes.data.id;
  console.log('✅ Dictionary uploaded:', dictId);

  // 2) (Opcional) asignarlo como default a la voz
  await axios.post(
    `https://api.elevenlabs.io/v1/pronunciation-dictionaries/${dictId}/voices`,
    { voice_ids: [VOICE_ID] },
    {
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      }
    }
  );
  console.log('✅ Dictionary assigned to voice', VOICE_ID);

  // 3) Copia dictId en tu .env
  console.log(`Usa este ID en tu .env: ELEVENLABS_DICTIONARY_ID=${dictId}`);
}

main().catch(console.error);


