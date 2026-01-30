import { countries, type Country } from '@/lib/countries';
import type { Language } from './translations';

export type QuestionType = 'flag' | 'capital' | 'outline' | 'audio' | 'dish' | 'animal';

export interface Question {
  type: QuestionType;
  correctAnswer: Country;
  options: Country[];
  image?: string; // For flag or outline
  text?: string;  // For capital city name or dish name
  audio?: string; // For national anthem
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomCountries(allCountries: Country[], count: number): Country[] {
    const shuffled = shuffleArray(allCountries);
    return shuffled.slice(0, count);
}


export function generateQuestion(allCountries: Country[], lang: Language, enabledTypes: QuestionType[], excludeKeys: string[] = []): Question {
    let availableTypes = enabledTypes.filter(type => type !== 'outline'); // outline is not implemented

    if (availableTypes.length === 0) {
      availableTypes = ['flag'];
    }

    // 1. Build a pool of all possible questions { country, type }
    const allPossibleQuestions: { country: Country; type: QuestionType }[] = [];
    for (const country of allCountries) {
      for (const type of availableTypes) {
        // Skip if type is not possible for the country
        if (type === 'audio' && !country.anthemUrl) {
          continue;
        }
        if (type === 'dish' && !country.nationalDish) {
            continue;
        }
        if (type === 'animal' && !country.nationalAnimal) {
            continue;
        }
        allPossibleQuestions.push({ country, type });
      }
    }

    // 2. Filter out questions that have already been asked in the current session
    let availableQuestions = allPossibleQuestions.filter(
        q => !excludeKeys.includes(`${q.country.id}-${q.type}`)
    );
    
    // 3. If the pool of available questions is empty, reset it to all possible questions
    if (availableQuestions.length === 0 && allPossibleQuestions.length > 0) {
        availableQuestions = allPossibleQuestions;
    }
    
    // This should not happen if there are any countries and enabled types, but as a safe fallback
    if (availableQuestions.length === 0) {
        const fallbackCountry = allCountries[Math.floor(Math.random() * allCountries.length)];
        const otherOptions = getRandomCountries(allCountries.filter(c => c.id !== fallbackCountry.id), 3);
        return {
            type: 'flag',
            correctAnswer: fallbackCountry,
            options: shuffleArray([fallbackCountry, ...otherOptions]),
            image: `https://flagcdn.com/w320/${fallbackCountry.id.toLowerCase()}.png`,
        };
    }

    // 4. Pick a random question from the available pool
    const { country: correctAnswer, type: randomType } = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    
    // 5. Generate options for the selected question
    // For certain question types, options must also have the required data.
    let sourcePoolForOptions = allCountries;
    if (randomType === 'audio') {
        sourcePoolForOptions = allCountries.filter(c => !!c.anthemUrl);
    } else if (randomType === 'dish') {
        sourcePoolForOptions = allCountries.filter(c => !!c.nationalDish);
    } else if (randomType === 'animal') {
        sourcePoolForOptions = allCountries.filter(c => !!c.nationalAnimal);
    }
    
    const otherOptionsPool = sourcePoolForOptions.filter(c => c.id !== correctAnswer.id);
    const optionCount = Math.min(3, otherOptionsPool.length);
    const otherOptions = getRandomCountries(otherOptionsPool, optionCount);

    const options = shuffleArray([correctAnswer, ...otherOptions]);

    // 6. Build and return the final question object
    const question: Question = {
        type: randomType,
        correctAnswer: correctAnswer,
        options: options,
    };

    if (randomType === 'flag') {
        question.image = `https://flagcdn.com/w320/${correctAnswer.id.toLowerCase()}.png`;
    }

    if (randomType === 'capital') {
        question.text = correctAnswer.capital[lang];
    }
    
    if (randomType === 'dish') {
        question.text = correctAnswer.nationalDish![lang];
    }
    
    if (randomType === 'animal') {
        question.text = correctAnswer.nationalAnimal![lang];
    }

    if (randomType === 'audio') {
        question.audio = correctAnswer.anthemUrl;
    }
    
    return question;
}
