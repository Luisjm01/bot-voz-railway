document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('record-button');
  const thinking = document.getElementById('thinking-indicator');
  const chat = document.getElementById('chat-container');

  // Fade-in animation on load
  button.style.opacity = 0;
  setTimeout(() => {
    button.style.transition = 'opacity 1s';
    button.style.opacity = 1;
  }, 100);

  button.addEventListener('click', async () => {
    thinking.classList.remove('hidden');
    await new Promise(resolve => setTimeout(resolve, 2000));
    thinking.classList.add('hidden');
    const message = document.createElement('div');
    message.textContent = 'Toscanito: ¡Aquí está tu respuesta! 😊';
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
  });
});
