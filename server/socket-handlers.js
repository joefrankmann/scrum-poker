/**
 * Socket Handlers
 * Manages socket.io events and interactions
 */

const roomManager = require('./room-manager');

// Map of socket IDs to user data
const connectedUsers = new Map();

function init(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join a room
    socket.on('join_room', (data) => {
      const { username, roomId, role } = data;
      
      if (!username || !roomId) {
        socket.emit('error_message', { 
          message: 'Username and room ID are required'
        });
        return;
      }
      
      // Store user data
      connectedUsers.set(socket.id, { 
        username, 
        roomId, 
        role: role || 'player' 
      });
      
      // Join the Socket.IO room
      socket.join(roomId);
      
      // Add participant to room
      const room = roomManager.addParticipant(roomId, username, role);
      
      // Notify everyone in the room
      io.to(roomId).emit('user_joined', {
        username,
        role: role || 'player',
        participants: room.participants
      });
      
      // Send current state to the new user
      socket.emit('sync_state', {
        participants: room.participants,
        votes: room.votes,
        votesRevealed: room.votesRevealed,
        cardSequence: room.cardSequence,
        voteDistribution: room.voteDistribution
      });
    });
    
    // Leave a room
    socket.on('leave_room', (data) => {
      const { username, roomId } = data;
      const userData = connectedUsers.get(socket.id);
      
      if (!userData) return;
      
      // Remove participant from room
      const room = roomManager.removeParticipant(roomId, username);
      
      // Notify everyone else in the room
      if (room) {
        io.to(roomId).emit('user_left', {
          username,
          participants: room.participants
        });
      }
      
      // Remove user data
      connectedUsers.delete(socket.id);
    });
    
    // Submit a vote
    socket.on('vote_submitted', (data) => {
      const { username, roomId, vote } = data;
      const userData = connectedUsers.get(socket.id);
      
      if (!userData || userData.username !== username) return;
      
      // Record the vote
      const room = roomManager.submitVote(roomId, username, vote);
      
      // Notify everyone in the room
      io.to(roomId).emit('vote_submitted', {
        username,
        participants: room.participants
      });
    });
    
    // Reveal votes
    socket.on('reveal_votes', (data) => {
      const { roomId, username } = data;
      const userData = connectedUsers.get(socket.id);
      
      if (!userData) return;
      
      // Reveal the votes
      const room = roomManager.revealVotes(roomId);
      
      // Notify everyone in the room
      io.to(roomId).emit('votes_revealed', {
        revealedBy: username,
        votes: room.votes,
        voteDistribution: room.voteDistribution
      });
    });
    
    // Reset voting
    socket.on('reset_voting', (data) => {
      const { roomId, username } = data;
      const userData = connectedUsers.get(socket.id);
      
      if (!userData) return;
      
      // Reset the voting
      const room = roomManager.resetVoting(roomId);
      
      // Notify everyone in the room
      io.to(roomId).emit('voting_reset', {
        resetBy: username,
        participants: room.participants
      });
    });
    
    // Change card sequence
    socket.on('sequence_changed', (data) => {
      const { roomId, sequence, username } = data;
      const userData = connectedUsers.get(socket.id);
      
      if (!userData) return;
      
      // Change the sequence
      roomManager.changeCardSequence(roomId, sequence);
      
      // Notify everyone in the room
      io.to(roomId).emit('sequence_changed', {
        cardSequence: sequence,
        changedBy: username
      });
    });
    
    // Handle disconnections
    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);
      
      if (userData) {
        const { username, roomId } = userData;
        
        // Remove participant from room
        const room = roomManager.removeParticipant(roomId, username);
        
        // Notify everyone else in the room
        if (room) {
          io.to(roomId).emit('user_left', {
            username,
            participants: room.participants
          });
        }
        
        // Remove user data
        connectedUsers.delete(socket.id);
      }
      
      console.log('User disconnected:', socket.id);
    });
  });
}

module.exports = {
  init
};