export default {
  // ─── Navigation ─────────────────────────────────────────────────────────
  nav: {
    quiz: 'Quiz',
    result: 'Result',
    difficultySelect: 'Difficulty',
    ranking: 'Ranking',
  },

  // ─── Home Screen (Difficulty Select) ────────────────────────────────────
  home: {
    appTitle: '🧮 Mental Math Quiz',
    subtitle: 'Choose difficulty & start! (%{count} questions)',
    startButton: '▶　Start!',
    startA11y: 'Start quiz at %{level}',
    rulesLink: '📖 Answer Rules',
    rulesTitle: '📖 Answer Rules',
    rule1: '・Enter fractions using a slash, e.g. "1/3" or "−2/5".',
    rule2: '・Answers must be in lowest terms (fully reduced fractions).',
    rule3:
      '・If the answer is a whole number, enter it as an integer (e.g. 3). "3/1" is incorrect.',
    rule4: '・"−0" is considered incorrect.',
    closeButton: 'Close',
  },

  // ─── Quiz Screen ────────────────────────────────────────────────────────
  quiz: {
    headerBack: 'Difficulty',
    confirmQuit: 'Quit the quiz?',
    cancel: 'Cancel',
    quit: 'Quit',
    progress: 'Q %{current} / %{total}',
    loading: 'Loading quiz...',
    errorTitle: 'An error occurred',
    noLevelId: 'levelId is not specified',
    submitLastA11y: 'Submit answer and view results',
    submitA11y: 'Submit answer',
    submitLast: 'Submit & Results',
    submit: 'Submit',
  },

  // ─── Result Screen ─────────────────────────────────────────────────────
  result: {
    scoring: 'Scoring...',
    errorTitle: 'An error occurred',
    correctCount: 'Correct',
    elapsedTime: 'Elapsed Time',
    rankingTitle: 'Ranking',
    goHome: 'Back to Home',
    goHomeA11y: 'Back to Home',
    registerFailed: 'Failed to register username',
    registerFailedMessage: 'Please check your connection and try again.',
  },

  // ─── Ranking Screen ────────────────────────────────────────────────────
  ranking: {
    heading: 'Ranking',
    loading: 'Loading...',
    errorTitle: 'An error occurred',
    retry: 'Retry',
    retryA11y: 'Retry',
    empty: 'No ranking data yet',
  },

  // ─── Ranking Table ─────────────────────────────────────────────────────
  rankingTable: {
    rank: 'Rank',
    username: 'Name',
    correctCount: 'Correct',
    elapsedTime: 'Time',
    timeSeconds: '%{time}s',
  },

  // ─── Difficulty Levels ──────────────────────────────────────────────────
  levels: {
    M: {
      label: 'Grade 1',
      sublabel: 'Grade 1',
      description: 'Addition, subtraction, number sequences, clocks',
    },
    L: {
      label: 'Grade 2',
      sublabel: 'Grade 2',
      description: 'Addition, subtraction, times tables, clocks',
    },
    K: {
      label: 'Grade 3',
      sublabel: 'Grade 3',
      description: 'Multiplication, division, decimals & fractions, unit conversion',
    },
    J: {
      label: 'Grade 4',
      sublabel: 'Grade 4',
      description: 'Mixed operations, decimals & fractions, rounding, area',
    },
    I: {
      label: 'Grade 5',
      sublabel: 'Grade 5',
      description: 'Fraction add/sub, factors & multiples, ratios, averages',
    },
    H: {
      label: 'Grade 6',
      sublabel: 'Grade 6',
      description: 'Mixed fraction operations, ratios, circle area, proportion',
    },
    G: {
      label: 'Junior High 1',
      sublabel: 'Junior High 1',
      description: 'Positive/negative numbers, linear equations, proportions',
    },
    F: {
      label: 'Junior High 2',
      sublabel: 'Junior High 2',
      description: 'Simultaneous equations, linear functions, basic probability',
    },
    E: {
      label: 'Junior High 3',
      sublabel: 'Junior High 3',
      description: 'Square roots, factoring, quadratic equations, Pythagorean theorem',
    },
    D: {
      label: 'High School 1',
      sublabel: 'High School 1',
      description: 'Probability, quadratic functions, trigonometric ratios, base-n',
    },
    C: {
      label: 'High School 2',
      sublabel: 'High School 2',
      description: 'Logarithms, differentiation, complex numbers, exponentials',
    },
    B: {
      label: 'High School 3',
      sublabel: 'High School 3',
      description: 'Limits, matrices, complex plane, calculus (Math III)',
    },
    A: {
      label: 'University',
      sublabel: 'University',
      description: 'Linear algebra, calculus, probability & statistics, number theory',
    },
  },

  // ─── Common ─────────────────────────────────────────────────────────────
  common: {
    unknownError: 'An unknown error occurred',
  },

  // ─── Accessibility ─────────────────────────────────────────────────────
  a11y: {
    prevLevel: 'Previous level',
    nextLevel: 'Next level',
  },

  // ─── Initials Entry Form ────────────────────────────────────────────────
  initials: {
    title: 'ENTER YOUR INITIALS',
    endButton: 'Done',
    backspace: 'Delete',
  },

  // ─── Numeric Keypad ─────────────────────────────────────────────────────
  keypad: {
    slash: 'Slash (fraction)',
    switchToMinus: 'Switch to minus',
    switchToPlus: 'Switch to plus',
    currentPlus: 'Current: +',
    currentMinus: 'Current: −',
    backspace: 'Delete',
  },

  // ─── 404 Screen ─────────────────────────────────────────────────────────
  notFound: {
    title: 'Oops!',
    message: "This screen doesn't exist.",
    goHome: 'Go to home screen!',
  },
};
