/**
 * Confetti Animation Utilities
 * Handles the confetti celebration animations
 */

/**
 * Check for consensus and celebrate with confetti if unanimous voting
 */
function checkConsensusAndCelebrate() {
  // Only proceed if votes are revealed and we're in T-shirt size mode
  if (!appState.votesRevealed || appState.currentSequence !== 'tshirt') return;
  
  // Get all votes (excluding observers who don't vote)
  const votes = [];
  for (const username in appState.votes) {
    // Only count votes that aren't null or undefined or "?"
    if (appState.votes[username] && appState.votes[username] !== '?') {
      votes.push(appState.votes[username]);
    }
  }
  
  // Need at least 2 votes to consider consensus
  if (votes.length < 2) return;
  
  // Check if all votes are the same
  const firstVote = votes[0];
  const allSame = votes.every(vote => vote === firstVote);
  
  if (allSame) {
    // Trigger confetti celebration
    celebrateWithConfetti();
    // Show a celebratory message
    showToast(`🎉 Perfect consensus! Everyone voted for ${firstVote}!`, 'success', 8000);
  }
}

/**
 * Display the confetti animation
 */
function celebrateWithConfetti() {
  // Check if confetti is available
  if (typeof window.confetti === 'undefined') {
    console.error('Confetti library not loaded');
    // Try to load the confetti library again
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => {
      console.log('Confetti library loaded dynamically');
      // Now that it's loaded, run the confetti
      runConfettiAnimation();
    };
    script.onerror = () => {
      console.error('Failed to load confetti library dynamically');
    };
    document.head.appendChild(script);
    return;
  }
  
  runConfettiAnimation();
}

/**
 * Run the actual confetti animation
 */
function runConfettiAnimation() {
  // Configure and trigger the confetti
  const duration = 0.5 * 1000;
  const end = Date.now() + duration;
  
  // Create a confetti cannon effect
  const frame = () => {
    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      });
      window.confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }
  };
  
  // Start the animation
  frame();
  
  // Add a big burst of confetti at the start
  if (typeof window.confetti === 'function') {
    window.confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}