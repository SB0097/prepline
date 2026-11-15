import { GRUNDSTELLUNG } from '@prepline/shared';
import { render, screen } from '@testing-library/react-native';

import { FIGURENSAETZE } from './figuren';
import { FIGUREN_SVG } from './figurenSvg';
import { Schachbrett } from './Schachbrett';

describe('Schachbrett', () => {
  it('zeigt alle Figuren der Grundstellung', async () => {
    await render(<Schachbrett fen={GRUNDSTELLUNG} groesse={320} ansicht="weiss" />);
    expect(screen.getAllByTestId(/^figur-/)).toHaveLength(32);
    expect(screen.getByTestId('figur-e1')).toBeTruthy();
    expect(screen.getByLabelText('Schachbrett')).toBeTruthy();
  });

  it('beschriftet Linien und Reihen passend zur Ansicht', async () => {
    await render(<Schachbrett fen={GRUNDSTELLUNG} groesse={320} ansicht="schwarz" />);
    // Aus Sicht von Schwarz steht unten links h, oben links die 1.
    const texte = screen.getAllByText(/^[a-h1-8]$/).map((t) => t.props.children as string);
    expect(texte).toHaveLength(16);
    expect(texte[0]).toBe('1');
    expect(texte).toContain('h');
  });

  it('hat in jedem Figurensatz alle zwölf Figuren mit viewBox', () => {
    for (const satz of FIGURENSAETZE) {
      const figuren = Object.values(FIGUREN_SVG[satz]);
      expect(figuren).toHaveLength(12);
      for (const svg of figuren) {
        expect(svg).toMatch(/^<svg[^>]*viewBox=/);
        expect(svg).not.toMatch(/class=|<style/);
      }
    }
  });
});
