const socket = io();

const output = document.getElementById('output');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');

// Variable to accumulate assistant's response
let assistantResponse = "";

// When the user sends a message
sendButton.addEventListener('click', () => {
  const userMessage = messageInput.value;

  // Send message to the server
  if (userMessage.trim()) {
    socket.emit('userMessage', userMessage);

    // Display user message without "You:" and right-justified
    output.innerHTML += `<p class="you">${userMessage}</p>`;
    messageInput.value = ''; // Clear input field
  }

  // Reset assistant response for new message
  assistantResponse = "";
});

// When a message is received from the assistant
socket.on('botMessage', (botMessage) => {
  // Accumulate the assistant's response text
  assistantResponse += botMessage;

  // Update the chat window, replacing the assistant's response dynamically
  const existingAssistantMessage = document.querySelector('#assistant-message');
  if (existingAssistantMessage) {
    existingAssistantMessage.innerHTML = assistantResponse;
  } else {
    // Display the assistant's message without "assistant >" and left-justified
    output.innerHTML += `<p id="assistant-message" class="assistant">${assistantResponse}</p>`;
  }

  // Scroll to the bottom
  output.scrollTop = output.scrollHeight;
});