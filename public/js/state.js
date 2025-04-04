/**
 * Application State
 * Central state management for the client-side application
 */

// Global state object
const appState = {
  username: '',
  roomId: '',
  role: 'player', // Default role is player
  selectedCard: null,
  votes: {},
  votesRevealed: false,
  participants: {},
  voteDistribution: {}, // To store count of each vote
  cardSequences: {
    fibonacci: ['1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'],
    modified: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?'],
    tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
    powers: ['1', '2', '4', '8', '16', '32', '64', '?']
  },
  currentSequence: 'tshirt',
  connected: false
};

/**
 * Calculate vote distribution stats
 */
function calculateVoteDistribution() {
  const distribution = {};
  
  Object.values(appState.votes).forEach(vote => {
    if (!vote) return; // Skip null/undefined votes
    
    if (!distribution[vote]) {
      distribution[vote] = 1;
    } else {
      distribution[vote]++;
    }
  });
  
  appState.voteDistribution = distribution;
}

/**
 * Check if all participants have voted
 * @returns {boolean} True if all participants have voted
 */
function haveAllVoted() {
  // Count only players (not observers) when checking if all voted
  const players = Object.values(appState.participants).filter(p => p.role !== 'observer');
  
  // If no players, return false
  if (players.length === 0) {
    return false;
  }
  
  // Check if all players have voted
  return players.every(p => p.hasVoted);
}

/**
 * Reset the voting state (without notifying server)
 */
function resetVotingState() {
  appState.votesRevealed = false;
  appState.votes = {};
  appState.voteDistribution = {};
  appState.selectedCard = null;
  
  // Reset voting status for all participants
  Object.keys(appState.participants).forEach(name => {
    if (appState.participants[name]) {
      appState.participants[name].hasVoted = false;
      appState.participants[name].vote = null;
    }
  });
}

/**
 * Add a new participant
 * @param {string} username - Username of the participant
 * @param {string} role - Role of the participant ('player' or 'observer')
 */
function addParticipant(username, role = 'player') {
  appState.participants[username] = {
    name: username,
    hasVoted: false,
    isActive: true,
    role: role,
    vote: null
  };
}

/**
 * Remove a participant
 * @param {string} username - Username of the participant to remove
 */
function removeParticipant(username) {
  if (appState.participants[username]) {
    delete appState.participants[username];
  }
  
  if (appState.votes[username]) {
    delete appState.votes[username];
  }
}

/**
 * Update the state with server-provided participants
 * @param {Object} participants - Participants object from server
 */
function updateParticipants(participants) {
  if (participants) {
    appState.participants = participants;
  }
}

/**
 * Update the state with server-provided votes
 * @param {Object} votes - Votes object from server
 */
function updateVotes(votes) {
  if (votes) {
    appState.votes = votes;
  }
}

/**
 * Record a vote for the current user
 * @param {string} value - The selected card value
 */
function recordUserVote(value) {
  appState.votes[appState.username] = value;
  
  if (appState.participants[appState.username]) {
    appState.participants[appState.username].hasVoted = true;
    appState.participants[appState.username].vote = value;
  }
}

/**
 * Change the current card sequence
 * @param {string} sequence - The new card sequence name
 */
function changeCardSequence(sequence) {
  if (appState.cardSequences[sequence]) {
    appState.currentSequence = sequence;
  }
}