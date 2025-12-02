/**
 * Referee - Generates challenges and manages difficulty
 */

class Referee {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.activeChallenges = new Map(); // playerId -> challenge
        this.challengeFrequency = {
            easy: 0.3,    // 30% chance per action
            advanced: 0.5 // 50% chance per action
        };

        // Easy mode challenges - teaching focused
        this.easyChallenges = [
            {
                type: 'register_value',
                question: 'Load the value 42 into register R1',
                hint: 'Use: L R1,42',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 42
                }
            },
            {
                type: 'register_value',
                question: 'Add 10 to the current value in R1',
                setup: (player) => { player.registers[1] = 5; },
                hint: 'Use: A R1,10',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 15
                }
            },
            {
                type: 'register_value',
                question: 'Load 8 into R1, then multiply it by 3',
                hint: 'Use: L R1,8 then M R1,3',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 24
                }
            },
            {
                type: 'register_value',
                question: 'Load 20 into R2, then copy it to R1',
                hint: 'Use: L R2,20 then LR R1,R2',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 20
                }
            },
            {
                type: 'register_value',
                question: 'Calculate 15 - 7 and store result in R1',
                hint: 'Use: L R1,15 then S R1,7',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 8
                }
            }
        ];

        // Advanced mode challenges - complex problems
        this.advancedChallenges = [
            {
                type: 'register_value',
                question: 'Calculate (25 * 4) + 10 and store in R1',
                hint: 'Use multiplication and addition',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 110
                }
            },
            {
                type: 'register_value',
                question: 'Convert hex X\'FF\' to decimal in R1, then AND with X\'0F\'',
                hint: 'Use L and N instructions',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 15
                }
            },
            {
                type: 'register_value',
                question: 'Shift 16 left by 2 bits (multiply by 4)',
                hint: 'Use: L R1,16 then SLL R1,2',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 64
                }
            },
            {
                type: 'register_value',
                question: 'Calculate XOR of X\'AA\' and X\'55\' in R1',
                hint: 'Load first value, then XOR with second',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 0xFF
                }
            },
            {
                type: 'register_value',
                question: 'Apply bit mask X\'F0\' to value 0xAB (170)',
                hint: 'Use L R1,X\'AB\' then N R1,X\'F0\'',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 0xA0
                }
            },
            {
                type: 'register_value',
                question: 'Store 100 in R1, divide by 3, then multiply by 2',
                hint: 'Chain operations: L, D, M',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 66
                }
            },
            {
                type: 'register_value',
                question: 'Calculate (X\'10\' << 1) | X\'03\'',
                hint: 'Shift left then OR',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 0x23
                }
            },
            {
                type: 'register_value',
                question: 'Set R1 to binary B\'11110000\', then right shift by 4',
                hint: 'Use: L R1,B\'11110000\' then SRL R1,4',
                solution: {
                    type: 'register_value',
                    register: 'R1',
                    value: 15
                }
            }
        ];
    }

    maybeGenerateChallenge(mode) {
        const frequency = this.challengeFrequency[mode] || 0.3;

        if (Math.random() < frequency) {
            return this.generateChallenge(mode);
        }

        return null;
    }

    generateChallenge(mode) {
        const challenges = mode === 'easy' ? this.easyChallenges : this.advancedChallenges;
        const challenge = challenges[Math.floor(Math.random() * challenges.length)];

        return {
            ...challenge,
            timestamp: Date.now()
        };
    }

    setChallenge(playerId, challenge) {
        this.activeChallenges.set(playerId, challenge);
    }

    hasActiveChallenge(playerId) {
        return this.activeChallenges.has(playerId);
    }

    getActiveChallenge(playerId) {
        return this.activeChallenges.get(playerId);
    }

    validateChallenge(playerId, code) {
        const challenge = this.activeChallenges.get(playerId);
        if (!challenge) {
            return { success: false, error: 'No active challenge' };
        }

        const playerIndex = this.gameEngine.getPlayerIndex(playerId);
        const player = this.gameEngine.players[playerIndex];

        // Setup initial state if needed
        if (challenge.setup) {
            challenge.setup(player);
        }

        // Parse and validate
        const parser = new AssemblyParser();
        const result = parser.validateChallenge(code, challenge.solution);

        if (result.success) {
            // Challenge completed successfully
            this.activeChallenges.delete(playerId);
            return {
                success: true,
                message: '✓ Challenge completed! ' + (result.message || ''),
                challengeCompleted: true
            };
        } else {
            return {
                success: false,
                error: result.error,
                hint: challenge.hint
            };
        }
    }

    skipChallenge(playerId) {
        if (this.activeChallenges.has(playerId)) {
            const challenge = this.activeChallenges.get(playerId);
            this.activeChallenges.delete(playerId);

            return {
                success: true,
                message: 'Challenge skipped. Hint: ' + challenge.hint,
                skipped: true
            };
        }

        return { success: false, error: 'No active challenge to skip' };
    }

    clearChallenge(playerId) {
        this.activeChallenges.delete(playerId);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Referee;
}
