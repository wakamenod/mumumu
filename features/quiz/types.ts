export type DifficultyId =
  | 'grade1'
  | 'grade2'
  | 'grade3'
  | 'grade4'
  | 'grade5'
  | 'grade6'
  | 'middle'
  | 'high'
  | 'university';

export interface DifficultyLevel {
  id: DifficultyId;
  label: string;
  sublabel: string;
  description: string;
  stars: number; // 1–5
  color: string; // accent color for the card
}
