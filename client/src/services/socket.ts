import { io, Socket } from 'socket.io-client';

// Connect to local server for now
// NOTE: For Android Emulator you might need 'http://10.0.2.2:3001'
// const SOCKET_URL = 'http://192.168.0.64:3001';
// const SOCKET_URL = 'https://fdf11ee1cf71fc.lhr.life';
const SOCKET_URL = 'http://localhost:3001';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});
