import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Player, GameSettings } from '@blackjack/shared';
import { updateRoomSettings } from './gameManager';
import { createOrJoinRoom, leaveRoom, getRoom } from './gameManager';
import { startBettingPhase, placeBet, handlePlayerAction, placeInsuranceBet, declineInsurance, closeInsurancePhase } from './gameEngine';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.send('Blackjack Server is running!');
});

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  
  // Keep track of which room this socket is in for disconnects
  let currentRoom: string | null = null;
  let currentPlayerId: string | null = null;

  socket.on('join_room', (data: { roomCode: string, playerId: string, nickname: string, chips: number, settings?: GameSettings }) => {
    const { roomCode, playerId, nickname, chips, settings: clientSettings } = data;
    
    currentRoom = roomCode;
    currentPlayerId = playerId;
    
    socket.join(roomCode);
    
    const player: Player = { id: playerId, nickname, chips, lastBet: 10 };
    const room = createOrJoinRoom(roomCode, player, clientSettings);
    
    // We don't want to send the entire shoe to the clients (server authoritative)
    const sanitizedRoom = { ...room, shoe: [] };
    
    // Send full state to the player who just joined
    socket.emit('game_state', sanitizedRoom);
    
    // Tell everyone else in the room
    socket.to(roomCode).emit('player_joined', { player });
    
    // Also broadcast the updated full state to the whole room to keep UI in sync
    io.to(roomCode).emit('game_state', sanitizedRoom);
  });

  socket.on('update_settings', (settings: GameSettings) => {
    if (currentRoom && currentPlayerId) {
      const room = getRoom(currentRoom);
      if (room && room.hostId === currentPlayerId) {
        updateRoomSettings(currentRoom, settings);
        const sanitizedRoom = { ...room, shoe: [] };
        io.to(currentRoom).emit('game_state', sanitizedRoom);
      }
    }
  });

    socket.on('start_round', () => {
      if (currentRoom) {
        const room = getRoom(currentRoom);
        if (room && room.hostId === currentPlayerId) {
          startBettingPhase(room);
          const sanitizedRoom = { ...room, shoe: [] };
          io.to(currentRoom).emit('game_state', sanitizedRoom);
        }
      }
    });

    socket.on('place_bet', (data: { amount: number }) => {
      if (currentRoom && currentPlayerId) {
        const room = getRoom(currentRoom);
        if (room) {
          placeBet(room, currentPlayerId, data.amount);
          const sanitizedRoom = { ...room, shoe: [] };
          io.to(currentRoom).emit('game_state', sanitizedRoom);
        }
      }
    });

    socket.on('player_action', (data: { action: string }) => {
      if (currentRoom && currentPlayerId) {
        const room = getRoom(currentRoom);
        if (room) {
          handlePlayerAction(room, currentPlayerId, data.action);
          const sanitizedRoom = { ...room, shoe: [] };
          io.to(currentRoom).emit('game_state', sanitizedRoom);
        }
      }
    });

    socket.on('place_insurance', (data: { amount: number }) => {
      if (currentRoom && currentPlayerId) {
        const room = getRoom(currentRoom);
        if (room) {
          placeInsuranceBet(room, currentPlayerId, data.amount);
          const sanitizedRoom = { ...room, shoe: [] };
          io.to(currentRoom).emit('game_state', sanitizedRoom);
        }
      }
    });

    socket.on('decline_insurance', () => {
      if (currentRoom && currentPlayerId) {
        const room = getRoom(currentRoom);
        if (room) {
          declineInsurance(room, currentPlayerId);
          const sanitizedRoom = { ...room, shoe: [] };
          io.to(currentRoom).emit('game_state', sanitizedRoom);
        }
      }
    });

    socket.on('close_insurance_phase', () => {
      if (currentRoom) {
        const room = getRoom(currentRoom);
        if (room && room.hostId === currentPlayerId) {
          closeInsurancePhase(room);
          const sanitizedRoom = { ...room, shoe: [] };
          io.to(currentRoom).emit('game_state', sanitizedRoom);
        }
      }
    });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
    if (currentRoom && currentPlayerId) {
      const updatedRoom = leaveRoom(currentRoom, currentPlayerId);
      if (updatedRoom) {
        io.to(currentRoom).emit('player_left', { playerId: currentPlayerId });
        const sanitizedRoom = { ...updatedRoom, shoe: [] };
        io.to(currentRoom).emit('game_state', sanitizedRoom);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`♠️ ♥️ Blackjack Server running on http://localhost:${PORT} ♣️ ♦️`);
});
