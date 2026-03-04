export function shouldCommitDragStop(input: {
  origin?: { x: number; y: number };
  current: { x: number; y: number };
}): boolean {
  if (!input.origin) return true;
  return input.origin.x !== input.current.x || input.origin.y !== input.current.y;
}
