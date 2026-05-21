import { 
  Room, Player, Card, Round, ActivePlayerState, drawCard, calculateHandValue, isBlackjack, isBusted
} from '@blackjack/shared';

export function startBettingPhase(room: Room) {
  room.status = 'betting';
  room.currentRound = {
    dealerCards: [],
    activePlayers: room.players.map(p => ({
      playerId: p.id,
      hands: [
        {
          id: `${p.id}-hand-1`,
          cards: [],
          bet: 0, // 0 until the player commits via Deal; allBetsPlaced check waits on this
          isFinished: false,
          canSplit: false,
          canDouble: true,
          canSurrender: true,
        }
      ],
      currentHandIndex: 0,
    })),
    turnIndex: -1, // -1 means betting phase
    insuranceOffered: false,
    insuranceClosed: false,
  };
}

export function placeBet(room: Room, playerId: string, amount: number) {
  if (room.status !== 'betting' || !room.currentRound) return;
  
  const activePlayer = room.currentRound.activePlayers.find(p => p.playerId === playerId);
  const player = room.players.find(p => p.id === playerId);
  
  if (activePlayer && player) {
    if (player.chips >= amount) {
      player.chips -= amount;
      player.lastBet = amount;
      activePlayer.hands[0].bet = amount;
      
      const allBetsPlaced = room.currentRound.activePlayers.every(p => p.hands[0].bet > 0);
      if (allBetsPlaced) {
         dealInitialCards(room);
      }
    }
  }
}

export function dealInitialCards(room: Room) {
  if (!room.currentRound) return;
  
  room.status = 'playing';
  let shoe = room.shoe;

  for (let i = 0; i < 2; i++) {
    for (const ap of room.currentRound.activePlayers) {
      const { card, newShoe } = drawCard(shoe, true);
      shoe = newShoe;
      ap.hands[0].cards.push(card);
    }
    const isFaceUp = i === 0;
    const { card, newShoe } = drawCard(shoe, isFaceUp);
    shoe = newShoe;
    room.currentRound.dealerCards.push(card);
  }

  room.shoe = shoe;

  // Check for dealer Ace to offer insurance
  const dealerShowsAce = room.currentRound.dealerCards[0]?.rank === 'A';
  if (dealerShowsAce && room.settings.askInsurance) {
    room.currentRound.insuranceOffered = true;
    // Don't start player turns yet - wait for insurance decisions
    // Players with blackjack will auto-decline but still get offered
  }

  for (const ap of room.currentRound.activePlayers) {
    if (isBlackjack(ap.hands[0].cards)) {
      ap.hands[0].isFinished = true;
      ap.hands[0].result = 'blackjack';
      // Even with blackjack, they can take insurance if dealer shows Ace
    }
    
    const cards = ap.hands[0].cards;
    if (cards[0].rank === cards[1].rank) {
       ap.hands[0].canSplit = true;
    }
  }

  // If insurance is offered, don't move to turns yet
  // The client will show insurance prompt, then call closeInsurancePhase
  if (!room.currentRound.insuranceOffered) {
    moveToNextActiveTurn(room);
  }
}

export function handlePlayerAction(room: Room, playerId: string, action: string) {
  if (room.status !== 'playing' || !room.currentRound) return;

  const currentActivePlayer = room.currentRound.activePlayers[room.currentRound.turnIndex];
  if (!currentActivePlayer || currentActivePlayer.playerId !== playerId) return;

  const currentHand = currentActivePlayer.hands[currentActivePlayer.currentHandIndex];
  if (currentHand.isFinished) return;

  let shoe = room.shoe;

  switch (action) {
    case 'hit': {
      const { card, newShoe } = drawCard(shoe, true);
      shoe = newShoe;
      currentHand.cards.push(card);
      currentHand.canDouble = false;
      currentHand.canSplit = false;

      if (isBusted(currentHand.cards)) {
        currentHand.isFinished = true;
        currentHand.result = 'loss';
      }
      break;
    }

    case 'stand': {
      currentHand.isFinished = true;
      break;
    }

    case 'double': {
      if (!currentHand.canDouble) return;
      
      const player = room.players.find(p => p.id === playerId);
      if (!player || player.chips < currentHand.bet) return; // Not enough chips

      player.chips -= currentHand.bet;
      currentHand.bet *= 2;

      const { card, newShoe } = drawCard(shoe, true);
      shoe = newShoe;
      currentHand.cards.push(card);
      
      currentHand.isFinished = true;
      if (isBusted(currentHand.cards)) {
        currentHand.result = 'loss';
      }
      break;
    }

    case 'surrender': {
      if (!currentHand.canSurrender) return;
      
      // Late surrender: lose half the bet, return half to player
      const player = room.players.find(p => p.id === playerId);
      if (!player) return;
      
      const refund = Math.floor(currentHand.bet / 2);
      player.chips += refund;
      
      currentHand.isFinished = true;
      currentHand.result = 'surrender';
      break;
    }

    case 'split': {
      if (!currentHand.canSplit) return;

      const player = room.players.find(p => p.id === playerId);
      if (!player || player.chips < currentHand.bet) return; // Not enough chips

      // Deduct chips for second hand
      player.chips -= currentHand.bet;

      // Split the cards
      const splitCard = currentHand.cards.pop()!;
      
      // Create new hand
      const newHand = {
        id: `${playerId}-hand-${currentActivePlayer.hands.length + 1}`,
        cards: [splitCard],
        bet: currentHand.bet,
        isFinished: false,
        canSplit: false,
        canDouble: true,
        canSurrender: false, // Cannot surrender after split
      };

      currentActivePlayer.hands.push(newHand);
      currentHand.canSplit = false;

      // Draw one card for each new hand to complete the pair
      const { card: card1, newShoe: shoe1 } = drawCard(shoe, true);
      currentHand.cards.push(card1);
      
      const { card: card2, newShoe: shoe2 } = drawCard(shoe1, true);
      newHand.cards.push(card2);
      
      shoe = shoe2;

      // Edge case: Splitting Aces usually means you only get one card and cannot hit
      if (currentHand.cards[0].rank === 'A') {
        currentHand.isFinished = true;
        newHand.isFinished = true;
      }
      
      // After split, original hand can no longer surrender
      currentHand.canSurrender = false;
      break;
    }
  }
  
  // After first action (hit, double, etc), can no longer surrender
  if (action === 'hit' || action === 'double' || action === 'split') {
    currentHand.canSurrender = false;
  }

  room.shoe = shoe;

  // Check if current hand is done. moveToNextActiveTurn knows how to skip
  // over any already-finished hands (e.g. both halves of an Ace split, which
  // are force-finished after one card each) and advance to the dealer when
  // this player has no unfinished hands left.
  if (currentHand.isFinished) {
    moveToNextActiveTurn(room);
  }
}

export function moveToNextActiveTurn(room: Room) {
  if (!room.currentRound) return;
  
  const activePlayers = room.currentRound.activePlayers;
  
  if (room.currentRound.turnIndex === -1) {
    room.currentRound.turnIndex = 0;
  }

  while (room.currentRound.turnIndex < activePlayers.length) {
    const ap = activePlayers[room.currentRound.turnIndex];
    
    // Find first unfinished hand for this player
    const unfinishedHandIndex = ap.hands.findIndex(h => !h.isFinished);
    
    if (unfinishedHandIndex !== -1) {
      ap.currentHandIndex = unfinishedHandIndex;
      return; // It is this player's turn
    }
    
    room.currentRound.turnIndex++;
  }

  // Everyone is done.
  playDealerTurn(room);
}

function playDealerTurn(room: Room) {
  if (!room.currentRound) return;
  
  room.status = 'resolving';
  
  if (room.currentRound.dealerCards.length > 1) {
     room.currentRound.dealerCards[1].faceUp = true;
  }

  let shoe = room.shoe;
  let dealerValue = calculateHandValue(room.currentRound.dealerCards);

  // Check if all players busted or got blackjack. If so, dealer doesn't need to draw.
  const allPlayersFinishedPrior = room.currentRound.activePlayers.every(ap => 
    ap.hands.every(h => h.result === 'loss' || h.result === 'blackjack')
  );

  if (!allPlayersFinishedPrior) {
    while (
      dealerValue.total < 17 || 
      (dealerValue.total === 17 && dealerValue.isSoft && room.settings.dealerHitsSoft17)
    ) {
      const { card, newShoe } = drawCard(shoe, true);
      shoe = newShoe;
      room.currentRound.dealerCards.push(card);
      dealerValue = calculateHandValue(room.currentRound.dealerCards);
    }
  }
  
  room.shoe = shoe;
  resolveRound(room, dealerValue.total);
}

export function placeInsuranceBet(room: Room, playerId: string, amount: number) {
  if (!room.currentRound || !room.currentRound.insuranceOffered || room.currentRound.insuranceClosed) {
    return;
  }
  
  const activePlayer = room.currentRound.activePlayers.find(p => p.playerId === playerId);
  const player = room.players.find(p => p.id === playerId);
  
  if (!activePlayer || !player) return;
  
  // Insurance bet can be up to half the original bet
  const mainHand = activePlayer.hands[0];
  const maxInsurance = Math.floor(mainHand.bet / 2);
  const insuranceAmount = Math.min(amount, maxInsurance);
  
  if (player.chips >= insuranceAmount && insuranceAmount > 0) {
    player.chips -= insuranceAmount;
    mainHand.insuranceBet = insuranceAmount;
  }
}

export function declineInsurance(room: Room, playerId: string) {
  if (!room.currentRound || !room.currentRound.insuranceOffered) return;
  
  const activePlayer = room.currentRound.activePlayers.find(p => p.playerId === playerId);
  if (activePlayer) {
    // Mark as declined (insuranceBet remains undefined)
    activePlayer.hands[0].insuranceBet = 0;
  }
}

export function closeInsurancePhase(room: Room) {
  if (!room.currentRound || !room.currentRound.insuranceOffered) return;
  
  room.currentRound.insuranceClosed = true;
  
  // Check if dealer has blackjack
  const dealerHasBlackjack = isBlackjack(room.currentRound.dealerCards);
  
  // Resolve insurance bets
  for (const ap of room.currentRound.activePlayers) {
    const player = room.players.find(p => p.id === ap.playerId);
    if (!player) continue;
    
    for (const hand of ap.hands) {
      if (hand.insuranceBet && hand.insuranceBet > 0) {
        if (dealerHasBlackjack) {
          // Insurance pays 2:1
          player.chips += hand.insuranceBet * 3; // Return bet + 2:1 winnings
        }
        // If dealer doesn't have BJ, insurance bet is lost (already deducted)
      }
    }
  }
  
  // If dealer has blackjack, round ends immediately (except for players with blackjack who push)
  if (dealerHasBlackjack) {
    room.status = 'resolving';
    room.currentRound.dealerCards[1].faceUp = true;
    
    // Auto-resolve all non-blackjack hands as losses
    for (const ap of room.currentRound.activePlayers) {
      for (const hand of ap.hands) {
        if (hand.result !== 'blackjack') {
          hand.isFinished = true;
          hand.result = 'loss';
        }
      }
    }
    
    // No need for dealer turn, just broadcast final state
    return;
  }
  
  // Continue to player turns
  moveToNextActiveTurn(room);
}

function resolveRound(room: Room, dealerTotal: number) {
  if (!room.currentRound) return;
  
  const dealerBusts = dealerTotal > 21;
  const dealerHasBlackjack = isBlackjack(room.currentRound.dealerCards);

  for (const ap of room.currentRound.activePlayers) {
    const player = room.players.find(p => p.id === ap.playerId);
    if (!player) continue;

    for (const hand of ap.hands) {
      // Handle surrender
      if (hand.result === 'surrender') {
        // Already handled during action - player got half bet back
        continue;
      }
      
      if (hand.result === 'blackjack') {
        if (dealerHasBlackjack) {
          hand.result = 'push';
          player.chips += hand.bet;
        } else {
          player.chips += hand.bet + (hand.bet * 1.5);
        }
        continue;
      }

      // If they busted during play, they already lost
      if (hand.result === 'loss') continue;

      const handValue = calculateHandValue(hand.cards).total;
      
      if (dealerBusts || handValue > dealerTotal) {
        hand.result = 'win';
        player.chips += hand.bet * 2;
      } else if (handValue < dealerTotal) {
        hand.result = 'loss';
      } else {
        hand.result = 'push';
        player.chips += hand.bet;
      }
      
      hand.isFinished = true;
    }
  }
}
