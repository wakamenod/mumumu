/**
 * constants.test.ts — Unit tests for quiz domain data
 *
 * テスト方針:
 *   - DIFFICULTY_LEVELS の構造的な整合性を検証する純粋なユニットテスト
 *   - UI や React に依存しないため、実行が速くフラグメントしない
 *   - データ変更（レベルの追加・削除）を安全にキャッチできる回帰テストとして機能する
 */

import { DIFFICULTY_LEVELS, TOTAL_QUESTIONS } from '../constants';
import type { DifficultyLevel } from '../types';

describe('DIFFICULTY_LEVELS', () => {
  it('9段階のレベルが定義されている', () => {
    expect(DIFFICULTY_LEVELS).toHaveLength(9);
  });

  it('各レベルが必須フィールドをすべて持つ', () => {
    const requiredKeys: (keyof DifficultyLevel)[] = [
      'id',
      'label',
      'sublabel',
      'description',
      'stars',
      'color',
    ];

    DIFFICULTY_LEVELS.forEach((level) => {
      requiredKeys.forEach((key) => {
        expect(level[key]).toBeDefined();
        expect(level[key]).not.toBe('');
      });
    });
  });

  it('id がすべてユニークである', () => {
    const ids = DIFFICULTY_LEVELS.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(DIFFICULTY_LEVELS.length);
  });

  it('stars が 1〜5 の範囲内である', () => {
    DIFFICULTY_LEVELS.forEach((level) => {
      expect(level.stars).toBeGreaterThanOrEqual(1);
      expect(level.stars).toBeLessThanOrEqual(5);
    });
  });

  it('stars が小学校 → 大学に向かって単調増加（または維持）する', () => {
    for (let i = 1; i < DIFFICULTY_LEVELS.length; i++) {
      expect(DIFFICULTY_LEVELS[i].stars).toBeGreaterThanOrEqual(DIFFICULTY_LEVELS[i - 1].stars);
    }
  });

  it('color が CSS16進数カラーコードの形式である', () => {
    const hexColor = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    DIFFICULTY_LEVELS.forEach((level) => {
      expect(level.color).toMatch(hexColor);
    });
  });

  it('先頭レベルは grade1（小学1年生）である', () => {
    expect(DIFFICULTY_LEVELS[0].id).toBe('grade1');
    expect(DIFFICULTY_LEVELS[0].label).toBe('小学1年生');
  });

  it('末尾レベルは university（大学生）である', () => {
    const last = DIFFICULTY_LEVELS[DIFFICULTY_LEVELS.length - 1];
    expect(last.id).toBe('university');
    expect(last.label).toBe('大学生');
  });
});

describe('TOTAL_QUESTIONS', () => {
  it('20問である', () => {
    expect(TOTAL_QUESTIONS).toBe(20);
  });
});
