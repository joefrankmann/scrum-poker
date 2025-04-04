/**
 * Session Management Utilities
 * Handles session-related operations
 */

/**
 * Generate a random session code
 * @returns {string} A 6-character random session code
 */
function generateSessionCode() {
  // Removed easily confused characters like I, O, 0, 1
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const length = 6;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}