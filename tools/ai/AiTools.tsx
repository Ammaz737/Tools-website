"use client";

import React, { useState } from "react";
import { ResultPanel, Button, Select, Textarea, Badge, Card } from "@/components/ui";

const AI_MAX_CHARS = 20000;

function CharMeter({ value }: { value: string }) {
  const over = value.length > AI_MAX_CHARS;
  return (
    <p
      className={`font-mono text-xs ${over ? "text-[var(--danger)]" : "text-[var(--ink-faint)]"}`}
    >
      {value.length.toLocaleString()} / {AI_MAX_CHARS.toLocaleString()} characters
      {over ? " — shorten your text before submitting" : ""}
    </p>
  );
}

function AiProviderHint() {
  return (
    <Card variant="sunk" className="px-4 py-3 text-xs leading-relaxed text-[var(--ink-soft)]">
      AI results can be inaccurate. Avoid submitting confidential information and review the output before using it.
    </Card>
  );
}

// 1. AI Writer Tool
export const AiWriterTool: React.FC<{ taskType?: string }> = ({ taskType = "write" }) => {
  const [task] = useState(taskType);
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length > AI_MAX_CHARS) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, prompt, tone }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.result);
      } else {
        setError(json.error || "AI generation failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AiProviderHint />
      <Select
        label="Writing Tone"
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        options={[
          { value: "professional", label: "Professional & Formal" },
          { value: "casual", label: "Casual & Friendly" },
          { value: "persuasive", label: "Persuasive & Marketing" },
          { value: "academic", label: "Academic & Detailed" },
        ]}
      />

      <Textarea
        label="Input Topic, Prompt, or Draft Text"
        placeholder="Type or paste your topic, rough draft, or bullet points here..."
        rows={6}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <CharMeter value={prompt} />

      <Button
        variant="primary"
        onClick={handleGenerate}
        loading={loading}
        disabled={!prompt.trim() || prompt.length > AI_MAX_CHARS}
      >
        Generate AI Content
      </Button>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] p-4 text-xs text-[var(--danger)]">
          {error}
        </Card>
      )}

      {result && (
        <ResultPanel
          title="Generated AI Output"
          status="done"
          copyValue={result}
          onClear={() => setResult(null)}
        >
          <div className="space-y-3">
            <p className="text-xs text-[var(--ink-faint)]">AI can make mistakes. Review before publishing.</p>
            <div className="whitespace-pre-wrap rounded-[8px] bg-[var(--surface-sunk)] p-4 font-sans text-sm leading-relaxed text-[var(--ink)]">
              {result}
            </div>
          </div>
        </ResultPanel>
      )}
    </div>
  );
};

// 2. Grammar / Spell / Translator
export const AiGrammarTranslatorTool: React.FC<{ initialMode?: string; toolId?: string }> = ({
  initialMode = "grammar",
  toolId = initialMode === "translate" ? "ai-translator" : "grammar-checker",
}) => {
  const [modeType] = useState(initialMode);
  const [prompt, setPrompt] = useState("");
  const [targetLang, setTargetLang] = useState("Spanish");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!prompt.trim() || prompt.length > AI_MAX_CHARS) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: modeType === "translate" ? "translate" : "grammar",
          toolId,
          prompt,
          targetLanguage: targetLang,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOutput(json.result);
      } else {
        setError(json.error || "Processing failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const title =
    modeType === "translate"
      ? "Translate"
      : modeType === "grammar"
        ? "Grammar & spelling"
        : "Process text";

  return (
    <div className="space-y-6">
      <AiProviderHint />
      {modeType === "translate" && (
        <Select
          label="Target Language"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          options={[
            { value: "Spanish", label: "Spanish" },
            { value: "French", label: "French" },
            { value: "German", label: "German" },
            { value: "Urdu", label: "Urdu" },
            { value: "Hindi", label: "Hindi" },
            { value: "Chinese", label: "Chinese" },
            { value: "Arabic", label: "Arabic" },
          ]}
        />
      )}
      {initialMode !== "translate" && (
        <Card variant="sunk" className="px-4 py-3 text-xs text-[var(--ink-soft)]">
          Checks grammar and spelling. Inline accept/reject suggestions
          are not available yet — review the corrected text carefully.
        </Card>
      )}

      <Textarea
        label="Input Text to Process"
        placeholder="Paste text here…"
        rows={6}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <CharMeter value={prompt} />

      <Button
        variant="primary"
        onClick={handleProcess}
        loading={loading}
        disabled={!prompt.trim() || prompt.length > AI_MAX_CHARS}
      >
        Run {title}
      </Button>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] p-4 text-xs text-[var(--danger)]">
          {error}
        </Card>
      )}

      {output && (
        <ResultPanel title="Processed Output" status="done" copyValue={output} onClear={() => setOutput(null)}>
          <div className="whitespace-pre-wrap rounded-[8px] bg-[var(--surface-sunk)] p-4 font-sans text-sm leading-relaxed text-[var(--ink)]">
            {output}
          </div>
        </ResultPanel>
      )}
    </div>
  );
};

// 3. AI Detector
export const AiDetectorTool: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    if (!prompt.trim() || prompt.length > AI_MAX_CHARS) return;
    setLoading(true);
    setError(null);
    setScore(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "detect", prompt }),
      });
      const json = await res.json();
      if (json.success) {
        if (typeof json.score !== "number") {
          setError("The check did not return a valid score. Try again later.");
          return;
        }
        setScore(json.score);
        setAnalysis(json.result);
      } else {
        setError(json.error || "AI detection failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AiProviderHint />
      <Card variant="sunk" className="px-4 py-3 text-xs text-[var(--ink-soft)]">
        Estimates are imperfect. Treat the score as a hint, not proof.
      </Card>
      <Textarea
        label="Input Text for AI Detection Analysis"
        placeholder="Paste article, essay, or draft…"
        rows={7}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <CharMeter value={prompt} />

      <Button
        variant="primary"
        onClick={handleDetect}
        loading={loading}
        disabled={!prompt.trim() || prompt.length > AI_MAX_CHARS}
      >
        Analyze Text for AI Content
      </Button>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] p-4 text-xs text-[var(--danger)]">
          {error}
        </Card>
      )}

      {analysis && score != null && (
        <ResultPanel title="AI Content Probability Report" status="done">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={score > 50 ? "danger" : "success"} size="md">
                {score > 50 ? "HIGH AI PROBABILITY" : "LIKELY HUMAN WRITTEN"}
              </Badge>
              <span className="font-mono text-sm font-bold text-[var(--ink)]">{score}% AI score</span>
            </div>
            <div className="whitespace-pre-wrap rounded-[8px] bg-[var(--surface-sunk)] p-4 font-mono text-xs text-[var(--ink)]">
              {analysis}
            </div>
          </div>
        </ResultPanel>
      )}
    </div>
  );
};

// 4. Plagiarism — honest not-configured / no fake scores
export const PlagiarismCheckerTool: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!prompt.trim() || prompt.length > AI_MAX_CHARS) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "plagiarism", prompt }),
      });
      const json = await res.json();
      setError(
        json.error ||
          "Web plagiarism checking is not configured. Uniqueness scores will not be invented.",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card variant="sunk" className="px-4 py-3 text-xs leading-relaxed text-[var(--ink-soft)]">
        Plagiarism checking is currently unavailable. A verified similarity report cannot be
        generated at this time.
      </Card>
      <Textarea
        label="Input Text for Similarity & Plagiarism Check"
        placeholder="Paste text…"
        rows={7}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <CharMeter value={prompt} />

      <Button
        variant="primary"
        onClick={handleCheck}
        loading={loading}
        disabled={!prompt.trim() || prompt.length > AI_MAX_CHARS}
      >
        Check configuration
      </Button>

      {error && (
        <Card variant="bordered" className="border-[var(--warn)] p-4 text-xs text-[var(--ink-soft)]">
          {error}
        </Card>
      )}
    </div>
  );
};
