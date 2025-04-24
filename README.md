# Toscanito Bot de Voz

Interfaz web del bot de voz "Toscanito", estilo Toscana, sirve audio y chat.

## Estructura

- server.js             - Servidor Express para servir archivos estáticos.
- package.json          - Dependencias y scripts.
- env_example.txt       - Variables de entorno necesarias.
- public/
  - index.html          - Interfaz principal.
  - style.css           - Estilos con paleta Toscana.
  - scripts.js          - Lógica de UI (grabación, animación, chat).
  - assets/
    - toscanito.png     - Ilustración de Toscanito.
    - thinking.gif      - Indicador de "pensando".

## Instalación

1. Clona o descarga el proyecto.
2. Copia `env_example.txt` a `.env` y completa tus credenciales.
3. Ejecuta:
   ```bash
   npm install
   npm start
   ```
4. Abre `http://localhost:8080` en tu navegador.

¡Disfruta de Toscanito! 😊
