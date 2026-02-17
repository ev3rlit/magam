import { describe, expect, it } from 'bun:test';
import { searchIconNames } from './iconSearch';

const names = [
  'rocket',
  'bug',
  'bookOpen',
  'search',
  'settings',
  'sparkles',
] as const;

describe('iconSearch', () => {
  it('대소문자 구분 없이 prefix를 includes보다 우선 정렬한다', () => {
    const results = searchIconNames([...names], 'S');
    expect(results).toEqual(['search', 'settings', 'sparkles']);
  });

  it('동일 그룹에서는 alphabetical 정렬한다', () => {
    const results = searchIconNames([...names], 'oo');
    expect(results).toEqual(['bookOpen']);
  });

  it('query가 비면 alphabetical + maxResults를 따른다', () => {
    const results = searchIconNames([...names], '', 3);
    expect(results).toEqual(['bookOpen', 'bug', 'rocket']);
  });

  it('일치 결과가 없으면 빈 배열을 반환한다', () => {
    const results = searchIconNames([...names], 'zzz');
    expect(results).toEqual([]);
  });
});
