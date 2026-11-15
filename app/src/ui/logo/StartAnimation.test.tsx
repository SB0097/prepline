import { render, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { StartAnimation } from './StartAnimation';

describe('Start-Animation', () => {
  it('wird übersprungen, wenn Animationen am Handy aus sind', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const fertig = jest.fn();
    await render(<StartAnimation onFertig={fertig} />);
    await waitFor(() => expect(fertig).toHaveBeenCalledTimes(1));
  });

  it('zeigt Bauer und Schriftzug, wenn Animationen erlaubt sind', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { findByText } = await render(<StartAnimation onFertig={() => undefined} />);
    expect(await findByText('Prepline', { includeHiddenElements: true })).toBeTruthy();
  });
});
