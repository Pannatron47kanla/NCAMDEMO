// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fixedClock } from '../../shared/clock';
import { AssetScreen } from '../AssetScreen';
import { createAppModules } from '../modules';

describe('asset detail screen', () => {
  it('AC30: the screen follows changes made to the asset through the catalog', () => {
    const modules = createAppModules(fixedClock(new Date(2026, 9, 28)));
    render(<AssetScreen modules={modules} params={{ selAsset: 'A3' }} go={vi.fn()} />);
    expect(screen.getByText('พร้อมใช้', { selector: '.chip' })).toBeInTheDocument();

    act(() => modules.registry.catalog.setStatus('A3', 'รอซ่อม'));
    expect(screen.getByText('รอซ่อม', { selector: '.chip' })).toBeInTheDocument();
  });

  it('AC30: with no asset selected the first asset opens, and the buttons navigate', async () => {
    const user = userEvent.setup();
    const go = vi.fn();
    render(<AssetScreen modules={createAppModules(fixedClock(new Date(2026, 9, 28)))} params={{}} go={go} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('หุ่นฝึกช่วยฟื้นคืนชีพผู้ใหญ่ (CPR) ชุดที่ 1');
    await user.click(screen.getByRole('button', { name: '← กลับไปทะเบียน' }));
    expect(go).toHaveBeenLastCalledWith('assets');
    await user.click(screen.getByRole('button', { name: 'แจ้งซ่อม' }));
    expect(go).toHaveBeenLastCalledWith('repair', { repairAssetId: 'A1' });
  });
});
