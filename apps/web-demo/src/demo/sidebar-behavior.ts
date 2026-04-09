export const DEMO_MOBILE_SIDEBAR_MAX_WIDTH = 840;
export const DEMO_FLOATING_SIDEBAR_MIN_WIDTH = 320;
export const DEMO_FLOATING_SIDEBAR_DEFAULT_WIDTH = 420;
export const DEMO_FLOATING_SIDEBAR_MAX_WIDTH = 720;
export const DEMO_FLOATING_SIDEBAR_DESKTOP_GUTTER = 32;

export const DEMO_MOBILE_SIDEBAR_MEDIA_QUERY = `(max-width: ${DEMO_MOBILE_SIDEBAR_MAX_WIDTH}px)`;

export function isDemoMobileSidebarViewport(width: number): boolean {
  return width <= DEMO_MOBILE_SIDEBAR_MAX_WIDTH;
}

export function shouldAutoCloseFloatingSidebar(width: number): boolean {
  return isDemoMobileSidebarViewport(width);
}

export function clampFloatingSidebarWidth(width: number, viewportWidth: number): number {
  const maxAllowedWidth = Math.max(
    DEMO_FLOATING_SIDEBAR_MIN_WIDTH,
    Math.min(
      DEMO_FLOATING_SIDEBAR_MAX_WIDTH,
      viewportWidth - DEMO_FLOATING_SIDEBAR_DESKTOP_GUTTER,
    ),
  );

  return Math.min(Math.max(width, DEMO_FLOATING_SIDEBAR_MIN_WIDTH), maxAllowedWidth);
}
