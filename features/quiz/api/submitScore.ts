import { functions } from '../../../lib/firebase';

/** submitScoreFunction へのリクエスト型 */
export interface SubmitScoreRequest {
  level: string;
  answers: string[];
  startedAt: number;
}

/** ランキングの1エントリ */
export interface RankingEntry {
  rank: number;
  username: string;
  correct_count: number;
  elapsed_time: number;
}

/** submitScoreFunction からのレスポンス型 */
export interface SubmitScoreResponse {
  ranked: boolean;
  rank: number | null;
  correct_count: number;
  elapsed_time: number;
  claimToken: string | null;
  rankings: RankingEntry[];
}

const submitScoreCallable = functions.httpsCallable<SubmitScoreRequest, SubmitScoreResponse>(
  'submitScoreFunction'
);

/**
 * Cloud Functions の submitScoreFunction を呼び出してスコアを送信する。
 * @param req level / answers(生入力文字列20件) / startedAt(ms Unix timestamp)
 */
export async function submitScore(req: SubmitScoreRequest): Promise<SubmitScoreResponse> {
  const result = await submitScoreCallable(req);
  return result.data;
}
