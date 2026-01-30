"use client";

import { useGame } from "@/contexts/game-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft } from "lucide-react";
import type { Language } from "@/lib/translations";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import type { QuestionType } from "@/lib/challenge-logic";

export function SettingsScreen() {
  const { setView, language, setLanguage, t, challengeQuestionTypes, setChallengeQuestionTypes } = useGame();
  
  const allQuestionTypes: QuestionType[] = ['flag', 'capital', 'audio', 'dish', 'animal'];

  const handleChallengeTypeChange = (type: QuestionType, checked: boolean) => {
    let newTypes: QuestionType[];
    if (checked) {
      newTypes = [...challengeQuestionTypes, type];
    } else {
      newTypes = challengeQuestionTypes.filter(t => t !== type);
    }
    setChallengeQuestionTypes(newTypes);
  };

  const typeLabels: Partial<Record<QuestionType, string>> = {
    flag: t.flags,
    capital: t.capitals,
    audio: t.anthems,
    dish: t.dishes,
    animal: t.animals,
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 relative">
       <Button variant="ghost" className="absolute top-4 left-4" onClick={() => setView('menu')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.back}
        </Button>
      <Card className="w-full max-w-md shadow-lg bg-card">
        <CardHeader>
          <CardTitle>{t.settings}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="language-group">{t.language}</Label>
            <RadioGroup
              id="language-group"
              value={language}
              onValueChange={(value) => setLanguage(value as Language)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="en" />
                <Label htmlFor="en">English</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hu" id="hu" />
                <Label htmlFor="hu">Magyar</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t.worldChallengeSettings}</h3>
            <div className="space-y-2">
                <Label>{t.questionTypes}</Label>
                {allQuestionTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id={`type-${type}`}
                            checked={challengeQuestionTypes.includes(type)}
                            onCheckedChange={(checked) => handleChallengeTypeChange(type, !!checked)}
                        />
                        <Label htmlFor={`type-${type}`} className="font-normal capitalize">
                            {typeLabels[type]}
                        </Label>
                    </div>
                ))}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
