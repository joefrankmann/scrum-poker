/**
 * Socket.IO Client Integration
 * Handles all socket communication with the server
 */

// Socket.IO connection
let socket;

/**
 * Initialize socket connection and event handlers
 */
function initializeSocketConnection() {
  // Connect to Socket.IO server
  socket = io();
  
  // Socket.IO Event Listeners
  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('connect_error', handleConnectionError);
  socket.on('error_message', handleErrorMessage);
  socket.on('user_joined', handleUserJoined);
  socket.on('user_left', handleUserLeft);
  socket.on('vote_submitted', handleVoteSubmitted);
  socket.on('votes_revealed', handleVotesRevealed);
  socket.on('voting_reset', handleVotingReset);
  socket.on('sequence_changed', handleSequenceChanged);
  socket.on('sync_state', handleStateSync);
}

/**
 * Handle socket connection
 */
function handleConnect() {
  console.log('Connected to server');
  updateConnectionStatus('connected');
  appState.connected = true;
  
  // If we were previously in a room, rejoin it
  if (appState.username && appState.roomId) {
    socket.emit('join_room', {
      username: appState.username,
      roomId: appState.roomId,
      role: appState.role
    });
  }
}

/**
 * Handle socket disconnection
 */
function handleDisconnect() {
  console.log('Disconnected from server');
  updateConnectionStatus('disconnected');
  appState.connected = false;
}

/**
 * Handle connection error
 */
function handleConnectionError(error) {
  console.error('Connection error:', error);
  updateConnectionStatus('error');
}

/**
 * Handle error message from server
 */
function handleErrorMessage(data) {
  showToast(data.message, 'error');
}

/**
 * Handle user joined event
 */
function handleUserJoined(data) {
  console.log('User joined:', data.username, 'as', data.role || 'player');
  
  // Update our participants list with the one from the server
  if (data.participants) {
    updateParticipants(data.participants);
  } else {
    // Just add the new user if full participant list wasn't provided
    addParticipant(data.username, data.role || 'player');
  }
  
  // Show notification for others joining
  if (data.username !== appState.username) {
    const roleText = data.role === 'observer' ? 'observer' : 'player';
    showToast(`${data.username} has joined the session as ${roleText}`, 'info');
  }
  
  // Update UI
  updateParticipantsList(data.username);
}

/**
 * Handle user left event
 */
function handleUserLeft(data) {
  console.log('User left:', data.username);
  
  // If full participants list is provided, use it
  if (data.participants) {
    updateParticipants(data.participants);
  } else {
    // Otherwise just remove the user who left
    removeParticipant(data.username);
  }
  
  showToast(`${data.username} has left the session`, 'warning');
  
  // Update UI
  updateParticipantsList();
  updateVotesList();
  checkAllVoted();
}

/**
 * Handle vote submitted event
 */
function handleVoteSubmitted(data) {
  console.log('Vote submitted by:', data.username);
  
  // Update participants if provided
  if (data.participants) {
    updateParticipants(data.participants);
  } else {
    // Just update the specific participant
    if (!appState.participants[data.username]) {
      addParticipant(data.username, 'player'); // Assume player since only players can vote
      appState.participants[data.username].hasVoted = true;
    } else {
      appState.participants[data.username].hasVoted = true;
    }
  }
  
  // Update votes if provided
  if (data.votes) {
    updateVotes(data.votes);
  } else {
    // We'll set the vote to null since we don't know it yet
    // It will be revealed later
    appState.votes[data.username] = null;
  }
  
  // Show notification for others' votes
  if (data.username !== appState.username) {
    showToast(`${data.username} has voted`, 'info');
  }
  
  // Update UI
  updateParticipantsList();
  updateVotesList();
  checkAllVoted();
}

/**
 * Handle votes revealed event
 */
function handleVotesRevealed(data) {
  console.log('Votes revealed by:', data.revealedBy);
  appState.votesRevealed = true;
  
  // Update votes if provided
  if (data.votes) {
    updateVotes(data.votes);
  }
  
  // Update vote distribution
  if (data.voteDistribution) {
    appState.voteDistribution = data.voteDistribution;
  } else {
    // Calculate distribution locally if server didn't provide it
    calculateVoteDistribution();
  }
  
  // Show who revealed the votes
  const revealer = data.revealedBy === appState.username ? 'You' : data.revealedBy;
  showToast(`${revealer} revealed the votes!`, 'success');
  
  // Update UI
  updateVotesList();
  updateVoteDistribution();
  calculateStats();
  document.getElementById('revealVotes').disabled = true;

  // Check for consensus in T-shirt size mode
  if (appState.currentSequence === 'tshirt') {
    checkConsensusAndCelebrate();
  }
}

/**
 * Handle voting reset event
 */
function handleVotingReset(data) {
  console.log('Voting reset by:', data.resetBy);
  
  // Reset voting state
  resetVotingState();
  
  // Update participants if provided
  if (data.participants) {
    updateParticipants(data.participants);
  }
  
  // Show who reset the voting
  const resetter = data.resetBy === appState.username ? 'You' : data.resetBy;
  showToast(`${resetter} reset the voting`, 'info');
  
  // Update UI
  renderCardDeck();
  updateVotesList();
  updateVoteDistribution();
  updateParticipantsList();
  checkAllVoted();
  
  // Reset buttons
  document.getElementById('submitVote').disabled = true;
  document.getElementById('revealVotes').disabled = true;
  
  // Reset stats
  document.getElementById('averageValue').textContent = '-';
  document.getElementById('medianValue').textContent = '-';
  document.getElementById('modeValue').textContent = '-';
  
  // Remove selection feedback if exists
  const existingFeedback = document.querySelector('.selection-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
}

/**
 * Handle sequence changed event
 */
function handleSequenceChanged(data) {
  console.log('Card sequence changed to:', data.cardSequence, 'by:', data.changedBy);
  
  if (data.cardSequence && appState.cardSequences[data.cardSequence]) {
    changeCardSequence(data.cardSequence);
    document.getElementById('cardSequence').value = data.cardSequence;
    
    // Re-render cards
    renderCardDeck();
    
    // Update display of stats based on sequence type
    updateStatsVisibility();
    
    // Show notification
    const changer = data.changedBy === appState.username ? 'You' : data.changedBy;
    showToast(`${changer} changed card sequence to ${data.cardSequence}`, 'info');

    // Check for consensus if switching to T-shirt mode and votes are already revealed
    if (data.cardSequence === 'tshirt' && appState.votesRevealed) {
      checkConsensusAndCelebrate();
    }
  }
}

/**
 * Handle state sync event
 */
function handleStateSync(data) {
  console.log('Received state sync:', data);
  
  // Update entire state from server
  if (data.participants) {
    updateParticipants(data.participants);
  }
  
  if (data.votes) {
    updateVotes(data.votes);
  }
  
  appState.votesRevealed = data.votesRevealed || false;
  
  if (data.cardSequence && appState.cardSequences[data.cardSequence]) {
    changeCardSequence(data.cardSequence);
    document.getElementById('cardSequence').value = data.cardSequence;
  }
  
  // Update UI
  renderCardDeck();
  updateParticipantsList();
  updateVotesList();
  updateStatsVisibility();
  
  if (appState.votesRevealed) {
    calculateVoteDistribution();
    updateVoteDistribution();
    calculateStats();
    document.getElementById('revealVotes').disabled = true;
  } else {
    checkAllVoted();
  }
  
  // Update UI based on role
  updateUIForRole();
}

// Socket emission functions

/**
 * Join a room
 */
function emitJoinRoom(username, roomId, role) {
  socket.emit('join_room', {
    username,
    roomId,
    role
  });
}

/**
 * Submit a vote
 */
function emitSubmitVote(vote) {
  socket.emit('vote_submitted', {
    username: appState.username,
    roomId: appState.roomId,
    vote
  });
}

/**
 * Reveal votes
 */
function emitRevealVotes() {
  socket.emit('reveal_votes', {
    roomId: appState.roomId,
    username: appState.username
  });
}

/**
 * Reset voting
 */
function emitResetVoting() {
  socket.emit('reset_voting', {
    roomId: appState.roomId,
    username: appState.username
  });
}

/**
 * Change card sequence
 */
function emitSequenceChanged(sequence) {
  socket.emit('sequence_changed', {
    roomId: appState.roomId,
    sequence,
    username: appState.username
  });
}

/**
 * Leave room
 */
function emitLeaveRoom() {
  socket.emit('leave_room', {
    username: appState.username,
    roomId: appState.roomId
  });
}