export default {
  // ─── ナビゲーション ─────────────────────────────────────────────────────
  nav: {
    quiz: 'クイズ',
    result: '結果',
    difficultySelect: '難易度選択',
    ranking: 'ランキング',
  },

  // ─── ホーム画面（難易度選択） ───────────────────────────────────────────
  home: {
    appTitle: '🧮 暗算クイズ',
    subtitle: '難易度を選んでスタート！ (全%{count}問)',
    startButton: '▶　スタート！',
    startA11y: '%{level}でクイズをスタート',
    rulesLink: '📖 解答ルール',
    rulesTitle: '📖 解答ルール',
    rule1: '・分数は「1/3」や「−2/5」のようにスラッシュで入力してください。',
    rule2: '・回答は必ず既約分数（これ以上約分できない状態）にしてください。',
    rule3: '・整数になる場合は整数（例: 3）で入力してください（「3/1」は不正解）。',
    rule4: '・「−0」は不正解となります。',
    closeButton: '閉じる',
  },

  // ─── クイズ画面 ─────────────────────────────────────────────────────────
  quiz: {
    headerBack: '難易度選択',
    confirmQuit: 'クイズを中断しますか？',
    cancel: 'キャンセル',
    quit: '中断する',
    progress: '問 %{current} / %{total}',
    loading: 'クイズを取得中...',
    errorTitle: 'エラーが発生しました',
    noLevelId: 'levelId が指定されていません',
    submitLastA11y: '回答して結果を見る',
    submitA11y: '回答する',
    submitLast: '回答して結果へ',
    submit: '回答',
  },

  // ─── 結果画面 ───────────────────────────────────────────────────────────
  result: {
    scoring: '採点中...',
    errorTitle: 'エラーが発生しました',
    correctCount: '正解数',
    elapsedTime: '経過時間',
    rankingTitle: 'ランキング',
    goHome: 'トップに戻る',
    goHomeA11y: 'トップに戻る',
    registerFailed: 'ユーザー名の登録に失敗しました',
    registerFailedMessage: '通信環境を確認して再度お試しください。',
  },

  // ─── ランキング画面 ─────────────────────────────────────────────────────
  ranking: {
    heading: 'ランキング',
    loading: '読み込み中...',
    errorTitle: 'エラーが発生しました',
    retry: '再試行',
    retryA11y: '再試行',
    empty: 'まだランキングデータがありません',
  },

  // ─── ランキングテーブル ─────────────────────────────────────────────────
  rankingTable: {
    rank: '順位',
    username: 'ユーザー名',
    correctCount: '正解数',
    elapsedTime: '経過時間',
    timeSeconds: '%{time}秒',
  },

  // ─── 難易度レベル ───────────────────────────────────────────────────────
  levels: {
    M: { label: '小学1年生', sublabel: 'Grade 1', description: 'たし算・ひき算・数の並び・時計' },
    L: { label: '小学2年生', sublabel: 'Grade 2', description: 'たし算・ひき算・九九・時計' },
    K: {
      label: '小学3年生',
      sublabel: 'Grade 3',
      description: 'かけ算・わり算・小数分数・単位計算',
    },
    J: {
      label: '小学4年生',
      sublabel: 'Grade 4',
      description: '四則混合計算・小数分数・概数・面積',
    },
    I: {
      label: '小学5年生',
      sublabel: 'Grade 5',
      description: '分数の加減・約数倍数・割合・平均',
    },
    H: {
      label: '小学6年生',
      sublabel: 'Grade 6',
      description: '分数混合計算・比・円の面積・比例',
    },
    G: {
      label: '中学1年生',
      sublabel: 'Junior High 1',
      description: '正負の数・一次方程式・比例反比例',
    },
    F: {
      label: '中学2年生',
      sublabel: 'Junior High 2',
      description: '連立方程式・一次関数・確率の基礎',
    },
    E: {
      label: '中学3年生',
      sublabel: 'Junior High 3',
      description: '平方根・因数分解・二次方程式・三平方',
    },
    D: {
      label: '高校1年生',
      sublabel: 'High School 1',
      description: '確率・二次関数・三角比・n進法',
    },
    C: {
      label: '高校2年生',
      sublabel: 'High School 2',
      description: '対数・微分・複素数・指数関数',
    },
    B: {
      label: '高校3年生',
      sublabel: 'High School 3',
      description: '極限・行列・複素数平面・微分積分 (数III)',
    },
    A: {
      label: '大学・一般',
      sublabel: 'University',
      description: '線形代数・微積分・確率統計・整数論',
    },
  },

  // ─── 共通 ───────────────────────────────────────────────────────────────
  common: {
    unknownError: '不明なエラーが発生しました',
  },

  // ─── アクセシビリティ ───────────────────────────────────────────────────
  a11y: {
    prevLevel: '前のレベル',
    nextLevel: '次のレベル',
  },

  // ─── イニシャル入力フォーム ─────────────────────────────────────────────
  initials: {
    title: 'ENTER YOUR INITIALS',
    endButton: '入力完了',
    backspace: '1文字削除',
  },

  // ─── テンキー ───────────────────────────────────────────────────────────
  keypad: {
    slash: 'スラッシュ（分数）',
    switchToMinus: 'マイナスに切り替え',
    switchToPlus: 'プラスに切り替え',
    currentPlus: '現在: +',
    currentMinus: '現在: −',
    backspace: '1文字削除',
  },

  // ─── 404 画面 ───────────────────────────────────────────────────────────
  notFound: {
    title: 'Oops!',
    message: 'この画面は存在しません。',
    goHome: 'ホーム画面に戻る',
  },
};
