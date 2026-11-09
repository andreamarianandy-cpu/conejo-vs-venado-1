const MAX_JUGADORES = 59; // Límite estricto en el servidor
const TIEMPO_RECONEXION = 60; // Segundos de reserva de lugar
const ENERGIA_POR_TRIANGULO = 21; // Segundos por triángulo

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.ipAttempts = new Map();
  }

  generateCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  handleCreate(socket, mode, nickname, ip) {
    const code = this.generateCode();
    const room = {
      code,
      mode,
      hostId: socket.id,
      players: new Map(),
      started: false,
      flagPosition: { x: 0, y: -2500 },
      triangles: []
    };
    this.rooms.set(code, room);
    this.handleJoin(socket, code, nickname, null, ip);
  }

  handleJoin(socket, code, nickname, token, ip) {
    const attempts = this.ipAttempts.get(ip) || 0;
    if (attempts > 10) {
      return socket.emit('error_msg', 'Demasiados intentos fallidos. Intenta más tarde.');
    }

    const room = this.rooms.get(code);
    if (!room) {
      this.ipAttempts.set(ip, attempts + 1);
      return socket.emit('error_msg', 'Sala no encontrada.');
    }

    if (room.players.size >= MAX_JUGADORES) {
      return socket.emit('error_msg', 'Sala llena (máximo 59 jugadores).');
    }

    if (room.started && !token) {
      return socket.emit('error_msg', 'La partida ya empezó.');
    }

    socket.join(code);
    const team = room.players.size % 2 === 0 ? 'blue' : 'red';
    const playerToken = token || Math.random().toString(36).substring(2);

    const player = {
      id: socket.id,
      nickname: nickname || 'Jugador',
      team,
      x: team === 'blue' ? -400 : 400,
      y: 0,
      energy: ENERGIA_POR_TRIANGULO,
      token: playerToken,
      reconnecting: false
    };

    room.players.set(socket.id, player);
    socket.emit('joined_room', { code, token: playerToken, player });
    this.io.to(code).emit('room_update', Array.from(room.players.values()));
  }

  handleDisconnect(socketId) {
    this.rooms.forEach((room, code) => {
      if (room.players.has(socketId)) {
        const player = room.players.get(socketId);
        player.reconnecting = true;
        this.io.to(code).emit('player_reconnecting', { id: socketId });

        setTimeout(() => {
          if (player.reconnecting) {
            room.players.delete(socketId);
            if (room.hostId === socketId && room.players.size > 0) {
              room.hostId = room.players.keys().next().value;
            }
            this.io.to(code).emit('room_update', Array.from(room.players.values()));
          }
        }, TIEMPO_RECONEXION * 1000);
      }
    });
  }
}

module.exports = { RoomManager };