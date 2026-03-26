import { useState, useEffect } from "react";
import { Mic, MicOff, Copy, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "ja-JP", label: "日本語" },
  { code: "zh-CN", label: "中文" },
  { code: "ar-SA", label: "العربية" },
  { code: "pt-BR", label: "Português" },
  { code: "ko-KR", label: "한국어" },
] as const;

interface VoiceInputProps {
  onTranscriptChange?: (transcript: string) => void;
}

export default function VoiceInput({ onTranscriptChange }: VoiceInputProps) {
  const [language, setLanguage] = useState("en-US");

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({ language });

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCopy = () => {
    if (transcript.trim()) {
      navigator.clipboard.writeText(transcript.trim());
      toast.success("Copied to clipboard");
    }
  };

  const handleClear = () => {
    resetTranscript();
    onTranscriptChange?.("");
  };

  // Notify parent when transcript changes (in useEffect, not during render)
  const fullText = (transcript + interimTranscript).trim();
  useEffect(() => {
    onTranscriptChange?.(fullText);
  }, [fullText, onTranscriptChange]);

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
        <p className="font-medium text-destructive">Speech recognition not supported</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Please use Chrome, Edge, or Safari for voice input.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {transcript.trim() && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Mic button + waveform */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleToggle}
          className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isListening
              ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25"
              : "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90"
          )}
          aria-label={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}

          {/* Pulse rings */}
          {isListening && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
              <span className="absolute -inset-2 animate-pulse rounded-full border-2 border-destructive/30" />
            </>
          )}
        </button>

        {/* Waveform bars */}
        {isListening && (
          <div className="flex items-end gap-1 h-8" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-destructive/70 animate-waveform"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {isListening ? "Listening… tap to stop" : "Tap the mic and speak your query"}
        </p>
      </div>

      {/* Transcript area */}
      {(transcript || interimTranscript) && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 min-h-[60px]">
          <span className="text-foreground">{transcript}</span>
          {interimTranscript && (
            <span className="text-muted-foreground italic">{interimTranscript}</span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
