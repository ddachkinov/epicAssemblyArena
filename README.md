# ⚡ Epic Assembly Arena

A minimalistic 3D multiplayer battle game where players control white cloud characters using **IBM z/Architecture Assembly Code**. Battle your opponent in a square arena while learning or mastering assembly language!

## 🎮 Game Features

### Visual Design
- **Cloud Characters**: Two fluffy white clouds representing players
- **3D Arena**: Square grid battlefield with glowing green aesthetics
- **Floating Code**: Scrambled assembly instructions floating around the arena
- **Matrix-Style UI**: Green-on-black terminal aesthetic

### Game Modes

#### 🟢 Easy Mode (Learning)
- Designed for beginners learning assembly language
- Referee provides teaching-focused challenges
- Step-by-step instructions and hints
- 30% challenge frequency
- Learn core concepts:
  - Loading values into registers
  - Arithmetic operations (add, subtract, multiply)
  - Register-to-register operations
  - Basic game commands

#### 🔴 Advanced Mode
- For experienced assembly programmers
- Complex challenges requiring deep understanding
- 50% challenge frequency
- Advanced topics:
  - Memory overlays
  - Hexadecimal calculations
  - Bit masking and logical operations
  - Shift operations
  - Following complex code logic

### Gameplay Mechanics

#### Player Actions
Write assembly code to control your cloud:

**Movement Commands:**
- `MOVE forward` - Move toward opponent
- `MOVE back` - Move away from opponent

**Combat:**
- `ATTACK` - Attack opponent (must be within 3 units)

**Assembly Operations:**
```assembly
L R1,42         ; Load value 42 into register R1
A R1,10         ; Add 10 to R1
AR R2,R3        ; Add R3 to R2
M R1,5          ; Multiply R1 by 5
SLL R1,2        ; Shift R1 left by 2 bits
N R1,X'FF'      ; AND R1 with hex FF
XR R5,R6        ; XOR R5 with R6
```

#### Referee System
- Acts as a neutral agent making combat challenging
- Randomly presents assembly puzzles that must be solved
- Blocks direct attacks until challenges are completed
- Can skip challenges with hints (for learning purposes)

#### Win Condition
Reduce opponent's health to 0 by:
1. Moving close enough to attack (within 3 units)
2. Successfully executing ATTACK commands
3. Solving referee challenges to enable actions
4. Using register values to boost attack power (R1 affects damage)

### Multiplayer System

#### Creating a Game
1. Select Easy or Advanced mode
2. Click "Create Game"
3. Share the generated URL with your opponent
4. Wait for them to join

#### Joining a Game
1. Receive invitation URL from friend
2. Click link or enter Game ID manually
3. Game starts automatically when both players connected

## 🛠️ Technical Stack

- **Frontend**: Pure JavaScript with Three.js for 3D rendering
- **Backend**: Node.js with Express and WebSocket
- **Assembly**: IBM z/Architecture instruction set
- **Real-time Communication**: WebSocket for multiplayer

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd epicAssemblyArena
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 🎯 How to Play

### For Beginners (Easy Mode)

1. **Start**: Create a game in Easy mode
2. **Learn**: Referee will guide you with teaching challenges
3. **Practice**: Try basic assembly commands:
   ```assembly
   L R1,5
   A R1,3
   MOVE forward
   ATTACK
   ```
4. **Follow Hints**: Read the hints when you get stuck
5. **Progress**: Complete challenges to enable your actions

### For Advanced Players

1. **Start**: Create game in Advanced mode
2. **Challenge**: Solve complex assembly problems:
   ```assembly
   L R1,X'AA'
   X R1,X'55'
   SLL R1,2
   N R1,X'F0'
   ```
3. **Strategy**: Use register values strategically
4. **Combat**: Balance solving challenges with attacking

## 📚 Supported Assembly Instructions

### Load/Store
- `L Rx,value` - Load immediate value
- `LR Rx,Ry` - Load from register
- `ST Rx,addr` - Store (placeholder)

### Arithmetic
- `A Rx,value` - Add immediate
- `AR Rx,Ry` - Add register
- `S Rx,value` - Subtract immediate
- `SR Rx,Ry` - Subtract register
- `M Rx,value` - Multiply
- `MR Rx,Ry` - Multiply register
- `D Rx,value` - Divide
- `DR Rx,Ry` - Divide register

### Logical Operations
- `N Rx,value` - AND
- `NR Rx,Ry` - AND register
- `O Rx,value` - OR
- `OR Rx,Ry` - OR register
- `X Rx,value` - XOR
- `XR Rx,Ry` - XOR register

### Shift Operations
- `SLL Rx,shift` - Shift Left Logical
- `SRL Rx,shift` - Shift Right Logical
- `SLA Rx,shift` - Shift Left Arithmetic
- `SRA Rx,shift` - Shift Right Arithmetic

### Compare
- `C Rx,value` - Compare with value
- `CR Rx,Ry` - Compare registers

### Game Commands
- `MOVE forward/back` - Move player
- `ATTACK` - Attack opponent

## 🎨 Game Design Philosophy

The game combines education with entertainment:

1. **Visual Metaphor**: Clouds represent data/processes, assembly code floats around symbolizing the code environment
2. **Active Learning**: Players learn by doing, not by reading
3. **Immediate Feedback**: Code execution shows instant results
4. **Progressive Difficulty**: Easy mode teaches, Advanced mode challenges
5. **Social Learning**: Multiplayer encourages discussion and collaboration

## 🔧 Architecture

```
epicAssemblyArena/
├── public/
│   ├── index.html          # Main game UI
│   └── js/
│       ├── assemblyParser.js   # IBM assembly parser
│       ├── gameEngine.js       # Game logic and state
│       ├── referee.js          # Challenge system
│       └── client.js           # 3D rendering & client logic
├── server/
│   └── index.js            # WebSocket server
├── package.json
└── README.md
```

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production
Set environment variable for port:
```bash
PORT=8080 npm start
```

For cloud deployment (Heroku, AWS, etc.), ensure:
- Node.js buildpack is configured
- `npm start` is set as start command
- WebSocket support is enabled

## 🎓 Educational Value

### Learning Outcomes

**Easy Mode:**
- Understand register architecture
- Learn basic assembly syntax
- Practice arithmetic operations
- Grasp load/store concepts

**Advanced Mode:**
- Master bitwise operations
- Understand hexadecimal arithmetic
- Apply bit masking techniques
- Follow complex code logic
- Optimize instruction sequences

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional assembly instructions
- More challenge types
- Visual effects and animations
- Sound effects
- Leaderboards
- Replay system
- AI opponent mode

## 📝 License

MIT License - Feel free to use and modify!

## 🎉 Credits

Created as an innovative way to teach IBM z/Architecture Assembly Language through gamification.

## 🐛 Known Issues

- Game state is not persisted (server restart loses active games)
- No reconnection handling
- Limited to 2 players per game
- No spectator mode

## 🔮 Future Enhancements

- [ ] AI opponent for single-player
- [ ] Tournament mode
- [ ] Code replay/debugging view
- [ ] More instruction sets (x86, ARM)
- [ ] Power-ups and special abilities
- [ ] Persistent leaderboards
- [ ] Mobile support
- [ ] Voice chat integration

---

**Have fun learning assembly by battling in the cloud arena!** ⚡☁️
