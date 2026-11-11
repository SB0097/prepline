import { render, screen } from '@testing-library/react-native';

import { StartSeite } from './StartSeite';

describe('Startseite', () => {
  it('zeigt Logo und App-Namen', async () => {
    await render(<StartSeite />);
    expect(screen.getByText('Prepline')).toBeTruthy();
    expect(screen.getByLabelText('Prepline-Logo')).toBeTruthy();
  });
});
