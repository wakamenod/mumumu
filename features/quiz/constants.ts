import { DifficultyLevel } from './types';

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: 'grade1',
    label: '小学1年生',
    sublabel: 'Grade 1',
    description: '1桁のたし算・ひき算',
    stars: 1,
    color: '#6FCF97', // green
  },
  {
    id: 'grade2',
    label: '小学2年生',
    sublabel: 'Grade 2',
    description: '2桁のたし算・ひき算、九九',
    stars: 1,
    color: '#56CCF2', // light blue
  },
  {
    id: 'grade3',
    label: '小学3年生',
    sublabel: 'Grade 3',
    description: 'かけ算・わり算の基礎',
    stars: 2,
    color: '#4A90E2', // blue
  },
  {
    id: 'grade4',
    label: '小学4年生',
    sublabel: 'Grade 4',
    description: '小数・分数の基礎',
    stars: 2,
    color: '#5B6CF9', // indigo
  },
  {
    id: 'grade5',
    label: '小学5年生',
    sublabel: 'Grade 5',
    description: '分数の計算・面積',
    stars: 3,
    color: '#9B59B6', // purple
  },
  {
    id: 'grade6',
    label: '小学6年生',
    sublabel: 'Grade 6',
    description: '比・速さ・比例',
    stars: 3,
    color: '#8E44AD', // dark purple
  },
  {
    id: 'middle',
    label: '中学生',
    sublabel: 'Middle School',
    description: '正負・方程式・平方根',
    stars: 4,
    color: '#E67E22', // orange
  },
  {
    id: 'high',
    label: '高校生',
    sublabel: 'High School',
    description: '二次方程式・三角関数',
    stars: 4,
    color: '#E74C3C', // red
  },
  {
    id: 'university',
    label: '大学生',
    sublabel: 'University',
    description: '微分・積分・行列',
    stars: 5,
    color: '#C0392B', // dark red
  },
];

export const TOTAL_QUESTIONS = 20;
