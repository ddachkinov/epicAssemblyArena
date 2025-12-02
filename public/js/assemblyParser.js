/**
 * IBM z/Architecture Assembly Parser
 * Supports basic instruction set for the game
 */

class AssemblyParser {
    constructor() {
        // Valid general-purpose registers (R0-R15)
        this.validRegisters = new Set([
            'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
            'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15'
        ]);

        // Instruction set
        this.instructions = {
            // Load/Store
            'L': { mnemonic: 'Load', format: 'RX', cycles: 1, description: 'Load value into register' },
            'ST': { mnemonic: 'Store', format: 'RX', cycles: 1, description: 'Store register value' },
            'LR': { mnemonic: 'Load Register', format: 'RR', cycles: 1, description: 'Load from register' },

            // Arithmetic
            'A': { mnemonic: 'Add', format: 'RX', cycles: 1, description: 'Add to register' },
            'AR': { mnemonic: 'Add Register', format: 'RR', cycles: 1, description: 'Add register to register' },
            'S': { mnemonic: 'Subtract', format: 'RX', cycles: 1, description: 'Subtract from register' },
            'SR': { mnemonic: 'Subtract Register', format: 'RR', cycles: 1, description: 'Subtract register from register' },
            'M': { mnemonic: 'Multiply', format: 'RX', cycles: 2, description: 'Multiply register' },
            'MR': { mnemonic: 'Multiply Register', format: 'RR', cycles: 2, description: 'Multiply register by register' },
            'D': { mnemonic: 'Divide', format: 'RX', cycles: 3, description: 'Divide register' },
            'DR': { mnemonic: 'Divide Register', format: 'RR', cycles: 3, description: 'Divide register by register' },

            // Logical
            'N': { mnemonic: 'AND', format: 'RX', cycles: 1, description: 'Logical AND' },
            'NR': { mnemonic: 'AND Register', format: 'RR', cycles: 1, description: 'AND register with register' },
            'O': { mnemonic: 'OR', format: 'RX', cycles: 1, description: 'Logical OR' },
            'OR': { mnemonic: 'OR Register', format: 'RR', cycles: 1, description: 'OR register with register' },
            'X': { mnemonic: 'XOR', format: 'RX', cycles: 1, description: 'Exclusive OR' },
            'XR': { mnemonic: 'XOR Register', format: 'RR', cycles: 1, description: 'XOR register with register' },

            // Shift
            'SLL': { mnemonic: 'Shift Left Logical', format: 'RS', cycles: 1, description: 'Shift left logical' },
            'SRL': { mnemonic: 'Shift Right Logical', format: 'RS', cycles: 1, description: 'Shift right logical' },
            'SLA': { mnemonic: 'Shift Left Arithmetic', format: 'RS', cycles: 1, description: 'Shift left arithmetic' },
            'SRA': { mnemonic: 'Shift Right Arithmetic', format: 'RS', cycles: 1, description: 'Shift right arithmetic' },

            // Compare
            'C': { mnemonic: 'Compare', format: 'RX', cycles: 1, description: 'Compare register with value' },
            'CR': { mnemonic: 'Compare Register', format: 'RR', cycles: 1, description: 'Compare register with register' },

            // Game-specific
            'MOVE': { mnemonic: 'Move', format: 'CUSTOM', cycles: 2, description: 'Move player (forward/back)' },
            'ATTACK': { mnemonic: 'Attack', format: 'CUSTOM', cycles: 3, description: 'Attack opponent' }
        };
    }

    parse(code) {
        const lines = code.trim().split('\n');
        const parsedInstructions = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines and comments
            if (!line || line.startsWith('*') || line.startsWith(';')) {
                continue;
            }

            try {
                const instruction = this.parseLine(line, i + 1);
                parsedInstructions.push(instruction);
            } catch (error) {
                return {
                    success: false,
                    error: error.message,
                    line: i + 1
                };
            }
        }

        return {
            success: true,
            instructions: parsedInstructions
        };
    }

    parseLine(line, lineNumber) {
        // Remove comments
        const commentIndex = line.indexOf('*');
        if (commentIndex !== -1) {
            line = line.substring(0, commentIndex);
        }

        line = line.trim();

        // Split into parts
        const parts = line.split(/[\s,]+/);
        const opcode = parts[0].toUpperCase();

        if (!this.instructions[opcode]) {
            throw new Error(`Unknown instruction: ${opcode} at line ${lineNumber}`);
        }

        const instruction = {
            opcode: opcode,
            line: lineNumber,
            ...this.instructions[opcode]
        };

        // Parse operands based on instruction format
        switch (instruction.format) {
            case 'RR': // Register-Register
                instruction.operands = this.parseRRFormat(parts.slice(1), lineNumber);
                break;
            case 'RX': // Register-Indexed Storage
                instruction.operands = this.parseRXFormat(parts.slice(1), lineNumber);
                break;
            case 'RS': // Register-Storage
                instruction.operands = this.parseRSFormat(parts.slice(1), lineNumber);
                break;
            case 'CUSTOM': // Game-specific
                instruction.operands = parts.slice(1);
                break;
        }

        return instruction;
    }

    parseRRFormat(operands, lineNumber) {
        if (operands.length !== 2) {
            throw new Error(`RR format requires 2 operands at line ${lineNumber}`);
        }

        const reg1 = operands[0].toUpperCase();
        const reg2 = operands[1].toUpperCase();

        if (!this.validRegisters.has(reg1)) {
            throw new Error(`Invalid register: ${reg1} at line ${lineNumber}`);
        }
        if (!this.validRegisters.has(reg2)) {
            throw new Error(`Invalid register: ${reg2} at line ${lineNumber}`);
        }

        return { reg1, reg2 };
    }

    parseRXFormat(operands, lineNumber) {
        if (operands.length < 2) {
            throw new Error(`RX format requires at least 2 operands at line ${lineNumber}`);
        }

        const reg = operands[0].toUpperCase();

        if (!this.validRegisters.has(reg)) {
            throw new Error(`Invalid register: ${reg} at line ${lineNumber}`);
        }

        // Second operand can be immediate value or memory reference
        const value = this.parseValue(operands[1]);

        return { reg, value };
    }

    parseRSFormat(operands, lineNumber) {
        if (operands.length !== 2) {
            throw new Error(`RS format requires 2 operands at line ${lineNumber}`);
        }

        const reg = operands[0].toUpperCase();
        const shift = this.parseValue(operands[1]);

        if (!this.validRegisters.has(reg)) {
            throw new Error(`Invalid register: ${reg} at line ${lineNumber}`);
        }

        if (shift < 0 || shift > 31) {
            throw new Error(`Shift amount must be 0-31 at line ${lineNumber}`);
        }

        return { reg, shift };
    }

    parseValue(value) {
        value = value.trim();

        // Hex value (X'...')
        if (value.startsWith("X'") && value.endsWith("'")) {
            const hexStr = value.substring(2, value.length - 1);
            return parseInt(hexStr, 16);
        }

        // Binary value (B'...')
        if (value.startsWith("B'") && value.endsWith("'")) {
            const binStr = value.substring(2, value.length - 1);
            return parseInt(binStr, 2);
        }

        // Decimal value
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            throw new Error(`Invalid value: ${value}`);
        }

        return num;
    }

    validateChallenge(userCode, expectedSolution) {
        const parsed = this.parse(userCode);

        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error
            };
        }

        // Check if the solution matches expected result
        if (expectedSolution.type === 'register_value') {
            return this.validateRegisterValue(parsed.instructions, expectedSolution);
        } else if (expectedSolution.type === 'instruction_sequence') {
            return this.validateInstructionSequence(parsed.instructions, expectedSolution);
        }

        return { success: true };
    }

    validateRegisterValue(instructions, expected) {
        // Simulate execution to check if target register has expected value
        const registers = new Array(16).fill(0);

        for (const instr of instructions) {
            this.executeInstruction(instr, registers);
        }

        const regNum = parseInt(expected.register.substring(1));
        const actualValue = registers[regNum];

        if (actualValue === expected.value) {
            return { success: true, message: `Correct! ${expected.register} = ${actualValue}` };
        } else {
            return {
                success: false,
                error: `Expected ${expected.register} to be ${expected.value}, but got ${actualValue}`
            };
        }
    }

    validateInstructionSequence(instructions, expected) {
        const opcodes = instructions.map(i => i.opcode);
        const expectedOpcodes = expected.sequence;

        if (JSON.stringify(opcodes) === JSON.stringify(expectedOpcodes)) {
            return { success: true, message: 'Correct instruction sequence!' };
        } else {
            return {
                success: false,
                error: `Expected sequence: ${expectedOpcodes.join(', ')}, got: ${opcodes.join(', ')}`
            };
        }
    }

    executeInstruction(instr, registers) {
        const getRegNum = (reg) => parseInt(reg.substring(1));

        switch (instr.opcode) {
            case 'L':
                registers[getRegNum(instr.operands.reg)] = instr.operands.value;
                break;
            case 'LR':
                registers[getRegNum(instr.operands.reg1)] = registers[getRegNum(instr.operands.reg2)];
                break;
            case 'A':
                registers[getRegNum(instr.operands.reg)] += instr.operands.value;
                break;
            case 'AR':
                registers[getRegNum(instr.operands.reg1)] += registers[getRegNum(instr.operands.reg2)];
                break;
            case 'S':
                registers[getRegNum(instr.operands.reg)] -= instr.operands.value;
                break;
            case 'SR':
                registers[getRegNum(instr.operands.reg1)] -= registers[getRegNum(instr.operands.reg2)];
                break;
            case 'M':
                registers[getRegNum(instr.operands.reg)] *= instr.operands.value;
                break;
            case 'MR':
                registers[getRegNum(instr.operands.reg1)] *= registers[getRegNum(instr.operands.reg2)];
                break;
            case 'D':
                if (instr.operands.value !== 0) {
                    registers[getRegNum(instr.operands.reg)] = Math.floor(registers[getRegNum(instr.operands.reg)] / instr.operands.value);
                }
                break;
            case 'DR':
                const divisor = registers[getRegNum(instr.operands.reg2)];
                if (divisor !== 0) {
                    registers[getRegNum(instr.operands.reg1)] = Math.floor(registers[getRegNum(instr.operands.reg1)] / divisor);
                }
                break;
            case 'N':
                registers[getRegNum(instr.operands.reg)] &= instr.operands.value;
                break;
            case 'NR':
                registers[getRegNum(instr.operands.reg1)] &= registers[getRegNum(instr.operands.reg2)];
                break;
            case 'O':
                registers[getRegNum(instr.operands.reg)] |= instr.operands.value;
                break;
            case 'OR':
                registers[getRegNum(instr.operands.reg1)] |= registers[getRegNum(instr.operands.reg2)];
                break;
            case 'X':
                registers[getRegNum(instr.operands.reg)] ^= instr.operands.value;
                break;
            case 'XR':
                registers[getRegNum(instr.operands.reg1)] ^= registers[getRegNum(instr.operands.reg2)];
                break;
            case 'SLL':
                registers[getRegNum(instr.operands.reg)] <<= instr.operands.shift;
                break;
            case 'SRL':
                registers[getRegNum(instr.operands.reg)] >>>= instr.operands.shift;
                break;
            case 'SLA':
                registers[getRegNum(instr.operands.reg)] <<= instr.operands.shift;
                break;
            case 'SRA':
                registers[getRegNum(instr.operands.reg)] >>= instr.operands.shift;
                break;
        }

        // Keep values in 32-bit range
        for (let i = 0; i < registers.length; i++) {
            registers[i] = registers[i] & 0xFFFFFFFF;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssemblyParser;
}
