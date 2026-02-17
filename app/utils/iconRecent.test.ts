import { describe, expect, it } from 'bun:test';
import { parseRecentIcons, updateRecentIcons } from './iconRecent';

describe('iconRecent', () => {
  it('최근 목록은 중복 제거 + 최신순 + 최대 개수를 유지한다', () => {
    const next = updateRecentIcons(['bug', 'rocket', 'search'], 'rocket', 3);
    expect(next).toEqual(['rocket', 'bug', 'search']);
  });

  it('parseRecentIcons는 유효한 값만 추려서 반환한다', () => {
    const raw = JSON.stringify(['rocket', 'invalid', 'bug', 'rocket']);
    const parsed = parseRecentIcons(raw, (name) => ['rocket', 'bug'].includes(name), 8);
    expect(parsed).toEqual(['rocket', 'bug']);
  });

  it('parseRecentIcons는 잘못된 JSON이면 빈 배열 반환', () => {
    expect(parseRecentIcons('{bad', () => true, 8)).toEqual([]);
  });
});
