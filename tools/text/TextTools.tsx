"use client";

import React, { useState } from "react";
import { Textarea, Button, ResultPanel, Input, Select, Toggle } from "@/components/ui";

// 1. Case Converter
export const CaseConverterTool: React.FC = () => {
  const [text, setText] = useState("Hello world! Welcome to Antigravity Toolbox.");

  const toCase = (type: string) => {
    switch (type) {
      case "upper":
        return text.toUpperCase();
      case "lower":
        return text.toLowerCase();
      case "title":
        return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      case "sentence":
        return text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());
      case "camel":
        return text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
      case "snake":
        return text.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      case "kebab":
        return text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      case "constant":
        return text.trim().toUpperCase().replace(/\s+/g, "_");
      case "alternating":
        return text.split("").map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join("");
      default:
        return text;
    }
  };

  return (
    <div className="space-y-6">
      <Textarea
        label="Input Text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Type or paste text here..."
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => setText(toCase("upper"))}>UPPERCASE</Button>
        <Button variant="secondary" size="sm" onClick={() => setText(toCase("lower"))}>lowercase</Button>
        <Button variant="secondary" size="sm" onClick={() => setText(toCase("title"))}>Title Case</Button>
        <Button variant="secondary" size="sm" onClick={() => setText(toCase("sentence"))}>Sentence case</Button>
        <Button variant="secondary" size="sm" onClick={() => setText(toCase("camel"))}>camelCase</Button>
        <Button variant="secondary" size="sm" onClick={() => setText(toCase("snake"))}>snake_case</Button>
        <Button variant="secondary" size="sm" onClick={() => setText(toCase("kebab"))}>kebab-case</Button>
        <Button variant="secondary" size="sm" onClick={() => setText(toCase("constant"))}>CONSTANT_CASE</Button>
        <Button variant="secondary" size="sm" onClick={() => setText(toCase("alternating"))}>aLtErNaTiNg</Button>
      </div>

      <ResultPanel title="Converted Result" status="live" copyValue={text} onClear={() => setText("")}>
        <pre className="font-mono text-sm whitespace-pre-wrap break-all">{text}</pre>
      </ResultPanel>
    </div>
  );
};

// 2. Word Counter
export const WordCounterTool: React.FC = () => {
  const [text, setText] = useState("");

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((part) => part.trim()).length : 0;
  const paragraphs = text.trim() ? text.split(/\n+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(words / 200);

  // Keyword density
  const wordFreq: Record<string, number> = Object.create(null);
  if (text.trim()) {
    text.toLowerCase().match(/\b[a-z0-9]+\b/g)?.forEach((w) => {
      if (w.length > 2) wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
  }
  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Textarea
        label="Input Text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Paste article, draft, or essay..."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
        <div className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--accent)]">{words}</span>
          <span className="text-xs text-[var(--ink-soft)]">Words</span>
        </div>
        <div className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--ink)]">{chars}</span>
          <span className="text-xs text-[var(--ink-soft)]">Characters</span>
        </div>
        <div className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--ink)]">{charsNoSpaces}</span>
          <span className="text-xs text-[var(--ink-soft)]">Chars (no spaces)</span>
        </div>
        <div className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--ink)]">{sentences}</span>
          <span className="text-xs text-[var(--ink-soft)]">Sentences</span>
        </div>
        <div className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--ink)]">{paragraphs}</span>
          <span className="text-xs text-[var(--ink-soft)]">Paragraphs</span>
        </div>
        <div className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--focus)]">~{readingTime}m</span>
          <span className="text-xs text-[var(--ink-soft)]">Read Time</span>
        </div>
      </div>

      {topKeywords.length > 0 && (
        <div className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)] mb-2">Top Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map(([word, count]) => (
              <span key={word} className="px-2.5 py-1 text-xs font-mono rounded-full bg-[var(--surface-sunk)] border border-[var(--line)]">
                {word}: {count} ({((count / words) * 100).toFixed(1)}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Character Counter
export const CharacterCounterTool: React.FC = () => {
  const [text, setText] = useState("");

  const length = text.length;
  const tweets = Math.ceil(length / 280) || 1;

  return (
    <div className="space-y-6">
      <Textarea
        label="Input Text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Type or paste your post..."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)] text-center">
          <span className="block font-mono text-3xl font-bold text-[var(--accent)]">{length}</span>
          <span className="text-xs text-[var(--ink-soft)]">Total Characters</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)] text-center">
          <span className="block font-mono text-3xl font-bold text-[var(--ink)]">{text.replace(/\s/g, "").length}</span>
          <span className="text-xs text-[var(--ink-soft)] font-medium">Without Spaces</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)] text-center">
          <span className="block font-mono text-3xl font-bold text-[var(--focus)]">{tweets}</span>
          <span className="text-xs text-[var(--ink-soft)]">Tweets (280 limit)</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)] text-center">
          <span className="block font-mono text-3xl font-bold text-[var(--success)]">{new Blob([text]).size}</span>
          <span className="text-xs text-[var(--ink-soft)]">Byte Size</span>
        </div>
      </div>
    </div>
  );
};

// 4. Sentence Counter
export const SentenceCounterTool: React.FC = () => {
  const [text, setText] = useState("");

  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0) : [];
  const count = sentences.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const avgWordsPerSentence = count > 0 ? (words / count).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <Textarea
        label="Input Text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Paste sentences..."
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)] text-center">
          <span className="block font-mono text-3xl font-bold text-[var(--accent)]">{count}</span>
          <span className="text-xs text-[var(--ink-soft)]">Total Sentences</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)] text-center">
          <span className="block font-mono text-3xl font-bold text-[var(--ink)]">{avgWordsPerSentence}</span>
          <span className="text-xs text-[var(--ink-soft)]">Avg Words / Sentence</span>
        </div>
      </div>
    </div>
  );
};

// 5. Remove Duplicate Lines
export const RemoveDuplicateLinesTool: React.FC = () => {
  const [input, setInput] = useState("apple\nbanana\napple\norange\nBANANA");
  const [ignoreCase, setIgnoreCase] = useState(true);

  const lines = input.split(/\r?\n/);
  const seen = new Set<string>();
  const uniqueLines = lines.filter((line) => {
    const key = ignoreCase ? line.toLowerCase().trim() : line.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const output = uniqueLines.join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Toggle
          label="Case Insensitive Deduplication"
          checked={ignoreCase}
          onChange={setIgnoreCase}
        />
        <span className="text-xs font-mono text-[var(--ink-faint)]">
          Removed: {lines.length - uniqueLines.length} duplicates
        </span>
      </div>

      <Textarea
        label="Input Lines"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
      />

      <ResultPanel title="Unique Lines Output" status="live" copyValue={output} onClear={() => setInput("")}>
        <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
      </ResultPanel>
    </div>
  );
};

// 6. Text Sorter
export const TextSorterTool: React.FC = () => {
  const [input, setInput] = useState("Banana\nApple\nCherry\nDate");
  const [sortType, setSortType] = useState("az");

  const sortLines = () => {
    const lines = input.split(/\r?\n/);
    if (sortType === "az") lines.sort((a, b) => a.localeCompare(b));
    else if (sortType === "za") lines.sort((a, b) => b.localeCompare(a));
    else if (sortType === "len") lines.sort((a, b) => a.length - b.length);
    else if (sortType === "num") lines.sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
    return lines.join("\n");
  };

  const output = sortLines();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          label="Sort Method"
          value={sortType}
          onChange={(e) => {
            setSortType(e.target.value);
            if (e.target.value === "shuffle") {
              const lines = input.split(/\r?\n/);
              for (let i = lines.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [lines[i], lines[j]] = [lines[j], lines[i]]; }
              setInput(lines.join("\n"));
            }
          }}
          options={[
            { value: "az", label: "Alphabetical (A → Z)" },
            { value: "za", label: "Reverse Alphabetical (Z → A)" },
            { value: "len", label: "Line Length (Short → Long)" },
            { value: "num", label: "Numeric Sort" },
            { value: "shuffle", label: "Random Shuffle" },
          ]}
        />
      </div>

      <Textarea label="Raw Lines" value={input} onChange={(e) => setInput(e.target.value)} rows={6} />

      <ResultPanel title="Sorted Result" status="live" copyValue={output} onClear={() => setInput("")}>
        <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
      </ResultPanel>
    </div>
  );
};

// 7. Text Cleaner
export const TextCleanerTool: React.FC = () => {
  const [input, setInput] = useState("<h1>Hello World!</h1>   <p>Extra   spaces   here.</p>");
  const [stripHtml, setStripHtml] = useState(true);
  const [collapseSpaces, setCollapseSpaces] = useState(true);

  let output = input;
  if (stripHtml) output = output.replace(/<[^>]*>?/gm, "");
  if (collapseSpaces) output = output.replace(/[ \t]+/g, " ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <Toggle label="Strip HTML Tags" checked={stripHtml} onChange={setStripHtml} />
        <Toggle label="Collapse Spaces" checked={collapseSpaces} onChange={setCollapseSpaces} />
      </div>

      <Textarea label="Raw Input" value={input} onChange={(e) => setInput(e.target.value)} rows={5} />

      <ResultPanel title="Cleaned Text" status="live" copyValue={output} onClear={() => setInput("")}>
        <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
      </ResultPanel>
    </div>
  );
};

// 8. Lorem Ipsum Generator
export const LoremIpsumGeneratorTool: React.FC = () => {
  const [paragraphs, setParagraphs] = useState(3);
  const [lorem, setLorem] = useState("");

  const sample = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

  const generate = () => {
    if (!Number.isInteger(paragraphs) || paragraphs < 1 || paragraphs > 20) { setLorem(""); return; }
    const res = Array.from({ length: paragraphs }, () => sample).join("\n\n");
    setLorem(res);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 max-w-xs">
        <Input
          label="Paragraphs"
          type="number"
          min={1}
          max={20}
          value={paragraphs}
          onChange={(e) => setParagraphs(Number(e.target.value))}
        />
        <Button variant="primary" className="mt-5" disabled={!Number.isInteger(paragraphs) || paragraphs < 1 || paragraphs > 20} onClick={generate}>Generate</Button>
      </div>

      <ResultPanel title="Generated Placeholder Text" status="live" copyValue={lorem || sample}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{lorem || sample}</p>
      </ResultPanel>
    </div>
  );
};

// 9. Random Text Generator
export const RandomTextGeneratorTool: React.FC = () => {
  const [length, setLength] = useState(16);
  const [charset, setCharset] = useState("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
  const [output, setOutput] = useState("");
  const validRandomInput = Number.isInteger(length) && length >= 1 && length <= 10000 && charset.length > 0 && charset.length <= 1000;

  const generate = () => {
    if (!validRandomInput) { setOutput(""); return; }
    let res = "";
    for (let i = 0; i < length; i++) {
      res += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setOutput(res);
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Length" type="number" value={length} onChange={(e) => setLength(Number(e.target.value))} />
        <Input label="Characters Allowed" value={charset} onChange={(e) => setCharset(e.target.value)} />
      </div>

      <Button variant="primary" disabled={!validRandomInput} onClick={generate}>Generate String</Button>
      {!validRandomInput && <p role="alert">Use an integer length from 1 to 10,000 and a nonempty character set up to 1,000 characters.</p>}

      {output && (
        <ResultPanel title="Random Output" status="done" copyValue={output}>
          <pre className="font-mono text-base break-all">{output}</pre>
        </ResultPanel>
      )}
    </div>
  );
};

// 10. Remove Extra Spaces
export const RemoveExtraSpacesTool: React.FC = () => {
  const [input, setInput] = useState("  This   has    too    many     spaces.  ");

  const output = input.replace(/[ \t]+/g, " ").replace(/^\s+|\s+$/gm, "");

  return (
    <div className="space-y-6">
      <Textarea label="Unformatted Input" value={input} onChange={(e) => setInput(e.target.value)} rows={5} />

      <ResultPanel title="Normalized Spaces Output" status="live" copyValue={output} onClear={() => setInput("")}>
        <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
      </ResultPanel>
    </div>
  );
};

// 11. Reverse Text
export const ReverseTextTool: React.FC = () => {
  const [input, setInput] = useState("Antigravity Toolbox");
  const [mode, setMode] = useState("full");

  const reverse = () => {
    const reverseCharacters = (text: string) => Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (part) => part.segment).reverse().join("");
    if (mode === "full") return reverseCharacters(input);
    if (mode === "words") return input.split(" ").reverse().join(" ");
    if (mode === "eachWord") return input.split(" ").map(reverseCharacters).join(" ");
    return input;
  };

  const output = reverse();

  return (
    <div className="space-y-6">
      <Select
        label="Reverse Mode"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        options={[
          { value: "full", label: "Reverse Entire String (cba)" },
          { value: "words", label: "Reverse Word Order (world hello)" },
          { value: "eachWord", label: "Reverse Characters in Each Word (olleh)" },
        ]}
      />

      <Textarea label="Input Text" value={input} onChange={(e) => setInput(e.target.value)} rows={4} />

      <ResultPanel title="Reversed Output" status="live" copyValue={output} onClear={() => setInput("")}>
        <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
      </ResultPanel>
    </div>
  );
};
