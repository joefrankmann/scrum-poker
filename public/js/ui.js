/**
 * UI Functions
 * Handles UI interactions and updates
 */

/**
 * Join session function
 * Handles the process of joining or creating a session
 */
function joinSession() {
  const nameInput = document.getElementById('nameInput');
  const roomCodeInput = document.getElementById('roomCodeInput');
  const observerRoleCheckbox = document.getElementById('observerRole');
  
  const name = nameInput.value.trim();
  let roomCode = roomCodeInput.value.trim();
  
  if (!name) {
    showToast('Please enter your name to join the session', 'warning');
    nameInput.focus();
    return;
  }
  
  // Generate a room code if not provided
  if (!roomCode) {
    roomCode = generateSessionCode();
  }
  
  // Set role based on checkbox
  const role = observerRoleCheckbox.checked ? 'observer' : 'player';
  
  // Update state
  appState.username = name;
  appState.roomId = roomCode;
  appState.role = role;
  
  // Update URL with room code only (not role) for easy sharing
  let newUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
  window.history.pushState({ path: newUrl }, '', newUrl);
  
  // Update room display
  document.getElementById('roomCodeDisplay').textContent = `Session Code: ${roomCode}`;
  
  // Hide join form, show main content
  document.getElementById('joinRoom').classList.add('hidden');
  document.getElementById('mainContent').classList.remove('hidden');
  
  // Add yourself to participants (will be updated by server)
  addParticipant(name, role);
  
  // Update UI immediately
  updateParticipantsList();
  renderCardDeck();
  updateUIForRole();
  
  // Join the room via Socket.IO
  if (appState.connected) {
    emitJoinRoom(name, roomCode, role);
  }
  
  saveToLocalStorage();
}

/**
 * Handle card sequence change
 */
function handleCardSequenceChange() {
  const cardSequenceSelect = document.getElementById('cardSequence');
  const newSequence = cardSequenceSelect.value;
  
  // Update state
  changeCardSequence(newSequence);
  
  // Update stats visibility based on new sequence
  updateStatsVisibility();
  
  // Update cards
  renderCardDeck();
  
  // Broadcast sequence change to other participants
  emitSequenceChanged(newSequence);
  
  saveToLocalStorage();
}

/**
 * Select a card
 * @param {string} card - The card value
 * @param {HTMLElement} cardElement - The card DOM element
 */
function selectCard(card, cardElement) {
  if (appState.votesRevealed) return;
  if (appState.role === 'observer') return; // Observers can't select cards
  
  // Deselect previous card
  if (appState.selectedCard) {
    const previousCard = document.querySelector('.card.selected');
    if (previousCard) {
      previousCard.classList.remove('selected');
    }
  }
  
  appState.selectedCard = card;
  cardElement.classList.add('selected');
  
  // Add visual feedback
  cardElement.style.animation = 'pulse 0.5s';
  setTimeout(() => {
    cardElement.style.animation = '';
  }, 500);
  
  document.getElementById('submitVote').disabled = false;
  
  // Show selection feedback
  const feedbackEl = document.createElement('div');
  feedbackEl.textContent = `You selected: ${card}`;
  feedbackEl.style.textAlign = 'center';
  feedbackEl.style.padding = '0.5rem';
  feedbackEl.style.marginTop = '0.5rem';
  feedbackEl.style.backgroundColor = 'var(--primary-light)';
  feedbackEl.style.color = 'white';
  feedbackEl.style.borderRadius = '4px';
  feedbackEl.style.animation = 'fadeIn 0.3s ease-in-out';
  feedbackEl.className = 'selection-feedback';
  
  // Remove previous feedback if exists
  const existingFeedback = document.querySelector('.selection-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  const cardDeck = document.getElementById('cardDeck');
  cardDeck.after(feedbackEl);
}

/**
 * Submit vote
 */
function submitVote() {
  if (!appState.selectedCard) return;
  
  if (appState.role === 'observer') {
    showToast('Observers cannot vote', 'error');
    return;
  }
  
  // Update local state
  recordUserVote(appState.selectedCard);
  
  // Update UI immediately
  updateParticipantsList();
  updateVotesList();
  
  // Send vote to server
  emitSubmitVote(appState.selectedCard);
  
  document.getElementById('submitVote').disabled = true;
  
  // Show toast notification
  showToast('Your vote has been submitted!', 'success');
}

/**
 * Reveal votes
 */
function revealVotes() {
  // Send reveal votes command to server
  emitRevealVotes();
  
  // Scroll to results area
  const resultsArea = document.getElementById('resultsArea');
  if (resultsArea) {
    setTimeout(() => {
      resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

/**
 * Reset voting
 */
function resetVoting() {
  // Tell server to reset voting
  emitResetVoting();
  
  // Scroll back to the participants list
  const participantsList = document.getElementById('participants').closest('.participants-list');
  if (participantsList) {
    setTimeout(() => {
      participantsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

/**
 * Update connection status display
 * @param {string} status - The connection status
 */
function updateConnectionStatus(status) {
  const connectionStatus = document.getElementById('connectionStatus');
  if (!connectionStatus) return;
  
  connectionStatus.className = 'connection-status';
  
  switch (status) {
    case 'connected':
      connectionStatus.classList.add('connected');
      connectionStatus.textContent = 'Connected';
      // Fade out after 3 seconds
      setTimeout(() => {
        connectionStatus.style.opacity = '0';
        connectionStatus.style.transition = 'opacity 0.5s ease-in-out';
      }, 3000);
      break;
    case 'disconnected':
      connectionStatus.classList.add('disconnected');
      connectionStatus.textContent = 'Disconnected';
      connectionStatus.style.opacity = '1';
      connectionStatus.style.transition = '';
      break;
    case 'connecting':
      connectionStatus.classList.add('reconnecting');
      connectionStatus.textContent = 'Connecting...';
      connectionStatus.style.opacity = '1';
      connectionStatus.style.transition = '';
      break;
    case 'error':
      connectionStatus.classList.add('disconnected');
      connectionStatus.textContent = 'Connection Error';
      connectionStatus.style.opacity = '1';
      connectionStatus.style.transition = '';
      break;
  }
}

/**
 * Update UI elements based on role
 */
function updateUIForRole() {
  const roleDisplay = document.getElementById('roleDisplay');
  const shareLinksContainer = document.getElementById('shareLinksContainer');
  const sequenceSelector = document.getElementById('sequenceSelector');
  const votingSection = document.getElementById('votingSection');
  const submitVoteBtn = document.getElementById('submitVote');
  const revealVotesBtn = document.getElementById('revealVotes');
  
  // Show role in header
  if (roleDisplay) {
    roleDisplay.innerHTML = '';
    const roleBadge = document.createElement('span');
    roleBadge.className = `role-info ${appState.role}`;
    roleBadge.textContent = appState.role === 'observer' ? 'Observer Mode' : 'Player Mode';
    roleDisplay.appendChild(roleBadge);
  }
  
  // Make sure share link container is always visible for everyone
  if (shareLinksContainer) {
    shareLinksContainer.classList.remove('hidden');
    // Create session share link
    const sessionShareLink = document.getElementById('sessionShareLink');
    const baseUrl = `${window.location.origin}${window.location.pathname}?room=${appState.roomId}`;
    sessionShareLink.href = baseUrl;
    sessionShareLink.textContent = baseUrl;
  }
  
  // Update sequence selector - now available to all users
  if (sequenceSelector) {
    sequenceSelector.classList.remove('hidden');
    document.getElementById('cardSequence').disabled = false;
  }
  
  // If observer, hide voting section and adjust buttons
  if (appState.role === 'observer') {
    // Disable voting functionality for observers
    submitVoteBtn.disabled = true;
    
    // Hide the voting area for observers
    if (votingSection) {
      votingSection.style.display = 'none';
    }
    
    // Enable reveal votes button for observers (they don't need to vote first)
    revealVotesBtn.disabled = false;
    
    // Show a message about being an observer
    showToast('Observer mode: You can reveal votes but cannot vote', 'info', 8000);
  } else {
    // Show voting section for players
    if (votingSection) {
      votingSection.style.display = '';
    }
  }
  
  // Update stats visibility based on card sequence
  updateStatsVisibility();
}

/**
 * Update stats visibility based on card sequence
 */
function updateStatsVisibility() {
  const resultsSummary = document.getElementById('resultsSummary');
  if (!resultsSummary) return;
  
  // Hide stats for T-shirt sizes
  if (appState.currentSequence === 'tshirt') {
    resultsSummary.style.display = 'none';
  } else {
    resultsSummary.style.display = '';
  }
}

/**
 * Copy share link to clipboard
 * @param {string} linkType - Type of link to copy
 */
function copyShareLink(linkType) {
  // Get the link text
  const sessionShareLink = document.getElementById('sessionShareLink');
  const linkText = sessionShareLink.href;
  
  // Use the newer clipboard API if available
  if (navigator.clipboard) {
    navigator.clipboard.writeText(linkText)
      .then(() => {
        showToast('Session link copied to clipboard!', 'success');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        showToast('Failed to copy link', 'error');
      });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = linkText;
    textArea.style.position = 'fixed'; // Avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showToast('Session link copied to clipboard!', 'success');
      } else {
        showToast('Failed to copy link', 'error');
      }
    } catch (err) {
      console.error('Could not copy text: ', err);
      showToast('Failed to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
  }
}

/**
 * Check if all participants have voted and update UI accordingly
 */
function checkAllVoted() {
  const revealVotesBtn = document.getElementById('revealVotes');
  
  // Count only players (not observers) when checking if all voted
  const players = Object.values(appState.participants).filter(p => p.role !== 'observer');
  
  // If no players, disable reveal button
  if (players.length === 0) {
    revealVotesBtn.disabled = true;
    return;
  }
  
  // For observers, enable reveal votes button anyway
  if (appState.role === 'observer') {
    revealVotesBtn.disabled = false;
    return;
  }
  
  // For players, check if all players have voted
  const allVoted = players.every(p => p.hasVoted);
  revealVotesBtn.disabled = !allVoted;
  
  if (allVoted && players.length > 1) {
    showToast('Everyone has voted! You can now reveal the votes.', 'info');
  }
}

/**
 * Check for URL parameters when loading the page
 */
function checkUrlForRoomCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  
  if (roomCode) {
    document.getElementById('roomCodeInput').value = roomCode;
    // Focus on name input for convenience
    document.getElementById('nameInput').focus();
    
    // Check for role in URL
    const role = urlParams.get('role');
    if (role === 'observer') {
      document.getElementById('observerRole').checked = true;
    }
  }
}