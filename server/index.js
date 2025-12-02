/**
 * Epic Assembly Arena - Multiplayer Server
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Game state management
const games = new Map(); // gameId -> game state
const players = new Map(); // playerId -> { ws, gameId }

class GameServer {
    constructor() {
        this.games = games;
        this.players = players;
    }

    createGame(playerId, mode) {
        const gameId = this.generateGameId();

        const game = {
            id: gameId,
            mode: mode,
            players: [
                {
                    id: playerId,
                    name: 'Player 1',
                    health: 100,
                    maxHealth: 100,
                    position: { x: -5, z: 0 },
                    registers: new Array(16).fill(0),
                    score: 0,
                    isReady: true
                },
                {
                    id: null,
                    name: 'Player 2',
                    health: 100,
                    maxHealth: 100,
                    position: { x: 5, z: 0 },
                    registers: new Array(16).fill(0),
                    score: 0,
                    isReady: false
                }
            ],
            started: false,
            createdAt: Date.now()
        };

        this.games.set(gameId, game);
        return game;
    }

    joinGame(playerId, gameId) {
        const game = this.games.get(gameId);

        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (game.started) {
            return { success: false, error: 'Game already started' };
        }

        // Find empty player slot
        const emptySlot = game.players.find(p => !p.id);
        if (!emptySlot) {
            return { success: false, error: 'Game is full' };
        }

        emptySlot.id = playerId;
        emptySlot.isReady = true;

        // Start game if both players ready
        if (game.players.every(p => p.isReady)) {
            game.started = true;
        }

        return { success: true, game };
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    updateGameState(gameId, gameState) {
        const game = this.games.get(gameId);
        if (game) {
            game.players = gameState.players;
            this.games.set(gameId, game);
        }
    }

    generateGameId() {
        return uuidv4().split('-')[0].toUpperCase();
    }

    getGameState(game) {
        return {
            players: game.players.map(p => ({
                id: p.id,
                name: p.name,
                health: p.health,
                maxHealth: p.maxHealth,
                position: { ...p.position },
                registers: [...p.registers],
                score: p.score,
                isReady: p.isReady
            })),
            gameMode: game.mode,
            distance: this.getDistance(game.players[0], game.players[1])
        };
    }

    getDistance(player1, player2) {
        return Math.abs(player1.position.x - player2.position.x);
    }

    cleanupOldGames() {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour

        for (const [gameId, game] of this.games.entries()) {
            if (now - game.createdAt > maxAge && !game.started) {
                this.games.delete(gameId);
                console.log(`Cleaned up old game: ${gameId}`);
            }
        }
    }
}

const gameServer = new GameServer();

// Cleanup old games every 10 minutes
setInterval(() => {
    gameServer.cleanupOldGames();
}, 10 * 60 * 1000);

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    ws.on('close', () => {
        // Find and remove player
        for (const [playerId, playerData] of players.entries()) {
            if (playerData.ws === ws) {
                const gameId = playerData.gameId;
                players.delete(playerId);

                // Notify other player
                const game = games.get(gameId);
                if (game) {
                    const otherPlayer = game.players.find(p => p.id !== playerId);
                    if (otherPlayer && otherPlayer.id) {
                        const otherPlayerData = players.get(otherPlayer.id);
                        if (otherPlayerData) {
                            otherPlayerData.ws.send(JSON.stringify({
                                type: 'error',
                                message: 'Opponent disconnected'
                            }));
                        }
                    }
                }

                console.log(`Player disconnected: ${playerId}`);
                break;
            }
        }
    });
});

function handleMessage(ws, data) {
    switch (data.type) {
        case 'create':
            handleCreateGame(ws, data);
            break;

        case 'join':
            handleJoinGame(ws, data);
            break;

        case 'execute':
            handleExecuteCode(ws, data);
            break;

        default:
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Unknown message type'
            }));
    }
}

function handleCreateGame(ws, data) {
    const game = gameServer.createGame(data.playerId, data.mode);

    players.set(data.playerId, {
        ws: ws,
        gameId: game.id
    });

    ws.send(JSON.stringify({
        type: 'gameCreated',
        gameId: game.id,
        mode: game.mode,
        gameState: gameServer.getGameState(game)
    }));

    console.log(`Game created: ${game.id} (${game.mode} mode)`);
}

function handleJoinGame(ws, data) {
    const result = gameServer.joinGame(data.playerId, data.gameId);

    if (!result.success) {
        ws.send(JSON.stringify({
            type: 'error',
            message: result.error
        }));
        return;
    }

    const game = result.game;

    players.set(data.playerId, {
        ws: ws,
        gameId: game.id
    });

    // Notify joining player
    ws.send(JSON.stringify({
        type: 'gameJoined',
        gameId: game.id,
        mode: game.mode,
        gameState: gameServer.getGameState(game)
    }));

    // Notify both players that game is starting
    if (game.started) {
        const gameState = gameServer.getGameState(game);

        game.players.forEach(player => {
            if (player.id) {
                const playerData = players.get(player.id);
                if (playerData) {
                    playerData.ws.send(JSON.stringify({
                        type: 'gameStart',
                        gameState: gameState
                    }));
                }
            }
        });

        console.log(`Game started: ${game.id}`);
    }
}

function handleExecuteCode(ws, data) {
    const game = gameServer.getGame(data.gameId);

    if (!game) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Game not found'
        }));
        return;
    }

    // Find opponent
    const opponent = game.players.find(p => p.id !== data.playerId);

    if (opponent && opponent.id) {
        const opponentData = players.get(opponent.id);
        if (opponentData) {
            // Notify opponent of code execution
            opponentData.ws.send(JSON.stringify({
                type: 'opponentAction',
                playerId: data.playerId,
                code: data.code
            }));
        }
    }
}

// API endpoint to check server status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        activeGames: games.size,
        activePlayers: players.size
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   EPIC ASSEMBLY ARENA - Server Running    ║
║                                            ║
║   Port: ${PORT}                              ║
║   URL: http://localhost:${PORT}              ║
╚════════════════════════════════════════════╝
    `);
});
