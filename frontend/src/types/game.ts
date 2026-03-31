export type Difficulty = "Easy" | "Medium" | "Medium-Hard" | "Hard" | "Spicy";

export interface ChainLevel {
  position: number;
  value: number;
  difficulty: Difficulty;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  difficulty: Difficulty;
  round: number;
}

export interface Player {
  id: string;
  name: string;
  isEliminated: boolean;
}

export interface RoundConfig {
  roundNumber: number;
  durationSeconds: number;
}

export interface GameConfig {
  moneyChain: ChainLevel[];
  rounds: RoundConfig[];
  players: Player[];
}

export interface GameState {
  currentRound: number;
  chainPosition: number;
  bankedThisRound: number;
  totalBanked: number;
  currentQuestionIndex: number;
  questionRevealed: boolean;
  timerRunning: boolean;
  timerPaused: boolean;
  timeUp: boolean;
  players: Player[];
  currentPlayerIndex: number;
  questions: Question[];
}
