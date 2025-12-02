/**
 * Game Engine - Handles game state, player management, and combat logic
 */

class GameEngine {
    constructor() {
        this.players = [];
        this.gameMode = 'easy';
        this.turnBased = false;
        this.currentTurn = 0;
        this.maxDistance = 10;
        this.minAttackDistance = 3;

        this.parser = new AssemblyParser();
        this.referee = null; // Will be set by Referee class
    }

    initGame(mode, playerId) {
        this.gameMode = mode;

        // Initialize two players
        this.players = [
            {
                id: playerId,
                name: 'Player 1',
                health: 100,
                maxHealth: 100,
                position: { x: -5, z: 0 },
                registers: new Array(16).fill(0),
                color: 0xffffff,
                score: 0,
                isReady: true
            },
            {
                id: null, // Will be set when opponent joins
                name: 'Player 2',
                health: 100,
                maxHealth: 100,
                position: { x: 5, z: 0 },
                registers: new Array(16).fill(0),
                color: 0xeeeeee,
                score: 0,
                isReady: false
            }
        ];

        return this.getGameState();
    }

    addPlayer(playerId) {
        const player = this.players.find(p => !p.id);
        if (player) {
            player.id = playerId;
            player.isReady = true;
            return true;
        }
        return false;
    }

    getPlayerIndex(playerId) {
        return this.players.findIndex(p => p.id === playerId);
    }

    executePlayerCode(playerId, code) {
        const playerIndex = this.getPlayerIndex(playerId);
        if (playerIndex === -1) {
            return { success: false, error: 'Player not found' };
        }

        const player = this.players[playerIndex];
        const opponent = this.players[1 - playerIndex];

        // Check if player needs to solve a challenge first
        if (this.referee && this.referee.hasActiveChallenge(playerId)) {
            return this.referee.validateChallenge(playerId, code);
        }

        // Parse the code
        const parsed = this.parser.parse(code);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error,
                line: parsed.line
            };
        }

        // Execute instructions
        const result = this.executeInstructions(player, opponent, parsed.instructions);

        // Maybe trigger a challenge after execution
        if (this.referee && result.success) {
            const challenge = this.referee.maybeGenerateChallenge(this.gameMode);
            if (challenge) {
                result.challenge = challenge;
            }
        }

        return result;
    }

    executeInstructions(player, opponent, instructions) {
        let result = {
            success: true,
            actions: [],
            messages: []
        };

        for (const instr of instructions) {
            const actionResult = this.executeInstruction(player, opponent, instr);

            result.actions.push(actionResult);
            if (actionResult.message) {
                result.messages.push(actionResult.message);
            }

            if (!actionResult.success) {
                result.success = false;
                result.error = actionResult.error;
                break;
            }
        }

        // Check win condition
        if (opponent.health <= 0) {
            result.gameOver = true;
            result.winner = player.id;
            result.messages.push('🎉 Victory! You defeated your opponent!');
        }

        return result;
    }

    executeInstruction(player, opponent, instr) {
        const getRegNum = (reg) => parseInt(reg.substring(1));

        try {
            switch (instr.opcode) {
                // Load/Store
                case 'L':
                    player.registers[getRegNum(instr.operands.reg)] = instr.operands.value;
                    return {
                        success: true,
                        type: 'register_update',
                        message: `${instr.operands.reg} = ${instr.operands.value}`
                    };

                case 'LR':
                    player.registers[getRegNum(instr.operands.reg1)] = player.registers[getRegNum(instr.operands.reg2)];
                    return {
                        success: true,
                        type: 'register_update',
                        message: `${instr.operands.reg1} = ${instr.operands.reg2} (${player.registers[getRegNum(instr.operands.reg1)]})`
                    };

                // Arithmetic
                case 'A':
                    player.registers[getRegNum(instr.operands.reg)] += instr.operands.value;
                    return {
                        success: true,
                        type: 'register_update',
                        message: `${instr.operands.reg} += ${instr.operands.value} = ${player.registers[getRegNum(instr.operands.reg)]}`
                    };

                case 'AR':
                    const r1 = getRegNum(instr.operands.reg1);
                    const r2 = getRegNum(instr.operands.reg2);
                    player.registers[r1] += player.registers[r2];
                    return {
                        success: true,
                        type: 'register_update',
                        message: `${instr.operands.reg1} += ${instr.operands.reg2} = ${player.registers[r1]}`
                    };

                case 'S':
                    player.registers[getRegNum(instr.operands.reg)] -= instr.operands.value;
                    return {
                        success: true,
                        type: 'register_update',
                        message: `${instr.operands.reg} -= ${instr.operands.value} = ${player.registers[getRegNum(instr.operands.reg)]}`
                    };

                case 'SR':
                    const sr1 = getRegNum(instr.operands.reg1);
                    const sr2 = getRegNum(instr.operands.reg2);
                    player.registers[sr1] -= player.registers[sr2];
                    return {
                        success: true,
                        type: 'register_update',
                        message: `${instr.operands.reg1} -= ${instr.operands.reg2} = ${player.registers[sr1]}`
                    };

                case 'M':
                case 'MR':
                case 'D':
                case 'DR':
                case 'N':
                case 'NR':
                case 'O':
                case 'OR':
                case 'X':
                case 'XR':
                case 'SLL':
                case 'SRL':
                case 'SLA':
                case 'SRA':
                    // Execute using parser's method
                    const tempRegs = [...player.registers];
                    this.parser.executeInstruction(instr, tempRegs);
                    player.registers = tempRegs;
                    return {
                        success: true,
                        type: 'register_update',
                        message: `${instr.opcode} executed`
                    };

                // Game-specific commands
                case 'MOVE':
                    return this.executeMove(player, opponent, instr.operands[0]);

                case 'ATTACK':
                    return this.executeAttack(player, opponent);

                default:
                    return {
                        success: false,
                        error: `Instruction ${instr.opcode} not implemented for game actions`
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    executeMove(player, opponent, direction) {
        const dir = direction.toLowerCase();
        const distance = this.getDistance(player, opponent);

        if (dir === 'forward') {
            if (distance <= 1) {
                return {
                    success: false,
                    error: 'Cannot move closer - minimum distance reached'
                };
            }
            // Move toward opponent
            const dx = Math.sign(opponent.position.x - player.position.x);
            player.position.x += dx;
            return {
                success: true,
                type: 'move',
                direction: 'forward',
                message: `Moved forward. Distance: ${this.getDistance(player, opponent)} units`
            };
        } else if (dir === 'back' || dir === 'backward') {
            if (distance >= this.maxDistance) {
                return {
                    success: false,
                    error: 'Cannot move further - maximum distance reached'
                };
            }
            // Move away from opponent
            const dx = Math.sign(player.position.x - opponent.position.x);
            player.position.x += dx;
            return {
                success: true,
                type: 'move',
                direction: 'back',
                message: `Moved back. Distance: ${this.getDistance(player, opponent)} units`
            };
        } else {
            return {
                success: false,
                error: 'Invalid direction. Use "forward" or "back"'
            };
        }
    }

    executeAttack(player, opponent) {
        const distance = this.getDistance(player, opponent);

        if (distance > this.minAttackDistance) {
            return {
                success: false,
                error: `Too far to attack! Move closer (distance: ${distance}, need: ${this.minAttackDistance})`
            };
        }

        // Calculate damage based on register values
        // Use R1 as attack power (if set)
        let damage = Math.max(10, player.registers[1] % 30 + 10);

        // Apply damage
        opponent.health = Math.max(0, opponent.health - damage);
        player.score += damage;

        return {
            success: true,
            type: 'attack',
            damage: damage,
            message: `⚔️ Attack successful! Dealt ${damage} damage. Opponent HP: ${opponent.health}`
        };
    }

    getDistance(player1, player2) {
        return Math.abs(player1.position.x - player2.position.x);
    }

    getGameState() {
        return {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                health: p.health,
                maxHealth: p.maxHealth,
                position: { ...p.position },
                registers: [...p.registers],
                score: p.score,
                isReady: p.isReady
            })),
            gameMode: this.gameMode,
            distance: this.players.length === 2 ? this.getDistance(this.players[0], this.players[1]) : 0
        };
    }

    isGameReady() {
        return this.players.length === 2 && this.players.every(p => p.isReady);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
}
