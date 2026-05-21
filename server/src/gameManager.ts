import { 
  Room, Player, GameSettings, createShoe, shuffleShoe 
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
  
  if (room.players.length === 0) {
    console.log(`[GameManager] Room ${roomCode} is empty, destroying.`);
    rooms.delete(roomCode);
    return null;
  }

  // Assign new host if host left
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
  }

  return room;
}
