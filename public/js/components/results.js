/**
 * Results Component
 * Handles the display of voting results
 */

/**
 * Update the votes list UI
 */
function updateVotesList() {
  const votesList = document.getElementById('votesList');
  if (!votesList) return;
  
  // Clear the list
  votesList.innerHTML = '';
  
  // Sort voters by name
  const sortedVoters = Object.keys(appState.votes).sort();
  
  sortedVoters.forEach(name => {
    const vote = appState.votes[name];
    const voteCard = document.createElement('div');
    voteCard.className = 'vote-card';
    
    const valueEl = document.createElement('div');
    valueEl.className = 'value';
    
    // Show ? or actual vote based on revealed state
    if (!appState.votesRevealed) {
      valueEl.textContent = '?';
      valueEl.style.color = 'var(--text-light)';
    } else {
      valueEl.textContent = vote;
      valueEl.style.color = 'var(--primary)';
      // Animate the reveal
      voteCard.style.animation = 'flipIn 0.5s ease-in-out';
    }
    
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = name;
    
    voteCard.appendChild(valueEl);
    voteCard.appendChild(nameEl);
    
    votesList.appendChild(voteCard);
  });
  
  // Update vote count in the results header
  const voteCount = Object.keys(appState.votes).length;
  const votesHeader = document.querySelector('.results h4');
  if (votesHeader) {
    votesHeader.textContent = `Individual Votes (${voteCount})`;
  }
  
  // If no votes yet, show a message
  if (voteCount === 0) {
    const noVotesMsg = document.createElement('div');
    noVotesMsg.textContent = 'No votes yet. Select a card and submit your vote.';
    noVotesMsg.style.textAlign = 'center';
    noVotesMsg.style.padding = '1rem';
    noVotesMsg.style.color = 'var(--text-light)';
    votesList.appendChild(noVotesMsg);
  }
}

/**
 * Update vote distribution display
 */
function updateVoteDistribution() {
  const voteDistribution = document.getElementById('voteDistribution');
  if (!voteDistribution) return;
  
  voteDistribution.innerHTML = '';
  
  if (!appState.votesRevealed) {
    voteDistribution.innerHTML = `
      <p>Votes will be displayed here when revealed.</p>
    `;
    return;
  }
  
  // If no votes, show message
  if (Object.keys(appState.voteDistribution).length === 0) {
    voteDistribution.innerHTML = `
      <p>No votes yet.</p>
    `;
    return;
  }
  
  // Get total number of votes for calculating percentage
  const totalVotes = Object.values(appState.voteDistribution).reduce((sum, count) => sum + count, 0);
  
  // Sort by card value (try numeric sort first)
  const sortedCards = Object.keys(appState.voteDistribution).sort((a, b) => {
    // Special handling for T-shirt sizes
    if (appState.currentSequence === 'tshirt') {
      const sizeOrder = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, '?': 7 };
      return sizeOrder[a] - sizeOrder[b];
    }
    
    // Handle special case for '½'
    if (a === '½') return -0.5;
    if (b === '½') return 0.5;
    
    // Handle '?' at the end
    if (a === '?') return 1;
    if (b === '?') return -1;
    
    // Try numeric sort
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    // Fallback to string comparison
    return a.localeCompare(b);
  });
  
  // Create a bar for each vote option
  sortedCards.forEach(card => {
    const count = appState.voteDistribution[card];
    const percentage = Math.round((count / totalVotes) * 100);
    
    const item = document.createElement('div');
    item.className = 'distribution-item';
    
    const cardEl = document.createElement('div');
    cardEl.className = 'distribution-card';
    cardEl.textContent = card;
    
    const countEl = document.createElement('div');
    countEl.className = 'distribution-count';
    countEl.textContent = `${count} vote${count !== 1 ? 's' : ''} (${percentage}%)`;
    
    const barEl = document.createElement('div');
    barEl.className = 'distribution-bar';
    barEl.style.width = `${percentage * 3}px`; // Scale the bar width
    
    item.appendChild(cardEl);
    item.appendChild(countEl);
    item.appendChild(barEl);
    
    voteDistribution.appendChild(item);
  });
}

/**
 * Calculate voting statistics
 */
function calculateStats() {
  const averageValueEl = document.getElementById('averageValue');
  const medianValueEl = document.getElementById('medianValue');
  const modeValueEl = document.getElementById('modeValue');
  
  const votes = Object.values(appState.votes).filter(v => v !== '?');
  
  if (votes.length === 0) {
    averageValueEl.textContent = '-';
    medianValueEl.textContent = '-';
    modeValueEl.textContent = '-';
    return;
  }
  
  // Don't calculate stats for T-shirt sizes
  if (appState.currentSequence === 'tshirt') {
    return;
  }
  
  // Animate stats when they're calculated
  document.querySelectorAll('.result-item .value').forEach(el => {
    el.style.animation = 'flipIn 0.5s ease-in-out';
  });
  
  // For numeric values
  const numericVotes = votes.map(v => {
    if (v === '½') return 0.5;
    return parseFloat(v);
  }).filter(v => !isNaN(v));
  
  if (numericVotes.length === 0) {
    averageValueEl.textContent = '-';
    medianValueEl.textContent = '-';
    modeValueEl.textContent = '-';
    return;
  }
  
  // Average
  const sum = numericVotes.reduce((a, b) => a + b, 0);
  const avg = sum / numericVotes.length;
  averageValueEl.textContent = avg.toFixed(1);
  
  // Median
  numericVotes.sort((a, b) => a - b);
  let median;
  const mid = Math.floor(numericVotes.length / 2);
  median = numericVotes.length % 2 === 0 ?
    (numericVotes[mid - 1] + numericVotes[mid]) / 2 :
    numericVotes[mid];
  medianValueEl.textContent = median.toString().replace('.0', '');
  
  // Mode (most common)
  const counts = votes.reduce((acc, vote) => {
    acc[vote] = (acc[vote] || 0) + 1;
    return acc;
  }, {});
  
  let maxCount = 0;
  let mode = '-';
  
  for (const [vote, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mode = vote;
    }
  }
  
  modeValueEl.textContent = mode;
}