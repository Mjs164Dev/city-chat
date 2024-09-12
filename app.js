require('dotenv').config();
const OpenAI = require('openai');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// When a new client connects
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for a message from the client
  socket.on('userMessage', async (userMessage) => {
    console.log('User message received:', userMessage);

    try {
      // Create a new thread for the conversation
      const thread = await openai.beta.threads.create();
      
      // Add the user message to the thread
      const message = await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: userMessage
      });

      // Run the assistant on the thread and stream the response back to the client
      const run = openai.beta.threads.runs.stream(thread.id, {
        assistant_id: process.env.ASSISTANT_ID
      });

      run.on('textCreated', () => socket.emit('botMessage', '\n'))
         .on('textDelta', (textDelta) => socket.emit('botMessage', textDelta.value))
         .on('toolCallDelta', (toolCallDelta) => {
            if (toolCallDelta.type === 'code_interpreter') {
              socket.emit('botMessage', toolCallDelta.code_interpreter.input || '');
              toolCallDelta.code_interpreter.outputs.forEach(output => {
                if (output.type === "logs") {
                  socket.emit('botMessage', `\noutput > ${output.logs}`);
                }
              });
            }
         });

    } catch (error) {
      console.error('Error:', error);
      socket.emit('botMessage', 'Error occurred while fetching the assistant’s response.');
    }
  });

  // When a client disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve the chat page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});