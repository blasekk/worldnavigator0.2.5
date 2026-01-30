import type { Country } from '@/lib/countries';

export type GuessResult = {
  guessedCountry: Country;
  isCorrect: boolean;
  continentMatch: boolean;
  hemisphereMatch: boolean;
  tempComparison: 'match' | 'higher' | 'lower';
  elevComparison: 'match' | 'higher' | 'lower';
  direction: string; // Arrow emoji
};

export function getRandomCountry(countries: Country[]): Country {
  const randomIndex = Math.floor(Math.random() * countries.length);
  return countries[randomIndex];
}

export function getDirectionArrow(
  guess: Country,
  target: Country
): string {
  const latDiff = target.lat - guess.lat;
  const lngDiff = target.lng - guess.lng;
  const latThreshold = 5;
  const lngThreshold = 5;

  let vertical = '';
  let horizontal = '';

  if (latDiff > latThreshold) vertical = 'N';
  else if (latDiff < -latThreshold) vertical = 'S';

  if (lngDiff > lngThreshold) horizontal = 'E';
  else if (lngDiff < -lngThreshold) horizontal = 'W';

  const direction = vertical + horizontal;
  
  if (guess.id === target.id) return '✅';

  const arrows: { [key: string]: string } = {
    N: '⬆️',
    S: '⬇️',
    E: '➡️',
    W: '⬅️',
    NE: '↗️',
    NW: '↖️',
    SE: '↘️',
    SW: '↙️',
  };

  return arrows[direction] || '↔️'; // Fallback for when directly on lat or lng
}


export function evaluateGuess(
  guessedCountry: Country,
  targetCountry: Country
): GuessResult {
    
  if (!guessedCountry || !targetCountry) {
    throw new Error("Invalid country data provided for evaluation.");
  }
    
  const isCorrect = guessedCountry.id === targetCountry.id;

  return {
    guessedCountry,
    isCorrect,
    continentMatch: guessedCountry.continent.en === targetCountry.continent.en,
    hemisphereMatch: guessedCountry.hemisphere.en === targetCountry.hemisphere.en,
    tempComparison:
      guessedCountry.temp === targetCountry.temp
        ? 'match'
        : guessedCountry.temp < targetCountry.temp
        ? 'higher'
        : 'lower',
    elevComparison:
      guessedCountry.elev === targetCountry.elev
        ? 'match'
        : guessedCountry.elev < targetCountry.elev
        ? 'higher'
        : 'lower',
    direction: getDirectionArrow(guessedCountry, targetCountry),
  };
}
