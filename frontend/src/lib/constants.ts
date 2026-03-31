import { ChainLevel, Difficulty, RoundConfig } from "@/types/game";

export const MONEY_CHAIN: ChainLevel[] = [
  { position: 1, value: 100, difficulty: "Easy" },
  { position: 2, value: 250, difficulty: "Easy" },
  { position: 3, value: 500, difficulty: "Medium" },
  { position: 4, value: 1000, difficulty: "Medium" },
  { position: 5, value: 1750, difficulty: "Medium-Hard" },
  { position: 6, value: 3000, difficulty: "Medium-Hard" },
  { position: 7, value: 4500, difficulty: "Hard" },
  { position: 8, value: 6500, difficulty: "Hard" },
  { position: 9, value: 10000, difficulty: "Spicy" },
];

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: "#A8E6CF",
  Medium: "#FFD3B6",
  "Medium-Hard": "#FFB87A",
  Hard: "#D5AAFF",
  Spicy: "#FF8B94",
};

export const DIFFICULTY_BG_CLASSES: Record<Difficulty, string> = {
  Easy: "bg-difficulty-easy",
  Medium: "bg-difficulty-medium",
  "Medium-Hard": "bg-difficulty-medium-hard",
  Hard: "bg-difficulty-hard",
  Spicy: "bg-difficulty-spicy",
};

export const DEFAULT_ROUNDS: RoundConfig[] = [
  { roundNumber: 1, durationSeconds: 150 },
  { roundNumber: 2, durationSeconds: 140 },
  { roundNumber: 3, durationSeconds: 130 },
  { roundNumber: 4, durationSeconds: 120 },
  { roundNumber: 5, durationSeconds: 110 },
  { roundNumber: 6, durationSeconds: 100 },
  { roundNumber: 7, durationSeconds: 90 },
];

export const DEFAULT_PLAYERS = [
  { id: "1", name: "Player 1", isEliminated: false },
  { id: "2", name: "Player 2", isEliminated: false },
  { id: "3", name: "Player 3", isEliminated: false },
  { id: "4", name: "Player 4", isEliminated: false },
  { id: "5", name: "Player 5", isEliminated: false },
  { id: "6", name: "Player 6", isEliminated: false },
  { id: "7", name: "Player 7", isEliminated: false },
  { id: "8", name: "Player 8", isEliminated: false },
];

export const MOCK_QUESTIONS = [
  { id: "r1q1", text: "What is the capital of France?", answer: "Paris", difficulty: "Easy" as const, round: 1 },
  { id: "r1q2", text: "Which planet is known as the Red Planet?", answer: "Mars", difficulty: "Easy" as const, round: 1 },
  { id: "r1q3", text: "What is the largest ocean on Earth?", answer: "Pacific Ocean", difficulty: "Easy" as const, round: 1 },
  { id: "r1q4", text: "How many continents are there?", answer: "Seven", difficulty: "Easy" as const, round: 1 },
  { id: "r1q5", text: "What gas do plants absorb from the atmosphere?", answer: "Carbon dioxide", difficulty: "Medium" as const, round: 1 },
  { id: "r1q6", text: "In which year did the Titanic sink?", answer: "1912", difficulty: "Medium" as const, round: 1 },
  { id: "r1q7", text: "What is the chemical symbol for gold?", answer: "Au", difficulty: "Medium" as const, round: 1 },
  { id: "r1q8", text: "Which country is home to the kangaroo?", answer: "Australia", difficulty: "Easy" as const, round: 1 },
  { id: "r1q9", text: "What is the smallest prime number?", answer: "2", difficulty: "Easy" as const, round: 1 },
  { id: "r1q10", text: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci", difficulty: "Medium" as const, round: 1 },
  { id: "r1q11", text: "What is the hardest natural substance on Earth?", answer: "Diamond", difficulty: "Medium" as const, round: 1 },
  { id: "r1q12", text: "Which element has the atomic number 1?", answer: "Hydrogen", difficulty: "Medium-Hard" as const, round: 1 },
  { id: "r1q13", text: "What is the longest river in the world?", answer: "The Nile", difficulty: "Medium" as const, round: 1 },
  { id: "r1q14", text: "In what year did World War II end?", answer: "1945", difficulty: "Medium" as const, round: 1 },
  { id: "r1q15", text: "What is the speed of light in km/s (approximately)?", answer: "300,000 km/s", difficulty: "Medium-Hard" as const, round: 1 },
  { id: "r1q16", text: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare", difficulty: "Easy" as const, round: 1 },
  { id: "r1q17", text: "What is the currency of Japan?", answer: "Yen", difficulty: "Easy" as const, round: 1 },
  { id: "r1q18", text: "Which organ in the human body is the largest?", answer: "Skin", difficulty: "Medium-Hard" as const, round: 1 },
  { id: "r1q19", text: "What is the square root of 144?", answer: "12", difficulty: "Easy" as const, round: 1 },
  { id: "r1q20", text: "Which planet has the most moons?", answer: "Saturn", difficulty: "Hard" as const, round: 1 },
  { id: "r2q1", text: "What is the capital of Iceland?", answer: "Reykjavik", difficulty: "Medium" as const, round: 2 },
  { id: "r2q2", text: "Who discovered penicillin?", answer: "Alexander Fleming", difficulty: "Medium" as const, round: 2 },
  { id: "r2q3", text: "What is the tallest mountain in the world?", answer: "Mount Everest", difficulty: "Easy" as const, round: 2 },
  { id: "r2q4", text: "In which city is the Colosseum located?", answer: "Rome", difficulty: "Easy" as const, round: 2 },
  { id: "r2q5", text: "What does DNA stand for?", answer: "Deoxyribonucleic acid", difficulty: "Medium-Hard" as const, round: 2 },
  { id: "r2q6", text: "Who was the first person to walk on the Moon?", answer: "Neil Armstrong", difficulty: "Easy" as const, round: 2 },
  { id: "r2q7", text: "What is the chemical formula for water?", answer: "H2O", difficulty: "Easy" as const, round: 2 },
  { id: "r2q8", text: "Which artist cut off his own ear?", answer: "Vincent van Gogh", difficulty: "Medium" as const, round: 2 },
  { id: "r2q9", text: "What is the deepest ocean trench?", answer: "Mariana Trench", difficulty: "Medium-Hard" as const, round: 2 },
  { id: "r2q10", text: "In what year was the Berlin Wall torn down?", answer: "1989", difficulty: "Medium" as const, round: 2 },
  { id: "r2q11", text: "What language has the most native speakers?", answer: "Mandarin Chinese", difficulty: "Medium" as const, round: 2 },
  { id: "r2q12", text: "What is the largest desert in the world?", answer: "Antarctic Desert", difficulty: "Hard" as const, round: 2 },
  { id: "r2q13", text: "Who wrote 'The Origin of Species'?", answer: "Charles Darwin", difficulty: "Medium-Hard" as const, round: 2 },
  { id: "r2q14", text: "What is the powerhouse of the cell?", answer: "Mitochondria", difficulty: "Easy" as const, round: 2 },
  { id: "r2q15", text: "Which country has the most time zones?", answer: "France", difficulty: "Hard" as const, round: 2 },
  { id: "r2q16", text: "What is the boiling point of water in Fahrenheit?", answer: "212°F", difficulty: "Medium" as const, round: 2 },
  { id: "r2q17", text: "Who composed 'The Four Seasons'?", answer: "Antonio Vivaldi", difficulty: "Hard" as const, round: 2 },
  { id: "r2q18", text: "What is the rarest blood type?", answer: "AB negative", difficulty: "Hard" as const, round: 2 },
  { id: "r2q19", text: "Which element is represented by the symbol Fe?", answer: "Iron", difficulty: "Medium" as const, round: 2 },
  { id: "r2q20", text: "What is the only mammal capable of true flight?", answer: "Bat", difficulty: "Medium-Hard" as const, round: 2 },
];
