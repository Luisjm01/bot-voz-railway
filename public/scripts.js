document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('record-button');
  const thinking = document.getElementById('thinking-indicator');
  const chat = document.getElementById('chat-container');

  // Fade-in button
  button.style.opacity = 0;
  setTimeout(() => {
    button.style.transition = 'opacity 1s';
    button.style.opacity = 1;
  }, 100);

  button.addEventListener('click', async () => {
    // Simulate user message
    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.textContent = 'Usuario: prueba...';
    chat.appendChild(userMsg);

    // Show thinking
    thinking.classList.remove('hidden');
    await new Promise(r => setTimeout(r, 2000));
    thinking.classList.add('hidden');

    // Simulate bot response
    const botMsg = document.createElement('div');
    botMsg.className = 'message bot';
    botMsg.textContent = 'Toscanito: ¡Aquí está tu respuesta! 😊';
    chat.appendChild(botMsg);

    // Scroll
    chat.scrollTop = chat.scrollHeight;
  });
});
