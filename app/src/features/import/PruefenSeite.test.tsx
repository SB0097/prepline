import { render, screen } from '@testing-library/react-native';

import { entwurfSetzen } from './entwurf';
import { PruefenSeite } from './PruefenSeite';

describe('Import: Prüfen', () => {
  it('fasst die Züge zusammen und schlägt einen Namen vor', async () => {
    entwurfSetzen({
      text: '[Event "Evans"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *',
    });
    await render(<PruefenSeite />);
    expect(screen.getByText('6 Stellungen für dich · 1 Variante')).toBeTruthy();
    expect(screen.getByDisplayValue('Evans')).toBeTruthy();
    expect(screen.queryByText(/übersprungen/)).toBeNull();
  });

  it('zeigt übersprungene Züge an', async () => {
    entwurfSetzen({ text: '1. e4 e5 2. Nf3 Nc6 3. Bxf7 *', dateiname: 'kaputt.pgn' });
    await render(<PruefenSeite />);
    expect(screen.getByText('1 Stelle übersprungen')).toBeTruthy();
    expect(screen.getByText('Partie 1, Zug 3: Lxf7 ist nicht möglich')).toBeTruthy();
    expect(screen.getByDisplayValue('kaputt')).toBeTruthy();
  });

  it('meldet, wenn keine Züge gefunden wurden', async () => {
    entwurfSetzen({ text: 'Hallo' });
    await render(<PruefenSeite />);
    expect(screen.getByText('Keine Züge gefunden')).toBeTruthy();
  });
});

describe('Import: Prüfen, Einzahl', () => {
  it('schreibt „1 Stellung“ ohne n', async () => {
    entwurfSetzen({ text: '1. d4 d5 *' });
    await render(<PruefenSeite />);
    expect(screen.getByText('1 Stellung für dich')).toBeTruthy();
  });
});
