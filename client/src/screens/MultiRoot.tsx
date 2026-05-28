// Extracted so App.tsx can React.lazy() this, keeping the multi-mode
// dependency tree (LobbyScreen, useMultiSocket, socket.io listeners) out
// of the initial bundle that solo users download.

import React from 'react';
import { useActiveRoom } from '../hooks/useActiveRoom';
import { useMultiSocket } from '../hooks/useMultiSocket';
import { LobbyScreen } from './LobbyScreen';
import { TableScreen } from './TableScreen';

export default function MultiRoot() {
  useMultiSocket();
  const room = useActiveRoom();
  if (!room || room.status === 'waiting') return <LobbyScreen />;
  return <TableScreen />;
}
