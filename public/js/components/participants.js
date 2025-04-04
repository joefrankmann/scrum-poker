/**
 * Participants Component
 * Handles the participants list rendering and interactions
 */

/**
 * Update the participants list UI
 * @param {string} highlightName - Optional name to highlight as newly joined
 */
function updateParticipantsList(highlightName = null) {
  const participantsList = document.getElementById('participants');
  // Clear the container
  participantsList.innerHTML = '';
  
  // Get participants as an array for sorting
  const participantsArray = Object.values(appState.participants);
  
  // If no participants, show a message
  if (participantsArray.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.textContent = 'No participants yet. Share the link to invite others!';
    emptyMsg.style.padding = '0.5rem';
    emptyMsg.style.color = 'var(--text-light)';
    participantsList.appendChild(emptyMsg);
    
    // Update the header count
    const participantsHeader = document.querySelector('.participants-list h3');
    if (participantsHeader) {
      participantsHeader.textContent = 'Participants (0)';
    }
    return;
  }
  
  // Sort by name
  participantsArray.sort((a, b) => a.name.localeCompare(b.name));
  
  // Create and append participant elements
  participantsArray.forEach(participant => {
    if (!participant || !participant.name) return;
    
    const participantEl = document.createElement('div');
    participantEl.className = 'participant';
    
    // Highlight newly added participants
    if (highlightName && participant.name === highlightName) {
      participantEl.classList.add('participant-enter');
    }
    
    const userRoleEl = document.createElement('div');
    userRoleEl.className = 'user-role';
    
    const nameEl = document.createElement('span');
    nameEl.textContent = participant.name + (participant.name === appState.username ? ' (You)' : '');
    userRoleEl.appendChild(nameEl);
    
    // Add observer label if they're an observer
    if (participant.role === 'observer') {
      const observerBadge = document.createElement('span');
      observerBadge.className = 'observer-badge';
      observerBadge.textContent = 'Observer';
      userRoleEl.appendChild(observerBadge);
    }
    
    // Add vote badge if votes are revealed and they voted
    if (appState.votesRevealed && participant.hasVoted && participant.vote && participant.role !== 'observer') {
      const voteBadge = document.createElement('span');
      voteBadge.className = 'participant-vote';
      voteBadge.textContent = participant.vote;
      userRoleEl.appendChild(voteBadge);
    }
    
    const statusContainer = document.createElement('div');
    statusContainer.className = 'status-indicator';
    
    const statusDot = document.createElement('div');
    // Observers don't vote, so they're always "ready"
    if (participant.role === 'observer') {
      statusDot.className = 'participant-status voted';
    } else {
      statusDot.className = `participant-status ${participant.hasVoted ? 'voted' : ''}`;
      if (participant.hasVoted) {
        statusDot.classList.add('pulse');
      }
    }
    
    const statusText = document.createElement('span');
    // Different status text for observers
    if (participant.role === 'observer') {
      statusText.textContent = 'Observer';
    } else {
      statusText.textContent = participant.hasVoted ? 'Voted' : 'Not voted';
    }
    
    statusContainer.appendChild(statusDot);
    statusContainer.appendChild(statusText);
    
    participantEl.appendChild(userRoleEl);
    participantEl.appendChild(statusContainer);
    
    participantsList.appendChild(participantEl);
  });
  
  // Update the header count
  const participantsHeader = document.querySelector('.participants-list h3');
  if (participantsHeader) {
    participantsHeader.textContent = `Participants (${participantsArray.length})`;
  }
}