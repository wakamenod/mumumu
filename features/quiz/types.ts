export type DifficultyId =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M';

export interface DifficultyLevel {
  id: DifficultyId;
  label: string;
  sublabel: string;
  description: string;
  stars: number; // 1–5
  color: string; // accent color for the card
}
