/**
 * Main Game Client - Handles 3D rendering and game state
 */

class GameClient {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clouds = [];
        this.assemblyTextMeshes = [];
        this.arena = null;

        this.ws = null;
        this.gameId = null;
        this.playerId = this.generateId();
        this.gameEngine = new GameEngine();
        this.referee = new Referee(this.gameEngine);
        this.gameEngine.referee = this.referee;

        this.gameStarted = false;
        this.myPlayerIndex = 0;

        this.init3D();
        this.setupEventListeners();
    }

    generateId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    init3D() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        const greenLight = new THREE.PointLight(0x00ff00, 0.5, 20);
        greenLight.position.set(0, 5, 0);
        this.scene.add(greenLight);

        // Create arena
        this.createArena();

        // Create clouds (will be positioned when game starts)
        this.createClouds();

        // Create floating assembly code
        this.createFloatingCode();

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createArena() {
        // Square grid floor
        const gridSize = 20;
        const gridDivisions = 20;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00ff00, 0x003300);
        this.scene.add(gridHelper);

        // Arena boundary
        const boundaryGeometry = new THREE.BoxGeometry(12, 0.2, 12);
        const boundaryMaterial = new THREE.MeshPhongMaterial({
            color: 0x003300,
            transparent: true,
            opacity: 0.3,
            wireframe: false
        });
        const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        boundary.position.y = -0.1;
        this.scene.add(boundary);

        // Boundary edges
        const edgesGeometry = new THREE.EdgesGeometry(boundaryGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        boundary.add(edges);

        this.arena = boundary;
    }

    createClouds() {
        // Create two cloud characters
        for (let i = 0; i < 2; i++) {
            const cloud = this.createCloud(i === 0 ? 0xffffff : 0xeeeeee);
            cloud.position.set(i === 0 ? -5 : 5, 2, 0);
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }

    createCloud(color) {
        const cloudGroup = new THREE.Group();

        // Main cloud body - multiple spheres for fluffy effect
        const spherePositions = [
            { x: 0, y: 0, z: 0, scale: 1 },
            { x: -0.5, y: 0.2, z: 0, scale: 0.8 },
            { x: 0.5, y: 0.2, z: 0, scale: 0.8 },
            { x: 0, y: 0.5, z: 0, scale: 0.7 },
            { x: -0.3, y: -0.2, z: 0.3, scale: 0.6 },
            { x: 0.3, y: -0.2, z: 0.3, scale: 0.6 },
        ];

        spherePositions.forEach(pos => {
            const geometry = new THREE.SphereGeometry(0.5 * pos.scale, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.9,
                emissive: color,
                emissiveIntensity: 0.2
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(pos.x, pos.y, pos.z);
            sphere.castShadow = true;
            cloudGroup.add(sphere);
        });

        // Add a glow effect
        const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        cloudGroup.add(glow);

        return cloudGroup;
    }

    createFloatingCode() {
        // Create floating assembly code snippets around the arena
        const codeSnippets = [
            'L R1,42', 'AR R2,R3', 'SLL R4,2', 'XR R5,R6',
            'M R1,8', 'SR R7,R8', 'N R9,X\'FF\'', 'LR R10,R11'
        ];

        const loader = new THREE.FontLoader();

        // Create simple text sprites instead of loading fonts
        codeSnippets.forEach((code, i) => {
            const angle = (i / codeSnippets.length) * Math.PI * 2;
            const radius = 8;

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;

            context.fillStyle = '#001100';
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.font = '20px Courier New';
            context.fillStyle = '#00ff00';
            context.fillText(code, 10, 35);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 0.6
            });
            const sprite = new THREE.Sprite(material);

            sprite.position.set(
                Math.cos(angle) * radius,
                2 + Math.sin(i) * 2,
                Math.sin(angle) * radius
            );
            sprite.scale.set(2, 0.5, 1);

            this.scene.add(sprite);
            this.assemblyTextMeshes.push(sprite);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate floating code
        this.assemblyTextMeshes.forEach((mesh, i) => {
            mesh.rotation.y += 0.005;
            mesh.position.y += Math.sin(Date.now() * 0.001 + i) * 0.001;
        });

        // Animate clouds (gentle bobbing)
        this.clouds.forEach((cloud, i) => {
            cloud.position.y = 2 + Math.sin(Date.now() * 0.001 + i * Math.PI) * 0.1;
            cloud.rotation.y += 0.002;
        });

        // Rotate arena slightly
        if (this.arena) {
            this.arena.rotation.y += 0.0005;
        }

        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        // Enter key to execute code
        document.getElementById('codeTextarea').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.executeCode();
            }
        });
    }

    createGame() {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        this.connectToServer();

        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: 'create',
                playerId: this.playerId,
                mode: mode
            }));
        };
    }

    joinGame() {
        const gameId = document.getElementById('gameIdInput').value.trim();
        if (!gameId) {
            alert('Please enter a game ID');
            return;
        }

        this.connectToServer();

        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: 'join',
                playerId: this.playerId,
                gameId: gameId
            }));
        };
    }

    connectToServer() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showOutput('Connection error. Please try again.', 'error');
        };

        this.ws.onclose = () => {
            if (this.gameStarted) {
                this.showOutput('Connection lost. Please refresh the page.', 'error');
            }
        };
    }

    handleServerMessage(message) {
        switch (message.type) {
            case 'gameCreated':
                this.gameId = message.gameId;
                this.gameEngine.initGame(message.mode, this.playerId);
                this.myPlayerIndex = 0;

                // Show invite link
                const inviteUrl = `${window.location.origin}?game=${this.gameId}`;
                document.getElementById('inviteLinkText').value = inviteUrl;
                document.getElementById('inviteLink').style.display = 'block';
                document.getElementById('waitingMessage').style.display = 'block';

                this.showOutput('Game created! Waiting for opponent...', 'info');
                break;

            case 'gameJoined':
                this.gameId = message.gameId;
                this.gameEngine.initGame(message.mode, this.playerId);
                this.gameEngine.addPlayer(this.playerId);
                this.myPlayerIndex = 1;

                document.getElementById('waitingMessage').style.display = 'none';
                this.showOutput('Joined game! Waiting to start...', 'info');
                break;

            case 'gameStart':
                this.startGame(message.gameState);
                break;

            case 'gameState':
                this.updateGameState(message.gameState);
                break;

            case 'executionResult':
                this.handleExecutionResult(message.result);
                break;

            case 'challenge':
                this.showChallenge(message.challenge);
                break;

            case 'error':
                this.showOutput(message.message, 'error');
                break;
        }
    }

    startGame(gameState) {
        this.gameStarted = true;
        document.getElementById('lobby').classList.add('hidden');
        document.getElementById('hud').style.display = 'block';

        document.getElementById('gameMode').textContent = gameState.gameMode === 'easy' ? 'Easy (Learning)' : 'Advanced';

        this.updateGameState(gameState);
        this.showOutput('Game started! Write assembly code to control your cloud.', 'success');
    }

    updateGameState(gameState) {
        // Update player stats
        gameState.players.forEach((player, index) => {
            const prefix = index === this.myPlayerIndex ? 'p1' : 'p2';

            document.getElementById(`${prefix}Health`).textContent = player.health;
            const healthPercent = (player.health / player.maxHealth) * 100;
            document.getElementById(`${prefix}HealthBar`).style.width = healthPercent + '%';

            // Update register display
            const regDisplay = document.getElementById(`${prefix}Registers`);
            const importantRegs = [0, 1, 2, 3].map(i =>
                `R${i}:${player.registers[i]}`
            ).join(' | ');
            regDisplay.textContent = importantRegs;

            // Update cloud position
            if (this.clouds[index]) {
                this.clouds[index].position.x = player.position.x;
                this.clouds[index].position.z = player.position.z;
            }
        });

        // Update distance
        document.getElementById('distance').textContent = gameState.distance;
    }

    executeCode() {
        const code = document.getElementById('codeTextarea').value.trim();
        if (!code) {
            this.showOutput('Please enter some code', 'error');
            return;
        }

        if (!this.gameStarted) {
            this.showOutput('Game not started yet', 'error');
            return;
        }

        // Check for active challenge
        if (this.referee.hasActiveChallenge(this.playerId)) {
            const result = this.referee.validateChallenge(this.playerId, code);
            this.handleExecutionResult(result);
            if (result.success) {
                document.getElementById('challengePrompt').style.display = 'none';
                document.getElementById('skipBtn').style.display = 'none';
            }
            return;
        }

        // Execute code locally and send to server
        const result = this.gameEngine.executePlayerCode(this.playerId, code);
        this.handleExecutionResult(result);

        // Send to server for opponent update
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'execute',
                playerId: this.playerId,
                gameId: this.gameId,
                code: code
            }));
        }

        // Check for new challenge
        if (result.challenge) {
            this.showChallenge(result.challenge);
        }

        // Update game state
        this.updateGameState(this.gameEngine.getGameState());

        // Check for game over
        if (result.gameOver) {
            setTimeout(() => {
                alert(result.winner === this.playerId ? 'You won! 🎉' : 'You lost! 💀');
            }, 500);
        }
    }

    handleExecutionResult(result) {
        if (result.success) {
            const messages = result.messages || [];
            this.showOutput(messages.join('\n') || 'Code executed successfully', 'success');
            document.getElementById('codeTextarea').value = '';
        } else {
            this.showOutput(`Error: ${result.error}`, 'error');
            if (result.hint) {
                this.showOutput(`Hint: ${result.hint}`, 'info');
            }
        }
    }

    showChallenge(challenge) {
        this.referee.setChallenge(this.playerId, challenge);

        const promptDiv = document.getElementById('challengePrompt');
        promptDiv.innerHTML = `<strong>⚡ CHALLENGE:</strong> ${challenge.question}`;
        promptDiv.style.display = 'block';

        document.getElementById('skipBtn').style.display = 'inline-block';

        this.showOutput('New challenge! Solve it to continue.', 'info');
    }

    skipChallenge() {
        const result = this.referee.skipChallenge(this.playerId);
        if (result.success) {
            document.getElementById('challengePrompt').style.display = 'none';
            document.getElementById('skipBtn').style.display = 'none';
            this.showOutput(result.message, 'info');
        }
    }

    showOutput(message, type = 'info') {
        const output = document.getElementById('output');
        const className = type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info');
        output.innerHTML = `<div class="${className}">${message}</div>`;
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new GameClient();

    // Check for game ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    if (gameId) {
        document.getElementById('gameIdInput').value = gameId;
    }
});
