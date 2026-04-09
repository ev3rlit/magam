import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampFloatingSidebarWidth,
  DEMO_FLOATING_SIDEBAR_DEFAULT_WIDTH,
  DEMO_FLOATING_SIDEBAR_MAX_WIDTH,
  DEMO_FLOATING_SIDEBAR_MIN_WIDTH,
  DEMO_MOBILE_SIDEBAR_MAX_WIDTH,
  DEMO_MOBILE_SIDEBAR_MEDIA_QUERY,
  isDemoMobileSidebarViewport,
  shouldAutoCloseFloatingSidebar,
} from './sidebar-behavior';

test('isDemoMobileSidebarViewport treats the configured breakpoint as mobile', () => {
  assert.equal(isDemoMobileSidebarViewport(DEMO_MOBILE_SIDEBAR_MAX_WIDTH - 1), true);
  assert.equal(isDemoMobileSidebarViewport(DEMO_MOBILE_SIDEBAR_MAX_WIDTH), true);
  assert.equal(isDemoMobileSidebarViewport(DEMO_MOBILE_SIDEBAR_MAX_WIDTH + 1), false);
});

test('shouldAutoCloseFloatingSidebar only closes the overlay automatically on mobile', () => {
  assert.equal(shouldAutoCloseFloatingSidebar(640), true);
  assert.equal(shouldAutoCloseFloatingSidebar(1280), false);
});

test('DEMO_MOBILE_SIDEBAR_MEDIA_QUERY stays aligned with the shared breakpoint', () => {
  assert.equal(DEMO_MOBILE_SIDEBAR_MEDIA_QUERY, '(max-width: 840px)');
});

test('clampFloatingSidebarWidth respects desktop min and max widths', () => {
  assert.equal(clampFloatingSidebarWidth(240, 1440), DEMO_FLOATING_SIDEBAR_MIN_WIDTH);
  assert.equal(clampFloatingSidebarWidth(520, 1440), 520);
  assert.equal(clampFloatingSidebarWidth(960, 1440), DEMO_FLOATING_SIDEBAR_MAX_WIDTH);
});

test('clampFloatingSidebarWidth clamps to the viewport gutter when space is tight', () => {
  assert.equal(clampFloatingSidebarWidth(DEMO_FLOATING_SIDEBAR_DEFAULT_WIDTH, 360), 328);
});
