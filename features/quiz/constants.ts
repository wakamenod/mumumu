import { DifficultyLevel } from './types';

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: 'M',
    label: '小学1年生',
    sublabel: 'Grade 1',
    description: 'たし算・ひき算・数の並び・時計',
    stars: 1,
    color: '#27AE60', // green
  },
  {
    id: 'L',
    label: '小学2年生',
    sublabel: 'Grade 2',
    description: 'たし算・ひき算・九九・時計',
    stars: 1,
    color: '#6FCF97', // light green
  },
  {
    id: 'K',
    label: '小学3年生',
    sublabel: 'Grade 3',
    description: 'かけ算・わり算・小数分数・単位計算',
    stars: 1,
    color: '#56CCF2', // sky blue
  },
  {
    id: 'J',
    label: '小学4年生',
    sublabel: 'Grade 4',
    description: '四則混合計算・小数分数・概数・面積',
    stars: 2,
    color: '#2D9CDB', // blue
  },
  {
    id: 'I',
    label: '小学5年生',
    sublabel: 'Grade 5',
    description: '分数の加減・約数倍数・割合・平均',
    stars: 2,
    color: '#4A90E2', // medium blue
  },
  {
    id: 'H',
    label: '小学6年生',
    sublabel: 'Grade 6',
    description: '分数混合計算・比・円の面積・比例',
    stars: 2,
    color: '#5B6CF9', // indigo
  },
  {
    id: 'G',
    label: '中学1年生',
    sublabel: 'Junior High 1',
    description: '正負の数・一次方程式・比例反比例',
    stars: 3,
    color: '#9B59B6', // purple
  },
  {
    id: 'F',
    label: '中学2年生',
    sublabel: 'Junior High 2',
    description: '連立方程式・一次関数・確率の基礎',
    stars: 3,
    color: '#8E44AD', // dark purple
  },
  {
    id: 'E',
    label: '中学3年生',
    sublabel: 'Junior High 3',
    description: '平方根・因数分解・二次方程式・三平方',
    stars: 3,
    color: '#F39C12', // amber
  },
  {
    id: 'D',
    label: '高校1年生',
    sublabel: 'High School 1',
    description: '確率・二次関数・三角比・n進法',
    stars: 4,
    color: '#E67E22', // orange
  },
  {
    id: 'C',
    label: '高校2年生',
    sublabel: 'High School 2',
    description: '対数・微分・複素数・指数関数',
    stars: 4,
    color: '#E74C3C', // red
  },
  {
    id: 'B',
    label: '高校3年生',
    sublabel: 'High School 3',
    description: '極限・行列・複素数平面・微分積分 (数III)',
    stars: 5,
    color: '#C0392B', // dark red
  },
  {
    id: 'A',
    label: '大学・一般',
    sublabel: 'University',
    description: '線形代数・微積分・確率統計・整数論',
    stars: 5,
    color: '#922B21', // deep red
  },
];

export const TOTAL_QUESTIONS = 20;
