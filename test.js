const EMOJIS = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
  "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋",
  "🐌", "🐞", "🐜", "🦟", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙",
  "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋",
  "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧"
];

function generateDeck() {
  const p = 7;
  const n = p + 1;
  const cards = [];

  let card = [];
  for (let i = 1; i <= n; i++) {
    card.push(i);
  }
  cards.push(card);

  for (let j = 1; j <= p; j++) {
    card = [];
    card.push(1);
    for (let k = 1; k <= p; k++) {
      card.push(n + (j - 1) * p + k);
    }
    cards.push(card);
  }

  for (let i = 1; i <= p; i++) {
    for (let j = 1; j <= p; j++) {
      card = [];
      card.push(i + 1);
      for (let k = 1; k <= p; k++) {
        card.push(n + 1 + p * (k - 1) + (((i - 1) * (k - 1) + j - 1) % p));
      }
      cards.push(card);
    }
  }

  const deck = cards.map(c => c.map(idx => EMOJIS[idx - 1]));
  return deck;
}

const deck = generateDeck();
let hasUndefined = false;
deck.forEach((card, i) => {
  card.forEach((symbol, j) => {
    if (symbol === undefined) {
      console.log(`Undefined at card ${i}, symbol ${j}`);
      hasUndefined = true;
    }
  });
});
if (!hasUndefined) console.log("All good!");
