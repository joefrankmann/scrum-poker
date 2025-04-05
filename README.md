# Scrum Poker - Real-time Planning Poker for Agile Teams

A collaborative estimation tool that allows agile teams to vote on the complexity of tasks using the planning poker technique. Team members can join sessions remotely, vote anonymously, and reveal their estimates simultaneously.

## 🌟 Features

- **Real-time Collaboration**: Instantly connect with team members regardless of location
- **Multiple Card Sequences**: Choose between Fibonacci, Modified Fibonacci, T-Shirt sizes, or Powers of 2
- **Observer Mode**: Product owners and stakeholders can join without voting
- **Consensus Celebration**: Visual confetti effect when team achieves perfect consensus in T-shirt sizing
- **Responsive Design**: Works well on desktop and mobile devices
- **Vote Statistics**: Automatically calculates average, median, and mode (for numeric estimates)
- **Easy Sharing**: Generate a shareable link for your team members to join the session

## 🚀 Live Demo

Try it now at: [https://sakura-lively-yamamomo.glitch.me](https://sakura-lively-yamamomo.glitch.me)

## 💻 Technologies

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **Animations**: Custom CSS animations, Canvas Confetti

## 🔧 Installation and Setup

### Prerequisites
- Node.js (v12 or higher)
- npm or yarn

### Local Development
1. Clone the repository
   ```
   git clone https://github.com/your-username/scrum-poker.git
   cd scrum-poker
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   node server.js
   ```

4. Open your browser and navigate to `http://localhost:3000`

## 🌳 File Structure
```
scrum-poker/
├── public/                  # Static assets served to the client
│   ├── css/
│   │   ├── main.css         # Main stylesheet
│   │   ├── components.css   # Component-specific styles
│   │   └── animations.css   # CSS animations
│   ├── js/
│   │   ├── app.js           # Main application initialization
│   │   ├── ui.js            # UI-specific functions
│   │   ├── socket-client.js # Socket.IO client interactions
│   │   ├── state.js         # State management
│   │   ├── components/      # UI components
│   │   │   ├── cards.js     # Card deck rendering & interactions
│   │   │   ├── participants.js # Participants list management
│   │   │   ├── toast.js     # Toast notification system
│   │   │   └── results.js   # Voting results display
│   │   └── utils/           # Utility functions
│   │       ├── storage.js   # Local storage operations
│   │       ├── confetti.js  # Confetti animation utilities
│   │       └── session.js   # Session management utilities
│   └── index.html           # Main HTML file
│
└── server/                  # Server-side code
    ├── server.js            # Main server entry point
    ├── socket-handlers.js   # Socket.IO event handlers
    └── room-manager.js      # Room management logic

```


## 📋 How to Use

1. **Creating or Joining a Session**:
   - Enter your name and optionally a session code
   - Check "Join as observer" if you don't plan to vote
   - Click "Join Session"

2. **Setting Up the Estimation**:
   - Select your preferred card sequence (Fibonacci, T-Shirt sizes, etc.)
   - Share the generated session link with your team members

3. **Voting Process**:
   - Team members select a card representing their estimate
   - Click "Submit Vote" to confirm your selection
   - Everyone's votes remain hidden until revealed

4. **Revealing and Discussing**:
   - When everyone has voted, the "Reveal Votes" button becomes active
   - Click to show all team members' estimates
   - View distribution and statistics to facilitate discussion
   - If using T-Shirt sizing, enjoy a confetti celebration when consensus is reached!

5. **Starting a New Vote**:
   - Click "Reset Voting" to clear all votes for the next item

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the GNU GENERAL PUBLIC LICENSE - see the LICENSE file for details.

## 🙏 Acknowledgements

- Inspired by various planning poker tools used in agile development
- [Socket.IO](https://socket.io/) for making real-time communication simple
- [Canvas Confetti](https://github.com/catdad/canvas-confetti) for the celebration animations
