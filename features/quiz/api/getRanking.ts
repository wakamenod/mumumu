import { functions } from '../../../lib/firebase';
import type { RankingEntry } from './submitScore';

/** getRankingFunction へのリクエスト型 */
export interface GetRankingRequest {
  level: string;
}

/** getRankingFunction からのレスポンス型 */
export interface GetRankingResponse {
  rankings: RankingEntry[];
}

const getRankingCallable = functions.httpsCallable<GetRankingRequest, GetRankingResponse>(
  'getRankingFunction'
);

/**
 * Cloud Functions の getRankingFunction を呼び出して指定レベルのランキングを取得する。
 * @param level レベル識別子（A〜M）
 * @returns ランキングエントリの配列（最大20件）。データなしの場合は空配列。
 */
export async function getRanking(level: string): Promise<RankingEntry[]> {
  const result = await getRankingCallable({ level });
  return result.data.rankings;
}
