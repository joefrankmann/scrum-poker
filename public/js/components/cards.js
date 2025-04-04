/**
 * Cards Component
 * Handles the card deck rendering and interactions
 */

/**
 * Render the card deck based on current state
 */
function renderCardDeck() {
  const cardDeck = document.getElementById('cardDeck');
  if (!cardDeck) return;
  
  cardDeck.innerHTML = '';
  
  const cards = appState.cardSequences[appState.currentSequence];
  
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.textContent = card;
    
    if (appState.selectedCard === card) {
      cardElement.classList.add('selected');
    }
    
    // Disable card selection for observers
    if (appState.role !== 'observer') {
      cardElement.addEventListener('click', () => selectCard(card, cardElement));
    } else {
      cardElement.style.cursor = 'default';
      cardElement.style.opacity = '0.7';
    }
    
    cardDeck.appendChild(cardElement);
  });
}