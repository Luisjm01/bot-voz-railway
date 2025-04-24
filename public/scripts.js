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
    // Show thinking indicator
    thinking.classList.remove('hidden');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Hide thinking
    thinking.classList.add('hidden');

    // Append message to chat
    const message = document.createElement('div');
    message.textContent = 'Toscanito: ¡Aquí está tu respuesta! 😊';
    chat.appendChild(message);

    // Scroll to bottom
    chat.scrollTop = chat.scrollHeight;
  });
});
