import { Mail, Download, Bookmark } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";

interface CandidateActionButtonsProps {
  saved?: boolean;
  onContact?: () => void;
  onResumeData?: () => void;
  onSave?: () => void;
  disableContact?: boolean;
  disableResumeData?: boolean;
  disableSave?: boolean;
  className?: string;
}

export function CandidateActionButtons({
  saved,
  onContact,
  onResumeData,
  onSave,
  disableContact,
  disableResumeData,
  disableSave,
  className,
}: CandidateActionButtonsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-3 gap-2 w-full",
        className,
      )}
    >
      <Button
        type="button"
        className="w-full h-10 justify-center gap-2 text-sm sm:text-base whitespace-normal sm:whitespace-nowrap"
        disabled={Boolean(disableContact) || !onContact}
        onClick={onContact}
      >
        <Mail className="h-4 w-4 shrink-0" />
        <span className="truncate sm:overflow-visible sm:truncate-none">Contact</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-10 justify-center gap-2 text-sm sm:text-base whitespace-normal sm:whitespace-nowrap"
        disabled={Boolean(disableResumeData) || !onResumeData}
        onClick={onResumeData}
      >
        <Download className="h-4 w-4 shrink-0" />
        <span className="truncate sm:overflow-visible sm:truncate-none">Resume Data</span>
      </Button>

      <Button
        type="button"
        variant={saved ? "default" : "outline"}
        className="w-full h-10 justify-center gap-2 text-sm sm:text-base whitespace-normal sm:whitespace-nowrap"
        disabled={Boolean(disableSave) || !onSave}
        onClick={onSave}
        aria-pressed={Boolean(saved)}
      >
        <Bookmark className="h-4 w-4 shrink-0" />
        <span className="truncate sm:overflow-visible sm:truncate-none">
          {saved ? "Saved" : "Save"}
        </span>
      </Button>
    </div>
  );
}
