
# Bot de Voz con Node.js, OpenAI, Whisper y ElevenLabs

Este proyecto implementa un bot de voz que graba audio en el navegador (Mac y iPhone compatible), lo transcribe usando Whisper de OpenAI, genera una respuesta con ChatGPT y convierte esa respuesta en voz con ElevenLabs.

## Tecnologías utilizadas

- Frontend: HTML, JS (AudioContext en WAV compatible con Safari)
- Backend: Node.js (Express, Multer, Axios)
- APIs: OpenAI (Whisper, ChatGPT), ElevenLabs, Supabase

## ¿Cómo usar?

1. Clona o descarga el repositorio:
   ```bash
   git clone <URL> o descarga ZIP
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea un archivo `.env` con tus claves:
   ```
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   ELEVENLABS_API_KEY=...
   OPENAI_API_KEY=...
   ```

4. Inicia el servidor:
   ```bash
   npm start
   ```

5. Abre en tu navegador:
   ```
   http://localhost:8080
   ```

## Créditos
Proyecto desarrollado con ❤️ para automatización por voz y aprendizaje de IA.
