
# Bot de Voz con Node.js, OpenAI, Whisper y ElevenLabs

Este proyecto implementa un bot de voz que graba audio en el navegador (Mac y iPhone compatible), lo transcribe usando Whisper de OpenAI, genera una respuesta con ChatGPT y convierte esa respuesta en voz con ElevenLabs.

## Tecnologías utilizadas

- Node.js + Express
- OpenAI Whisper y GPT
- ElevenLabs (API de voz)
- Supabase (memoria opcional)
- Railway (despliegue automático)

## Variables de entorno necesarias (en Railway)

- `OPENAI_API_KEY`
- `ELEVEN_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
