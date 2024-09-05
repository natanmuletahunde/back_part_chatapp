const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust this to match your client URL if different
    methods: ["GET", "POST"]
  }
});

// Use helmet to set security-related HTTP headers, including CSP
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts
      imgSrc: ["'self'", "data:", "http://localhost:3001", "https://cdn5.vectorstock.com/i/1000x1000/58/04/chat-messaging-app-logo-design-vector-21795804.jpg"],
      connectSrc: ["'self'", "ws://localhost:3001"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
      // Add other directives as needed
    },
  })
);

app.use(cors());

// Array to store messages
let messages = [];

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  // Send the existing messages to the newly connected user
  socket.emit('init messages', messages);

  // Listen for new chat messages
  socket.on('chat message', (msg) => {
    const message = { id: socket.id + Date.now(), text: msg };
    messages.push(message);
    io.emit('chat message', message);
  });

  // Listen for message deletion
  socket.on('delete message', (msgId) => {
    messages = messages.filter(msg => msg.id !== msgId);
    io.emit('delete message', msgId);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Serve the index.html file or any other static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
server.listen(3001, () => {
  console.log('listening on *:3001');
});
