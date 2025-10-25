/**
 * GameInputRecorder - Deterministic input recording for replay verification
 * 
 * Records all player inputs with precise timestamps to enable exact replay of game sessions.
 * This is critical for anti-cheat verification where the server can replay the inputs
 * and verify the final score matches.
 */

export interface InputEvent {
  /** Timestamp in milliseconds since game start */
  timestamp: number;
  /** The input action: 'forward', 'backward', 'left', 'right' */
  action: 'forward' | 'backward' | 'left' | 'right';
}

export interface GameRecording {
  /** Random seed used to generate the game (for deterministic replay) */
  seed: number;
  /** Game start timestamp (Unix timestamp in milliseconds) */
  startTime: number;
  /** Ordered list of input events */
  inputs: InputEvent[];
  /** Final score achieved */
  finalScore: number;
  /** Game duration in milliseconds */
  duration: number;
  /** Version of the recorder for compatibility */
  version: string;
}

export class GameInputRecorder {
  private recording: boolean = false;
  private seed: number = 0;
  private startTime: number = 0;
  private gameStartTimestamp: number = 0;
  private inputs: InputEvent[] = [];
  private readonly version = '1.0.0';

  /**
   * Start recording a new game session
   * @param seed Random seed used for game generation (if applicable)
   */
  start(seed?: number): void {
    this.recording = true;
    this.seed = seed || Date.now();
    this.startTime = Date.now();
    this.gameStartTimestamp = performance.now();
    this.inputs = [];
    
    console.log(`[Recorder] Started recording - seed: ${this.seed}`);
  }

  /**
   * Record a player input action
   * @param action The movement direction
   */
  recordInput(action: 'forward' | 'backward' | 'left' | 'right'): void {
    if (!this.recording) return;

    const timestamp = performance.now() - this.gameStartTimestamp;
    
    this.inputs.push({
      timestamp: Math.round(timestamp), // Round to nearest millisecond
      action
    });

    console.log(`[Recorder] Input recorded: ${action} at ${timestamp.toFixed(2)}ms`);
  }

  /**
   * Stop recording and return the complete recording
   * @param finalScore The final score achieved in the game
   */
  stop(finalScore: number): GameRecording {
    if (!this.recording) {
      throw new Error('Recorder is not active');
    }

    this.recording = false;
    const duration = Date.now() - this.startTime;

    const recording: GameRecording = {
      seed: this.seed,
      startTime: this.startTime,
      inputs: [...this.inputs],
      finalScore,
      duration,
      version: this.version
    };

    console.log(`[Recorder] Stopped recording - ${this.inputs.length} inputs, final score: ${finalScore}`);

    return recording;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording;
  }

  /**
   * Get current input count
   */
  getInputCount(): number {
    return this.inputs.length;
  }

  /**
   * Serialize recording to JSON string
   */
  static serialize(recording: GameRecording): string {
    return JSON.stringify(recording);
  }

  /**
   * Deserialize recording from JSON string
   */
  static deserialize(data: string): GameRecording {
    const recording = JSON.parse(data) as GameRecording;
    
    // Validate recording structure
    if (!recording.seed || !recording.inputs || !Array.isArray(recording.inputs)) {
      throw new Error('Invalid recording format');
    }

    // Validate version compatibility
    if (recording.version !== '1.0.0') {
      console.warn(`[Recorder] Recording version ${recording.version} may not be compatible`);
    }

    return recording;
  }

  /**
   * Calculate a hash of the recording for verification
   * Uses a simple hash algorithm suitable for client-side verification
   */
  static hash(recording: GameRecording): string {
    const data = `${recording.seed}-${recording.inputs.length}-${recording.finalScore}`;
    let hash = 0;
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate a recording's integrity
   */
  static validate(recording: GameRecording): boolean {
    // Check required fields
    if (!recording.seed || !recording.inputs || !recording.startTime) {
      return false;
    }

    // Validate inputs are ordered by timestamp
    for (let i = 1; i < recording.inputs.length; i++) {
      if (recording.inputs[i].timestamp < recording.inputs[i - 1].timestamp) {
        return false;
      }
    }

    // Validate actions are valid
    const validActions = ['forward', 'backward', 'left', 'right'];
    for (const input of recording.inputs) {
      if (!validActions.includes(input.action)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get recording statistics
   */
  static getStats(recording: GameRecording): {
    totalInputs: number;
    forwardMoves: number;
    backwardMoves: number;
    leftMoves: number;
    rightMoves: number;
    averageInputInterval: number;
  } {
    const stats = {
      totalInputs: recording.inputs.length,
      forwardMoves: 0,
      backwardMoves: 0,
      leftMoves: 0,
      rightMoves: 0,
      averageInputInterval: 0
    };

    recording.inputs.forEach(input => {
      switch (input.action) {
        case 'forward': stats.forwardMoves++; break;
        case 'backward': stats.backwardMoves++; break;
        case 'left': stats.leftMoves++; break;
        case 'right': stats.rightMoves++; break;
      }
    });

    if (recording.inputs.length > 1) {
      const totalTime = recording.inputs[recording.inputs.length - 1].timestamp - recording.inputs[0].timestamp;
      stats.averageInputInterval = totalTime / (recording.inputs.length - 1);
    }

    return stats;
  }
}

// Singleton instance for easy access
export const gameRecorder = new GameInputRecorder();
