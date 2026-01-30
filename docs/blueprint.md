# **App Name**: World Navigator

## Core Features:

- Country Guessing: Allow the user to guess a country from a datalist of available countries.
- Target Country Selection: Randomly select a target country from a predefined list to begin each game.
- Guess Evaluation: Evaluate the user's guess based on hemisphere, continent, temperature (higher/lower), elevation (higher/lower), and direction from the guessed country to the target country (using geographical coordinates).
- Multilingual Interface: Offer a language selector (Hungarian/English) to dynamically update the UI text using a translations object.
- Game End Logic: Provide win/loss conditions. On winning show a congratulatory message.  On giving up, reveal the correct country. Then reveal the Next button.
- Next Game: Allow to start a new game with a different country (without page refresh) on the press of the Next button.

## Style Guidelines:

- Primary color: Soft green (#A7D1AB), suggesting nature and geography.
- Background color: Very light, desaturated green (#F0F4EF).
- Accent color: Warm yellow (#F4D44D), used for interactive elements.
- Body and headline font: 'PT Sans' for readability and a modern feel.
- Employ a modern, clean, and responsive design using cards, shadows, and rounded corners.
- Use simple, clear icons to represent temperature (up/down arrows) and compass directions.
- Subtle transitions between game states (e.g., showing the result of a guess) using CSS transitions.