const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { RoomManager } = require('./rooms');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
const roomManager = new RoomManager(io);

app.use(express.static(path.join(__dirname, '../public')));

io.on('connection', (socket) => {
  const ip = socket.handshake.address;

  socket.on('join_room', ({ code, nickname, reconnectToken }) => {
    roomManager.handleJoin(socket, code, nickname, reconnectToken, ip);
  });

  socket.on('create_room', ({ mode, nickname }) => {
    roomManager.handleCreate(socket, mode, nickname, ip);
  });

  socket.on('input', (inputData) => {
    roomManager.handleInput(socket.id, inputData);
  });

  socket.on('kick_player', ({ targetId }) => {
    roomManager.handleKick(socket.id, targetId);
  });

  socket.on('start_game', () => {
    roomManager.handleStartGame(socket.id);
  });

  socket.on('disconnect', () => {
    roomManager.handleDisconnect(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});