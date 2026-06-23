import { functions } from '../../../lib/firebase';

/** registerUsernameFunction へのリクエスト型 */
export interface RegisterUsernameRequest {
  level: string;
  claimToken: string;
  username: string;
}

/** registerUsernameFunction からのレスポンス型 */
export interface RegisterUsernameResponse {
  success: boolean;
  rank: number;
  username: string;
}

const registerUsernameCallable = functions.httpsCallable<
  RegisterUsernameRequest,
  RegisterUsernameResponse
>('registerUsernameFunction');

/**
 * Cloud Functions の registerUsernameFunction を呼び出してユーザー名を登録する。
 * @param level      クイズのレベル識別子（A〜M）
 * @param claimToken submitScoreFunction が返した一時認可トークン (UUID v4)
 * @param username   ユーザー名（英大文字 A〜Z・ハイフン、5文字固定）
 */
export async function registerUsername(
  level: string,
  claimToken: string,
  username: string
): Promise<RegisterUsernameResponse> {
  const result = await registerUsernameCallable({ level, claimToken, username });
  return result.data;
}
