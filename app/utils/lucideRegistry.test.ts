import { describe, expect, it } from 'bun:test';
import {
  getLucideIconByName,
  isValidLucideIconName,
  LUCIDE_ICON_NAMES,
} from './lucideRegistry';

describe('lucideRegistry utils', () => {
  it('유효한 아이콘 이름을 올바르게 판별한다', () => {
    expect(isValidLucideIconName('rocket')).toBe(true);
    expect(isValidLucideIconName('bug')).toBe(true);
    expect(isValidLucideIconName('not-an-icon')).toBe(false);
  });

  it('아이콘 이름으로 컴포넌트를 조회하고, 실패하면 null을 반환한다', () => {
    expect(getLucideIconByName('rocket')).toBeTruthy();
    expect(getLucideIconByName('not-an-icon')).toBeNull();
    expect(getLucideIconByName(undefined)).toBeNull();
    expect(getLucideIconByName(null)).toBeNull();
  });

  it('v1 레지스트리 목록이 비어있지 않다', () => {
    expect(LUCIDE_ICON_NAMES.length).toBeGreaterThan(0);
  });
});
