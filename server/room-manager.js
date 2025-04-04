/**
 * Room Manager
 * Handles room state, participants, and voting operations
 */

// In-memory store for active rooms
const rooms = new Map();

/**
 * Create or get a room by ID
 */
function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      participants: {},
      votes: {},
      votesRevealed: false,
      cardSequence: 'tshirt',
      voteDistribution: {}
    });
  }
  return rooms.get(roomId);
}

/**
 * Add a participant to a room
 */
function addParticipant(roomId, username, role = 'player') {
  const room = getRoom(roomId);
  
  room.participants[username] = {
    name: username,
    hasVoted: false,
    isActive: true,
    role: role,
    vote: null
  };
  
  return room;
}

/**
 * Remove a participant from a room
 */
function removeParticipant(roomId, username) {
  const room = getRoom(roomId);
  
  if (room.participants[username]) {
    delete room.participants[username];
  }
  
  if (room.votes[username]) {
    delete room.votes[username];
  }
  
  // If room is empty, remove it completely
  if (Object.keys(room.participants).length === 0) {
    rooms.delete(roomId);
    return null;
  }
  
  return room;
}

/**
 * Record a vote from a participant
 */
function submitVote(roomId, username, vote) {
  const room = getRoom(roomId);
  
  room.votes[username] = vote;
  
  if (room.participants[username]) {
    room.participants[username].hasVoted = true;
    room.participants[username].vote = vote;
  }
  
  return room;
}

/**
 * Reveal votes for a room
 */
function revealVotes(roomId) {
  const room = getRoom(roomId);
  
  room.votesRevealed = true;
  
  // Calculate vote distribution
  room.voteDistribution = calculateVoteDistribution(room.votes);
  
  return room;
}

/**
 * Reset voting in a room
 */
function resetVoting(roomId) {
  const room = getRoom(roomId);
  
  room.votes = {};
  room.votesRevealed = false;
  room.voteDistribution = {};
  
  // Reset voting status for all participants
  Object.keys(room.participants).forEach(name => {
    if (room.participants[name]) {
      room.participants[name].hasVoted = false;
      room.participants[name].vote = null;
    }
  });
  
  return room;
}

/**
 * Change the card sequence for a room
 */
function changeCardSequence(roomId, sequence) {
  const room = getRoom(roomId);
  
  // Validate sequence
  const validSequences = ['tshirt', 'fibonacci', 'modified', 'powers'];
  if (validSequences.includes(sequence)) {
    room.cardSequence = sequence;
  }
  
  return room;
}

/**
 * Calculate vote distribution stats
 */
function calculateVoteDistribution(votes) {
  const distribution = {};
  
  Object.values(votes).forEach(vote => {
    if (!vote) return;
    if (!distribution[vote]) {
      distribution[vote] = 1;
    } else {
      distribution[vote]++;
    }
  });
  
  return distribution;
}

module.exports = {
  getRoom,
  addParticipant,
  removeParticipant,
  submitVote,
  revealVotes,
  resetVoting,
  changeCardSequence
};