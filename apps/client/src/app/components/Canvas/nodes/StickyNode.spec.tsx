import { render, screen } from '@testing-library/react';
import StickyNode from './StickyNode';
import { vi } from 'vitest';
import { NodeProps } from 'reactflow';

vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow');
  return {
    ...(actual as any),
    Handle: () => <div data-testid="handle" />,
    Position: {
      Top: 'top',
      Bottom: 'bottom',
      Left: 'left',
      Right: 'right',
    },
  };
});

describe('StickyNode', () => {
  const defaultProps: NodeProps = {
    id: '1',
    data: { label: 'Test Sticky' },
    selected: false,
    zIndex: 1,
    type: 'sticky',
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    dragging: false,
  };

  it('renders label correctly', () => {
    render(<StickyNode {...defaultProps} />);
    expect(screen.getByText('Test Sticky')).toBeTruthy();
  });

  it('applies color from data', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Colored Sticky', color: 'bg-red-500' },
    };
    const { container } = render(<StickyNode {...props} />);
    const firstChild = container.firstChild as HTMLElement;
    expect(firstChild.className).toContain('bg-red-500');
  });

  it('renders handles', () => {
    render(<StickyNode {...defaultProps} />);
    const handles = screen.getAllByTestId('handle');
    expect(handles).toHaveLength(2);
  });
});
