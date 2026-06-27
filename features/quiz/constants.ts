import { t } from '@/lib/i18n';

import { DifficultyLevel } from './types';

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: 'M',
    label: t('levels.M.label'),
    sublabel: t('levels.M.sublabel'),
    description: t('levels.M.description'),
    stars: 1,
    color: '#27AE60', // green
  },
  {
    id: 'L',
    label: t('levels.L.label'),
    sublabel: t('levels.L.sublabel'),
    description: t('levels.L.description'),
    stars: 1,
    color: '#6FCF97', // light green
  },
  {
    id: 'K',
    label: t('levels.K.label'),
    sublabel: t('levels.K.sublabel'),
    description: t('levels.K.description'),
    stars: 1,
    color: '#56CCF2', // sky blue
  },
  {
    id: 'J',
    label: t('levels.J.label'),
    sublabel: t('levels.J.sublabel'),
    description: t('levels.J.description'),
    stars: 2,
    color: '#2D9CDB', // blue
  },
  {
    id: 'I',
    label: t('levels.I.label'),
    sublabel: t('levels.I.sublabel'),
    description: t('levels.I.description'),
    stars: 2,
    color: '#4A90E2', // medium blue
  },
  {
    id: 'H',
    label: t('levels.H.label'),
    sublabel: t('levels.H.sublabel'),
    description: t('levels.H.description'),
    stars: 2,
    color: '#5B6CF9', // indigo
  },
  {
    id: 'G',
    label: t('levels.G.label'),
    sublabel: t('levels.G.sublabel'),
    description: t('levels.G.description'),
    stars: 3,
    color: '#9B59B6', // purple
  },
  {
    id: 'F',
    label: t('levels.F.label'),
    sublabel: t('levels.F.sublabel'),
    description: t('levels.F.description'),
    stars: 3,
    color: '#8E44AD', // dark purple
  },
  {
    id: 'E',
    label: t('levels.E.label'),
    sublabel: t('levels.E.sublabel'),
    description: t('levels.E.description'),
    stars: 3,
    color: '#F39C12', // amber
  },
  {
    id: 'D',
    label: t('levels.D.label'),
    sublabel: t('levels.D.sublabel'),
    description: t('levels.D.description'),
    stars: 4,
    color: '#E67E22', // orange
  },
  {
    id: 'C',
    label: t('levels.C.label'),
    sublabel: t('levels.C.sublabel'),
    description: t('levels.C.description'),
    stars: 4,
    color: '#E74C3C', // red
  },
  {
    id: 'B',
    label: t('levels.B.label'),
    sublabel: t('levels.B.sublabel'),
    description: t('levels.B.description'),
    stars: 5,
    color: '#C0392B', // dark red
  },
  {
    id: 'A',
    label: t('levels.A.label'),
    sublabel: t('levels.A.sublabel'),
    description: t('levels.A.description'),
    stars: 5,
    color: '#922B21', // deep red
  },
];

export const TOTAL_QUESTIONS = 7;

/** AsyncStorage key for persisting the last-selected difficulty level */
export const LAST_LEVEL_KEY = 'lastSelectedLevelId';
