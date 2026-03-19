/**
 * Dobble (also known as Spot It!) is based on the mathematical principle of 
 * Finite Projective Planes.
 * 
 * For a projective plane of order 'p' (where p is a prime number):
 * - Every card has p + 1 symbols.
 * - There are p^2 + p + 1 total symbols in the game.
 * - There are p^2 + p + 1 total cards possible.
 * - Any two cards share exactly ONE symbol.
 * 
 * In this implementation, we use p = 7, which results in:
 * - 8 symbols per card.
 * - 57 total symbols.
 * - 57 total cards.
 */

export function generateDobbleDeck(symbols: string[], order: number = 7): string[][] {
  const p = order;
  const symbolsPerCard = p + 1;
  const totalCards = p * p + p + 1;

  if (symbols.length < totalCards) {
    throw new Error(`Not enough symbols. Need ${totalCards}, but got ${symbols.length}.`);
  }

  const cards: number[][] = [];

  // 1. Generate the first card: [1, 2, 3, ..., p+1]
  const firstCard: number[] = [];
  for (let i = 1; i <= symbolsPerCard; i++) {
    firstCard.push(i);
  }
  cards.push(firstCard);

  // 2. Generate the next p cards
  // Each of these cards starts with the symbol '1'
  for (let j = 1; j <= p; j++) {
    const card: number[] = [1];
    for (let k = 1; k <= p; k++) {
      card.push(symbolsPerCard + (j - 1) * p + k);
    }
    cards.push(card);
  }

  // 3. Generate the remaining p*p cards
  for (let i = 1; i <= p; i++) {
    for (let j = 1; j <= p; j++) {
      const card: number[] = [i + 1];
      for (let k = 1; k <= p; k++) {
        // This is the core formula for the projective plane
        const val = symbolsPerCard + 1 + p * (k - 1) + (((i - 1) * (k - 1) + j - 1) % p);
        card.push(val);
      }
      cards.push(card);
    }
  }

  // Map the numeric indices to the actual symbols provided
  return cards.map(cardIndices => 
    cardIndices.map(idx => symbols[idx - 1])
  );
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 */
export function shuffleDeck<T>(deck: T[][]): T[][] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}
