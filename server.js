// Enhanced Scrum Poker Server with Observer Controls
// Save as server.js and run with Node.js

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store rooms and participants
const rooms = {};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  let currentUser = { username: '', roomId: '', role: 'player' };

  // Join room event
  socket.on('join_room', (data) => {
    const { username, roomId, role } = data;
    console.log(`${username} joining room ${roomId} as ${role}`);
    
    // Store user info
    currentUser = { username, roomId, role };
    
    // Join Socket.IO room
    socket.join(roomId);
    
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        participants: {},
        votes: {},
        votesRevealed: false,
        cardSequence: 'fibonacci'
      };
    }
    
    // Add user to room
    rooms[roomId].participants[username] = {
      name: username,
      hasVoted: false,
      isActive: true,
      role: role || 'player', // Default to player if not specified
      vote: null // Store the vote here as well for easier access
    };
    
    // Send current state to the joining user
    socket.emit('sync_state', {
      participants: rooms[roomId].participants,
      votes: rooms[roomId].votes,
      votesRevealed: rooms[roomId].votesRevealed,
      cardSequence: rooms[roomId].cardSequence
    });
    
    // Broadcast to everyone in the room (including sender)
    io.to(roomId).emit('user_joined', {
      username: username,
      role: role,
      participants: rooms[roomId].participants
    });
  });

  // Submit vote event
  socket.on('vote_submitted', (data) => {
    const { username, roomId, vote } = data;
    
    if (!rooms[roomId] || !rooms[roomId].participants[username]) return;
    
    // Only players can vote (not observers)
    if (rooms[roomId].participants[username].role === 'observer') {
      socket.emit('error_message', { message: 'Observers cannot vote' });
      return;
    }
    
    // Update vote in room state
    rooms[roomId].votes[username] = vote;
    rooms[roomId].participants[username].hasVoted = true;
    rooms[roomId].participants[username].vote = vote; // Store in participant data too
    
    // Broadcast vote to room
    io.to(roomId).emit('vote_submitted', {
      username: username,
      hasVoted: true,
      participants: rooms[roomId].participants,
      votes: rooms[roomId].votes
    });
  });
  
  // Reveal votes event
  socket.on('reveal_votes', (data) => {
    const { roomId, username } = data;
    
    if (!rooms[roomId]) return;
    
    // Check if user is allowed to reveal votes (player who has voted or observer)
    const user = rooms[roomId].participants[username];
    if (!user) return;
    
    // Allow revealing if:
    // 1. User is an observer, OR
    // 2. User is a player who has voted
    if (!(user.role === 'observer' || user.hasVoted)) {
      socket.emit('error_message', { message: 'You must vote before revealing votes' });
      return;
    }
    
    rooms[roomId].votesRevealed = true;
    
    // Calculate vote distribution
    const voteDistribution = calculateVoteDistribution(rooms[roomId].votes);
    
    // Broadcast all votes to everyone
    io.to(roomId).emit('votes_revealed', {
      votes: rooms[roomId].votes,
      votesRevealed: true,
      revealedBy: username,
      voteDistribution: voteDistribution
    });
  });
  
  // Reset voting event
  socket.on('reset_voting', (data) => {
    const { roomId, username } = data;
    
    if (!rooms[roomId]) return;
    
    // Check if user is allowed to reset (anyone can reset after votes are revealed)
    // but otherwise only observers can reset
    const user = rooms[roomId].participants[username];
    if (!user) return;
    
    if (!rooms[roomId].votesRevealed && user.role !== 'observer') {
      socket.emit('error_message', { message: 'Only observers can reset before votes are revealed' });
      return;
    }
    
    // Reset room state
    rooms[roomId].votes = {};
    rooms[roomId].votesRevealed = false;
    
    // Reset participants' voting status
    Object.keys(rooms[roomId].participants).forEach(name => {
      rooms[roomId].participants[name].hasVoted = false;
      rooms[roomId].participants[name].vote = null;
    });
    
    // Broadcast reset to room
    io.to(roomId).emit('voting_reset', {
      participants: rooms[roomId].participants,
      resetBy: username
    });
  });
  
  // Change card sequence event - modified to allow any user to change
  socket.on('sequence_changed', (data) => {
    const { roomId, sequence, username } = data;
    
    if (!rooms[roomId]) return;
    
    // No need to check if user is an observer - any user can change the sequence
    const user = rooms[roomId].participants[username];
    if (!user) return;
    
    // Update sequence
    rooms[roomId].cardSequence = sequence;
    
    // Reset votes when sequence changes
    rooms[roomId].votes = {};
    rooms[roomId].votesRevealed = false;
    
    // Reset participants' voting status
    Object.keys(rooms[roomId].participants).forEach(name => {
      rooms[roomId].participants[name].hasVoted = false;
      rooms[roomId].participants[name].vote = null;
    });
    
    // Broadcast to room
    io.to(roomId).emit('sequence_changed', {
      cardSequence: sequence,
      changedBy: username
    });
  });
  
  // Request state sync event
  socket.on('sync_request', (data) => {
    const { roomId } = data;
    
    if (!rooms[roomId]) return;
    
    // Send current state to requester
    socket.emit('sync_state', {
      participants: rooms[roomId].participants,
      votes: rooms[roomId].votes,
      votesRevealed: rooms[roomId].votesRevealed,
      cardSequence: rooms[roomId].cardSequence
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const { username, roomId } = currentUser;
    
    if (username && roomId && rooms[roomId]) {
      // Remove user from room
      delete rooms[roomId].participants[username];
      delete rooms[roomId].votes[username];
      
      // Broadcast to room
      io.to(roomId).emit('user_left', {
        username: username,
        participants: rooms[roomId].participants
      });
      
      // Clean up empty rooms (except default)
      if (roomId !== 'default' && Object.keys(rooms[roomId].participants).length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted (empty)`);
      }
    }
  });
  
  // Explicit leave room event
  socket.on('leave_room', (data) => {
    const { username, roomId } = data;
    
    if (username && roomId && rooms[roomId]) {
      // Remove user from room
      delete rooms[roomId].participants[username];
      delete rooms[roomId].votes[username];
      
      // Leave Socket.IO room
      socket.leave(roomId);
      
      // Broadcast to room
      io.to(roomId).emit('user_left', {
        username: username,
        participants: rooms[roomId].participants
      });
      
      // Reset current user
      currentUser = { username: '', roomId: '', role: 'player' };
      
      // Clean up empty rooms (except default)
      if (roomId !== 'default' && Object.keys(rooms[roomId].participants).length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted (empty)`);
      }
    }
  });
});

// Calculate the distribution of votes (how many of each card)
function calculateVoteDistribution(votes) {
  const distribution = {};
  
  // Count each vote
  Object.values(votes).forEach(vote => {
    if (!distribution[vote]) {
      distribution[vote] = 1;
    } else {
      distribution[vote]++;
    }
  });
  
  return distribution;
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://0.0.0.0:${PORT} in your browser`);
});