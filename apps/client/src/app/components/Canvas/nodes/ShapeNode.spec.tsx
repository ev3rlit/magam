import { render, screen } from '@testing-library/react';
import ShapeNode from './ShapeNode';
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

describe('ShapeNode', () => {
  const defaultProps: NodeProps = {
    id: '1',
    data: { type: 'rectangle', label: 'Rect' },
    selected: false,
    zIndex: 1,
    type: 'shape',
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    dragging: false,
  };

  it('renders rectangle correctly', () => {
    const { container } = render(<ShapeNode {...defaultProps} />);
    expect(screen.getByText('Rect')).toBeTruthy();
    expect(container.querySelector('.rounded-md')).toBeTruthy();
  });

  it('renders circle correctly', () => {
    const props = {
      ...defaultProps,
      data: { type: 'circle', label: 'Circ' },
    } as NodeProps;
    const { container } = render(<ShapeNode {...props} />);
    expect(screen.getByText('Circ')).toBeTruthy();
    expect(container.querySelector('.rounded-full')).toBeTruthy();
  });

  it('renders triangle correctly', () => {
    const props = {
      ...defaultProps,
      data: { type: 'triangle', label: 'Tri' },
    } as NodeProps;
    const { container } = render(<ShapeNode {...props} />);
    expect(screen.getByText('Tri')).toBeTruthy();
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelector('polygon')).toBeTruthy();
  });

  it('applies color correctly', () => {
    const props = {
      ...defaultProps,
      data: { type: 'rectangle', label: 'Colored', color: 'bg-green-500' },
    } as NodeProps;
    const { container } = render(<ShapeNode {...props} />);
    const firstChild = container.firstChild as HTMLElement;
    expect(firstChild.className).toContain('bg-green-500');
  });
});
