// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from '../Icon';

describe('Icon', () => {
  it('AC3: shows the category title and scales with size (default 28)', () => {
    render(<Icon kind="bed" />);
    const box = screen.getByTitle('เตียงและครุภัณฑ์ห้องฝึก');
    expect(box).toHaveStyle({ width: '28px', height: '28px', borderRadius: '8px' });
    expect(box.querySelector('svg')).toHaveAttribute('width', '17');
  });

  it('AC3: an unknown kind falls back to "other", a missing kind to the manikin', () => {
    const { unmount } = render(<Icon kind="plant" size={48} />);
    expect(screen.getByTitle('อื่น ๆ')).toHaveStyle({ width: '48px', borderRadius: '14px' });
    unmount();
    render(<Icon />);
    expect(screen.getByTitle('หุ่นจำลอง')).toBeInTheDocument();
  });
});
