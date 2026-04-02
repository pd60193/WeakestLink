export type Difficulty = "Easy" | "Medium" | "Medium-Hard" | "Hard" | "Spicy";

export interface ChainLevel {
  position: number;
  value: number;
  difficulty: Difficulty;
}

export interface Question {
  id: string;
  text?: string;
  imageUrl?: string;
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

// --- Phase 2: Real-time types ---

export type GamePhase =
  | "lobby"
  | "playing"
  | "voting"
  | "elimination"
  | "round_transition"
  | "game_over";

export interface RoundMetricsData {
  questionsAnswered: number;
  bankedThisRound: number;
  highestChainPosition: number;
  longestStreak: number;
  strongestLink: string | null;
  playerMetrics?: Record<
    string,
    { correctCount: number; correctValue: number; bankedAmount: number }
  >;
}

export interface VoteRevealEntry {
  voterId: string;
  voterName: string;
  votedForId: string;
  votedForName: string;
}

export interface VoteResult {
  eliminated: { id: string; name: string } | null;
  votes: Record<string, number>;
  fullVotes?: Record<string, string>;
  voteRevealOrder?: VoteRevealEntry[];
}

/** State as received from the server for presentation clients. */
export interface PresentationState {
  phase: GamePhase;
  currentRound: number;
  chainPosition: number;
  bankedThisRound: number;
  totalBanked: number;
  currentPlayerIndex: number;
  questionRevealed: boolean;
  timeRemaining: number;
  timerRunning: boolean;
  timerPaused: boolean;
  currentQuestion: Omit<Question, "answer"> | null;
  players: Player[];
  questionsAsked: number;
  revealedAnswer: string | null;
  roundMetrics: RoundMetricsData;
  voteCount: number;
  totalVotersExpected: number;
}

/** State as received from the server for admin clients. */
export interface AdminState extends Omit<PresentationState, "currentQuestion"> {
  currentQuestion: Question | null;
  votes: Record<string, string>;
}

/** State as received from the server for player clients. */
export interface PlayerState {
  phase: GamePhase;
  currentRound: number;
  chainPosition: number;
  bankedThisRound: number;
  totalBanked: number;
  timeRemaining: number;
  timerRunning: boolean;
  players: Player[];
  currentPlayerName: string | null;
  questionsAsked: number;
  hasVoted: boolean;
  voteCount: number;
  totalVotersExpected: number;
}

export interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
}
