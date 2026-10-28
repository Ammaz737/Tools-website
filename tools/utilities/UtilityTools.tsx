"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import bwipjs from "bwip-js";
import { Input, Button, ResultPanel, Slider, Toggle, Textarea } from "@/components/ui";

// 1. QR Code Generator
export const QrCodeGeneratorTool: React.FC = () => {
  const [text, setText] = useState("https://antigravity.dev");
  const [qr, setQr] = useState({ input: "", url: "", error: "" });
  const qrUrl = qr.input === text ? qr.url : "";

  useEffect(() => {
    let active = true;
    if (text && text.length <= 1000) {
      QRCode.toDataURL(text, { width: 300, margin: 2 }, (err, url) => {
        if (active) setQr({ input: text, url: err ? "" : url || "", error: err ? "Text is too large to encode as a QR code." : "" });
      });
    }
    return () => { active = false; };
  }, [text]);

  return (
    <div className="space-y-6">
      <Input label="QR Code Text / URL" value={text} maxLength={1001} onChange={(e) => setText(e.target.value)} />
      {(text.length > 1000 || (qr.input === text && qr.error)) && <p role="alert">{text.length > 1000 ? "Use up to 1,000 characters." : qr.error}</p>}

      {qrUrl && (
        <div className="flex flex-col items-center gap-4 p-6 rounded-[14px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR Code" className="w-52 h-52 rounded-[10px] shadow-sm bg-white p-2" />
          <a
            href={qrUrl}
            download="qrcode.png"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[10px] bg-[var(--accent)] text-white hover:opacity-95"
          >
            Download PNG
          </a>
        </div>
      )}
    </div>
  );
};

// 2. Barcode Generator
export const BarcodeGeneratorTool: React.FC = () => {
  const [text, setText] = useState("123456789012");
  const barcode = useMemo(() => {
    if (!text) return { url: "", error: null };
    // Code 128 encodes byte characters, not Unicode code points such as emoji.
    if (Array.from(text).some((character) => character.codePointAt(0)! > 255)) {
      return { url: "", error: "Code 128 supports byte characters only. Remove unsupported Unicode characters." };
    }
    try {
      const svg = (bwipjs as typeof bwipjs & { toSVG: (options: bwipjs.RenderOptions) => string }).toSVG({ bcid: "code128", text, scale: 3, height: 10, includetext: true, textxalign: "center" });
      return { url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, error: null };
    } catch (err) {
      return { url: "", error: err instanceof Error ? err.message : "Unable to generate barcode" };
    }
  }, [text]);

  return (
    <div className="space-y-6">
      <Input label="Barcode Data" value={text} onChange={(e) => setText(e.target.value)} />

      <div className="flex flex-col items-center justify-center p-6 rounded-[14px] bg-[var(--surface-sunk)] border border-[var(--line)] min-h-[160px]">
        {barcode.error ? (
          <p role="alert" className="text-xs text-[var(--danger)] font-mono">{barcode.error}</p>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={barcode.url || undefined} alt="Generated barcode" className="max-w-full bg-white p-4 rounded-[10px]" />
        )}
      </div>
      {!barcode.error && barcode.url && <a href={barcode.url} download="barcode.svg" className="inline-flex rounded-[10px] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">Download SVG</a>}
    </div>
  );
};

function createPassword(length: number, upper: boolean, lower: boolean, numbers: boolean, symbols: boolean) {
  let chars = "";
  if (upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (numbers) chars += "0123456789";
  if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) return "";
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (value) => chars[value % chars.length]).join("");
}

const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

// 3. Password Generator
export const PasswordGeneratorTool: React.FC = () => {
  const ready = useSyncExternalStore(subscribeHydration, clientReady, serverReady);
  return ready ? <PasswordGenerator /> : <p>Preparing secure password generator…</p>;
};

const PasswordGenerator: React.FC = () => {
  const [length, setLength] = useState<number>(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState(() => createPassword(16, true, true, true, true));

  const generatePassword = () => setPassword(createPassword(length, useUpper, useLower, useNumbers, useSymbols));

  return (
    <div className="space-y-6">
      <Slider label="Password Length" min={8} max={64} value={length} onChange={(value) => { setLength(value); setPassword(createPassword(value, useUpper, useLower, useNumbers, useSymbols)); }} />

      <div className="grid grid-cols-2 gap-4">
        <Toggle label="Uppercase (A-Z)" checked={useUpper} onChange={(value) => { setUseUpper(value); setPassword(createPassword(length, value, useLower, useNumbers, useSymbols)); }} />
        <Toggle label="Lowercase (a-z)" checked={useLower} onChange={(value) => { setUseLower(value); setPassword(createPassword(length, useUpper, value, useNumbers, useSymbols)); }} />
        <Toggle label="Numbers (0-9)" checked={useNumbers} onChange={(value) => { setUseNumbers(value); setPassword(createPassword(length, useUpper, useLower, value, useSymbols)); }} />
        <Toggle label="Symbols (!@#$)" checked={useSymbols} onChange={(value) => { setUseSymbols(value); setPassword(createPassword(length, useUpper, useLower, useNumbers, value)); }} />
      </div>

      <ResultPanel title="Generated Secure Password" status="live" copyValue={password} onReset={generatePassword}>
        <span className="font-mono text-2xl font-bold tracking-wider text-[var(--accent)] break-all">{password}</span>
      </ResultPanel>
    </div>
  );
};

// 4. Color Picker / Converter
export const ColorPickerTool: React.FC = () => {
  const [color, setColor] = useState("#E4572E");

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
      : "";
  };

  const rgb = hexToRgb(color);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input
          type="color"
          aria-label="Choose color"
          value={rgb ? (color.startsWith("#") ? color : `#${color}`) : "#000000"}
          onChange={(e) => setColor(e.target.value)}
          className="w-16 h-16 rounded-[10px] border border-[var(--line-strong)] cursor-pointer"
        />
        <Input label="HEX Value" value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" />
      </div>

      {!rgb && <p role="alert">Enter a six-digit hexadecimal color, such as #12ABEF.</p>}
      {rgb && <><div className="p-8 rounded-[14px] border border-[var(--line)] shadow-xs text-white text-center font-mono font-bold text-xl" style={{ backgroundColor: color.startsWith("#") ? color : `#${color}` }}>
        {color.toUpperCase()}
      </div></>}

      <div className="grid grid-cols-2 gap-4">
        <ResultPanel title="HEX" status="live" copyValue={color.toUpperCase()}>
          <span className="font-mono text-lg font-bold">{color.toUpperCase()}</span>
        </ResultPanel>
        <ResultPanel title="RGB" status="live" copyValue={rgb}>
          <span className="font-mono text-lg font-bold">{rgb}</span>
        </ResultPanel>
      </div>
    </div>
  );
};

// 5. Coin Flipper
export const CoinFlipperTool: React.FC = () => {
  const [result, setResult] = useState<"HEADS" | "TAILS" | null>(null);
  const [flipping, setFlipping] = useState(false);

  const flip = () => {
    setFlipping(true);
    setTimeout(() => {
      setResult(Math.random() < 0.5 ? "HEADS" : "TAILS");
      setFlipping(false);
    }, 600);
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center justify-center p-8 rounded-[14px] bg-[var(--surface-sunk)] border border-[var(--line)] min-h-[180px]">
        <div
          className={`w-28 h-28 rounded-full border-4 border-[var(--accent)] bg-[var(--accent-soft)] flex items-center justify-center font-mono text-xl font-bold text-[var(--accent)] shadow-md transition-transform duration-500 ${
            flipping ? "rotate-[720deg] scale-90" : ""
          }`}
        >
          {result || "COIN"}
        </div>
      </div>

      <Button variant="primary" size="lg" onClick={flip} loading={flipping}>
        Flip Coin
      </Button>
    </div>
  );
};

function readNotepad() { return localStorage.getItem("toolbox_notepad") || ""; }
function subscribeNotepad(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("toolbox-notepad-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("toolbox-notepad-change", listener);
  };
}

// 6. Online Notepad
export const NotepadOnlineTool: React.FC = () => {
  const content = useSyncExternalStore(subscribeNotepad, readNotepad, () => "");
  const handleChange = (val: string) => {
    localStorage.setItem("toolbox_notepad", val);
    window.dispatchEvent(new Event("toolbox-notepad-change"));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-[var(--ink-soft)]">
        <span>Auto-saved to local browser storage</span>
        <span className="font-mono">{content.length} characters</span>
      </div>

      <Textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        rows={12}
        placeholder="Start typing your notes here..."
      />
    </div>
  );
};
