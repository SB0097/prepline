import { sanAufDeutsch } from './notation.ts';

describe('Deutsche Notation', () => {
  it('übersetzt Figurenbuchstaben und Umwandlungen', () => {
    expect(
      ['Nf3', 'Bxc4', 'Rfe1', 'Qh5+', 'Kg1', 'e4', 'exd8=Q+', 'O-O', 'b8=N'].map(sanAufDeutsch),
    ).toEqual(['Sf3', 'Lxc4', 'Tfe1', 'Dh5+', 'Kg1', 'e4', 'exd8=D+', 'O-O', 'b8=S']);
  });
});
