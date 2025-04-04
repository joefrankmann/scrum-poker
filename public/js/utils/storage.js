/**
 * Local Storage Utility
 * Handles saving and loading data from local storage
 */

/**
 * Save current application state to local storage
 */
function saveToLocalStorage() {
  const dataToSave = {
    username: appState.username,
    roomId: appState.roomId,
    currentSequence: appState.currentSequence,
    role: appState.role
  };
  
  localStorage.setItem('scrumPokerState', JSON.stringify(dataToSave));
}

/**
 * Load saved application state from local storage
 */
function loadFromLocalStorage() {
  const savedState = localStorage.getItem('scrumPokerState');
  
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      
      // Restore only persistent data
      if (parsed.username) {
        appState.username = parsed.username;
        document.getElementById('nameInput').value = parsed.username;
      }
      
      if (parsed.roomId) {
        document.getElementById('roomCodeInput').value = parsed.roomId;
      }
      
      if (parsed.currentSequence) {
        appState.currentSequence = parsed.currentSequence;
        document.getElementById('cardSequence').value = parsed.currentSequence;
      }
      
      if (parsed.role) {
        appState.role = parsed.role;
        document.getElementById('observerRole').checked = parsed.role === 'observer';
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      // Clear invalid state
      localStorage.removeItem('scrumPokerState');
    }
  }
}