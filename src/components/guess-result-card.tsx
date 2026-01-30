"use client";

import type { GuessResult } from "@/lib/game-logic";
import { useGame } from "@/contexts/game-context";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowUp, ArrowDown } from "lucide-react";

interface GuessResultCardProps {
  result: GuessResult;
  playerName?: string;
}

const InfoItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50 flex-1 min-w-[80px]">
    <h4 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</h4>
    <div className="mt-1 text-sm md:text-base font-semibold flex items-center justify-center gap-1.5">
      {children}
    </div>
  </div>
);

export function GuessResultCard({ result, playerName }: GuessResultCardProps) {
  const { language, t } = useGame();

  const getComparisonDisplay = (comparison: 'match' | 'higher' | 'lower') => {
    if (comparison === 'match') return <><CheckCircle2 className="text-green-500" /> {t.match}</>;
    if (comparison === 'higher') return <><ArrowUp className="text-primary" /> {t.higher}</>;
    return <><ArrowDown className="text-destructive" /> {t.lower}</>;
  };

  return (
    <Card className="w-full animate-in fade-in-0 slide-in-from-top-4 duration-500 shadow-sm bg-card">
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">{result.guessedCountry.name[language]}</h3>
          {playerName && <span className="text-sm text-muted-foreground">{playerName}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <InfoItem title={t.continent}>
            {result.continentMatch 
              ? <><CheckCircle2 className="text-green-500" /> {result.guessedCountry.continent[language]}</>
              : <><XCircle className="text-destructive" /> {result.guessedCountry.continent[language]}</>
            }
          </InfoItem>
          <InfoItem title={t.hemisphere}>
            {result.hemisphereMatch 
              ? <><CheckCircle2 className="text-green-500" /> {result.guessedCountry.hemisphere[language]}</>
              : <><XCircle className="text-destructive" /> {result.guessedCountry.hemisphere[language]}</>
            }
          </InfoItem>
          <InfoItem title={t.temperature}>
            {getComparisonDisplay(result.tempComparison)}
          </InfoItem>
          <InfoItem title={t.elevation}>
            {getComparisonDisplay(result.elevComparison)}
          </InfoItem>
          <InfoItem title={t.direction}>
            <span className="text-2xl">{result.direction}</span>
          </InfoItem>
        </div>
      </CardContent>
    </Card>
  );
}
