/**
 * Main Application Entry Point
 * Initializes the Scrum Poker application
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Scrum Poker application');
  
  // Preload the confetti library for when we need it
  if (typeof window.confetti === 'undefined') {
    console.log('Preloading confetti library');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    document.head.appendChild(script);
  }
  
  // Initialize socket connection
  initializeSocketConnection();
  
  // Load saved data from local storage
  loadFromLocalStorage();
  
  // Check URL for room code
  checkUrlForRoomCode();
  
  // Update connection status initially
  updateConnectionStatus('connecting');
  
  // Initialize event listeners
  initializeEventListeners();
});

/**
 * Initialize all event listeners for the application
 */
function initializeEventListeners() {
  // Join session button
  document.getElementById('joinSession').addEventListener('click', joinSession);
  
  // Card sequence selector
  document.getElementById('cardSequence').addEventListener('change', handleCardSequenceChange);
  
  // Vote controls
  document.getElementById('submitVote').addEventListener('click', submitVote);
  document.getElementById('revealVotes').addEventListener('click', revealVotes);
  document.getElementById('resetVoting').addEventListener('click', resetVoting);
  
  // Copy buttons for share links
  document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', function() {
      const linkType = this.getAttribute('data-link');
      copyShareLink(linkType);
    });
  });
  
  // Observer role checkbox
  document.getElementById('observerRole').addEventListener('change', function() {
    // Update tooltip with role description
    if (this.checked) {
      this.parentElement.setAttribute('title', 'Observers can see votes and reveal cards but cannot vote themselves');
    } else {
      this.parentElement.setAttribute('title', '');
    }
  });
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Enter key on join screen submits the form
    const joinRoomSection = document.getElementById('joinRoom');
    const nameInput = document.getElementById('nameInput');
    
    if (e.key === 'Enter' && 
        !joinRoomSection.classList.contains('hidden') && 
        nameInput.value.trim()) {
      joinSession();
    }
  });
  
  // Clean up when leaving
  window.addEventListener('beforeunload', function() {
    // Notify others that you're leaving
    if (appState.username && appState.roomId && appState.connected) {
      socket.emit('leave_room', {
        username: appState.username,
        roomId: appState.roomId
      });
    }
  });
}