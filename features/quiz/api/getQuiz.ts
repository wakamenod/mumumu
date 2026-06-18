import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';

/** getQuizFunction へのリクエスト型 */
export interface GetQuizRequest {
  levels: string[];
}

/** 1問分のクイズデータ */
export interface QuizQuestion {
  order: number;
  id: string;
  question: string;
  answer_hash: string;
}

/** getQuizFunction からのレスポンス型 */
export interface GetQuizResponse {
  questions: QuizQuestion[];
}

const getQuizCallable = httpsCallable<GetQuizRequest, GetQuizResponse>(
  functions,
  'getQuizFunction'
);

/**
 * Cloud Functions の getQuizFunction を呼び出してクイズ一覧を取得する。
 * @param levels 難易度 ID の配列（例: ["A", "C"]）
 */
export async function getQuiz(levels: string[]): Promise<GetQuizResponse> {
  const result = await getQuizCallable({ levels });
  return result.data;
}
