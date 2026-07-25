export type GameMode = 'classic_duo' | 'turn_based';
export type TileResult = 'correct' | 'present' | 'absent' | 'empty';

export interface GuessRecord {
  word: string;
  tiles: TileResult[];
  playerIndex: number;
  row: number;
  won: boolean;
}

export interface ChatMessage {
  message: string;
  playerIndex: number;
  timestamp: number;
}

export interface GameOverInfo {
  won: boolean;
  guesserIndex: number;
  wordAnswer?: string;
}
