import {
  Room, Player, GameSettings, createShoe, shuffleShoe, moveToNextActiveTurn,
} from '@blackjack/shared';

const DEFAULT_SETTINGS: GameSettings = {
  deckCount: 6,
  dealerHitsSoft17: true,
  askInsurance: true,
  autoLastBet: true,
};

// In-memory store (will migrate to Redis later)
const rooms = new Map<string, Room>();

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function createOrJoinRoom(roomCode: string, player: Player, customSettings?: GameSettings): Room {
  let room = rooms.get(roomCode);

  if (!room) {
    // Create new room - use custom settings if provided (from host)
    const settings = customSettings || DEFAULT_SETTINGS;
    console.log(`[GameManager] Creating new room: ${roomCode} with ${settings.deckCount} decks`);
    const shoe = shuffleShoe(createShoe(settings.deckCount));
    
    room = {
      id: roomCode,
      hostId: player.id,
      players: [player],
      status: "waiting",
      settings,
      shoe,
      currentRound: null,
    };
    rooms.set(roomCode, room);
  } else {
    // Join existing room
    const isAlreadyInRoom = room.players.find(p => p.id === player.id);
    if (!isAlreadyInRoom && room.players.length < 7) {
      console.log(`[GameManager] Player ${player.nickname} joined room: ${roomCode}`);
      room.players.push(player);
    }
  }

  return room;
}

export function updateRoomSettings(roomCode: string, settings: GameSettings): Room | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  
  // Update settings
  room.settings = settings;
  
  // Recreate shoe if deck count changed
  room.shoe = shuffleShoe(createShoe(settings.deckCount));
  
  console.log(`[GameManager] Updated room ${roomCode} settings: ${settings.deckCount} decks, soft17=${settings.dealerHitsSoft17}`);
  return room;
}

export function leaveRoom(roomCode: string, playerId: string): Room | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.players = room.players.filter(p => p.id !== playerId);

  // Clean up the active round so the game doesn't hang on the missing seat.
  // Bets are forfeited (chips were already deducted on placeBet).
  if (room.currentRound) {
    const apIndex = room.currentRound.activePlayers.findIndex(ap => ap.playerId === playerId);
    if (apIndex !== -1) {
      if (room.status === 'betting') {
        // Drop their seat entirely so allBetsPlaced isn't blocked by a $0 bet.
        room.currentRound.activePlayers.splice(apIndex, 1);
        if (room.currentRound.turnIndex > apIndex) {
          room.currentRound.turnIndex -= 1;
        }
      } else {
        // Mid-hand: forfeit their hands. Keeps activePlayers index stable for turn pointer.
        const ap = room.currentRound.activePlayers[apIndex];
        ap.hands.forEach(h => {
          if (!h.isFinished) {
            h.isFinished = true;
            h.result = 'loss';
          }
        });
        if (room.status === 'playing' && room.currentRound.turnIndex === apIndex) {
          moveToNextActiveTurn(room);
        }
      }
    }
  }

  if (room.players.length === 0) {
    console.log(`[GameManager] Room ${roomCode} is empty, destroying.`);
    rooms.delete(roomCode);
    return null;
  }

  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    console.log(`[GameManager] Host left room ${roomCode}; new host: ${room.hostId}`);
  }

  return room;
}
