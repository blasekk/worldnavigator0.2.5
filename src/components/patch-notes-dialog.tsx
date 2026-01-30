"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle } from "lucide-react";
import { useGame } from "@/contexts/game-context";

type PatchNote = {
  version: string;
  notes: string[];
};

export function PatchNotesDialog() {
  const { t } = useGame();

  const patchNotes: PatchNote[] = [
    {
      version: "0.2.5",
      notes: [t.patchNotes_0_2_5],
    },
    {
      version: "0.2.4",
      notes: [t.patchNotes_0_2_4],
    },
    {
      version: "0.2.3",
      notes: [t.patchNotes_0_2_3],
    },
    {
      version: "0.2.2",
      notes: [t.patchNotes_0_2_2],
    },
    {
      version: "0.2.1",
      notes: [t.patchNotes_0_2_1_a, t.patchNotes_0_2_1_b],
    },
    {
      version: "0.2.0",
      notes: [t.patchNotes_0_2_0],
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">{t.patchNotes}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.patchNotes}</DialogTitle>
          <DialogDescription>{t.patchNotesDescription}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
            {patchNotes.map((patch) => (
                <div key={patch.version}>
                <h3 className="font-bold text-lg mb-2">v{patch.version}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {patch.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                    ))}
                </ul>
                </div>
            ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
