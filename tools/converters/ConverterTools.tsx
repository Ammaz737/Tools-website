"use client";

import React, { useState } from "react";
import { Input, Select, ResultPanel } from "@/components/ui";

const finiteInput = (value: string) => value.trim() !== "" && Number.isFinite(Number(value));

// 1. Length Converter
export const LengthConverterTool: React.FC = () => {
  const [val, setVal] = useState("1");
  const [fromUnit, setFromUnit] = useState("m");

  const toMeters: Record<string, number> = {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    mi: 1609.344,
    yd: 0.9144,
    ft: 0.3048,
    in: 0.0254,
  };

  const meters = Number(val) * (toMeters[fromUnit] || 1);

  const units = [
    { label: "Meters (m)", id: "m" },
    { label: "Kilometers (km)", id: "km" },
    { label: "Centimeters (cm)", id: "cm" },
    { label: "Millimeters (mm)", id: "mm" },
    { label: "Miles (mi)", id: "mi" },
    { label: "Yards (yd)", id: "yd" },
    { label: "Feet (ft)", id: "ft" },
    { label: "Inches (in)", id: "in" },
  ];

  const valid = finiteInput(val) && Number(val) >= 0 && units.every((u) => Number.isFinite(meters / toMeters[u.id]));
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Value" type="number" value={val} onChange={(e) => setVal(e.target.value)} />
        <Select
          label="From Unit"
          value={fromUnit}
          onChange={(e) => setFromUnit(e.target.value)}
          options={units.map((u) => ({ value: u.id, label: u.label }))}
        />
      </div>

      {valid ? (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {units.map((u) => {
          const converted = (meters / toMeters[u.id]).toFixed(4);
          return (
            <div key={u.id} className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
              <span className="block font-mono text-lg font-bold text-[var(--ink)]" data-testid={`unit-${u.id}`}>{converted}</span>
              <span className="text-xs text-[var(--ink-soft)]">{u.label}</span>
            </div>
          );
        })}
      </div>
      ) : <p role="alert">Enter a finite, non-negative value within the supported range.</p>}
    </div>
  );
};

// 2. Weight Converter
export const WeightConverterTool: React.FC = () => {
  const [val, setVal] = useState("1");
  const [fromUnit, setFromUnit] = useState("kg");

  const toKg: Record<string, number> = {
    kg: 1,
    g: 0.001,
    mg: 0.000001,
    lb: 0.45359237,
    oz: 0.028349523125,
  };

  const kg = Number(val) * (toKg[fromUnit] || 1);

  const units = [
    { label: "Kilograms (kg)", id: "kg" },
    { label: "Grams (g)", id: "g" },
    { label: "Milligrams (mg)", id: "mg" },
    { label: "Pounds (lb)", id: "lb" },
    { label: "Ounces (oz)", id: "oz" },
  ];

  const valid = finiteInput(val) && Number(val) >= 0 && units.every((u) => Number.isFinite(kg / toKg[u.id]));
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Value" type="number" value={val} onChange={(e) => setVal(e.target.value)} />
        <Select
          label="From Unit"
          value={fromUnit}
          onChange={(e) => setFromUnit(e.target.value)}
          options={units.map((u) => ({ value: u.id, label: u.label }))}
        />
      </div>

      {valid ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {units.map((u) => {
          const converted = (kg / toKg[u.id]).toFixed(4);
          return (
            <div key={u.id} className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
              <span className="block font-mono text-lg font-bold text-[var(--ink)]" data-testid={`unit-${u.id}`}>{converted}</span>
              <span className="text-xs text-[var(--ink-soft)]">{u.label}</span>
            </div>
          );
        })}
      </div>
      ) : <p role="alert">Enter a finite, non-negative value within the supported range.</p>}
    </div>
  );
};

// 3. Temperature Converter
export const TemperatureConverterTool: React.FC = () => {
  const [val, setVal] = useState("25");

  const celsius = Number(val);
  const fahrenheit = (celsius * 9) / 5 + 32;
  const kelvin = celsius + 273.15;

  const valid = finiteInput(val) && celsius >= -273.15 && [celsius, fahrenheit, kelvin].every(Number.isFinite);
  return (
    <div className="space-y-6">
      <Input label="Temperature in Celsius (°C)" type="number" value={val} onChange={(e) => setVal(e.target.value)} />

      {valid ? (
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--accent)]">{celsius.toFixed(1)}°C</span>
          <span className="text-xs text-[var(--ink-soft)]">Celsius</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--ink)]" data-testid="fahrenheit">{fahrenheit.toFixed(1)}°F</span>
          <span className="text-xs text-[var(--ink-soft)]">Fahrenheit</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--focus)]" data-testid="kelvin">{kelvin.toFixed(2)}K</span>
          <span className="text-xs text-[var(--ink-soft)]">Kelvin</span>
        </div>
      </div>
      ) : <p role="alert">Enter a finite temperature at or above absolute zero (-273.15°C).</p>}
    </div>
  );
};

// 4. Binary Converter
export const BinaryConverterTool: React.FC = () => {
  const [text, setText] = useState("Hello");

  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, (byte) => byte.toString(2).padStart(8, "0")).join(" ");
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(" ");

  return (
    <div className="space-y-6">
      <Input label="Input Text" value={text} onChange={(e) => setText(e.target.value)} />

      <p>Text is encoded as UTF-8 bytes; each binary group is exactly eight bits.</p>
      <ResultPanel title="Binary (Base 2)" status="live" copyValue={binary}>
        <pre className="font-mono text-xs break-all whitespace-pre-wrap">{binary}</pre>
      </ResultPanel>

      <ResultPanel title="Hexadecimal (Base 16)" status="live" copyValue={hex}>
        <pre className="font-mono text-xs break-all whitespace-pre-wrap">{hex}</pre>
      </ResultPanel>
    </div>
  );
};

// 5. Roman Numeral Converter
export const RomanNumeralConverterTool: React.FC = () => {
  const [num, setNum] = useState("2026");

  const toRoman = (n: number) => {
    if (n < 1 || n > 3999) return "Enter number between 1 and 3999";
    const lookup: Record<string, number> = {
      M: 1000,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1,
    };
    let roman = "";
    for (const i in lookup) {
      while (n >= lookup[i]) {
        roman += i;
        n -= lookup[i];
      }
    }
    return roman;
  };

  const valid = finiteInput(num) && Number.isInteger(Number(num)) && Number(num) >= 1 && Number(num) <= 3999;
  const roman = valid ? toRoman(Number(num)) : "";

  return (
    <div className="space-y-6">
      <Input label="Integer (1 - 3999)" type="number" min={1} max={3999} value={num} onChange={(e) => setNum(e.target.value)} />

      {valid ? (
      <ResultPanel title="Roman Numeral Output" status="live" copyValue={roman}>
        <span className="font-mono text-4xl font-bold tracking-widest text-[var(--accent)]">{roman}</span>
      </ResultPanel>
      ) : <p role="alert">Enter a whole number from 1 to 3999.</p>}
    </div>
  );
};
