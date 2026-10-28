"use client";

import React, { useState } from "react";
import { Input, ResultPanel, Select } from "@/components/ui";

const finiteInput = (value: string) => value.trim() !== "" && Number.isFinite(Number(value));

// 1. Age Calculator
export const AgeCalculatorTool: React.FC = () => {
  const [birthDate, setBirthDate] = useState("2000-01-01");

  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const calculateAge = () => {
    const parse = (value: string) => { const date = new Date(`${value}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null; };
    const dob = parse(birthDate); const today = parse(asOfDate);
    if (!dob || !today || dob > today) return null;
    const anchor = (months: number) => {
      const date = new Date(dob); date.setUTCDate(1); date.setUTCMonth(dob.getUTCMonth() + months);
      const end = new Date(date); end.setUTCMonth(end.getUTCMonth() + 1); end.setUTCDate(0);
      date.setUTCDate(Math.min(dob.getUTCDate(), end.getUTCDate())); return date;
    };
    let elapsedMonths = (today.getUTCFullYear() - dob.getUTCFullYear()) * 12 + today.getUTCMonth() - dob.getUTCMonth();
    if (anchor(elapsedMonths) > today) elapsedMonths--;
    return { years: Math.floor(elapsedMonths / 12), months: elapsedMonths % 12, days: Math.round((today.getTime() - anchor(elapsedMonths).getTime()) / 86400000), totalDays: Math.round((today.getTime() - dob.getTime()) / 86400000) };
  };

  const age = calculateAge();

  return (
    <div className="space-y-6">
      <Input label="Date of Birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />

      <Input label="As of date" type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
      <p>Calendar age uses UTC dates. Month anniversaries clamp to the last day of shorter months; this is not a legal age determination.</p>
      {!age && <p role="alert">Enter valid dates with birth on or before the as-of date.</p>}
      {age && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
            <span className="block font-mono text-3xl font-bold text-[var(--accent)]" data-testid="age-years">{age.years}</span>
            <span className="text-xs text-[var(--ink-soft)]">Years</span>
          </div>
          <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
            <span className="block font-mono text-3xl font-bold text-[var(--ink)]" data-testid="age-months">{age.months}</span>
            <span className="text-xs text-[var(--ink-soft)]">Months</span>
          </div>
          <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
            <span className="block font-mono text-3xl font-bold text-[var(--ink)]" data-testid="age-days">{age.days}</span>
            <span className="text-xs text-[var(--ink-soft)]">Days</span>
          </div>
          <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
            <span className="block font-mono text-3xl font-bold text-[var(--focus)]" data-testid="age-totalDays">{age.totalDays}</span>
            <span className="text-xs text-[var(--ink-soft)]">Total Days</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. BMI Calculator
export const BmiCalculatorTool: React.FC = () => {
  const [weightKg, setWeightKg] = useState("70");
  const [heightCm, setHeightCm] = useState("175");

  const heightM = Number(heightCm) / 100;
  const rawBmi = Number(weightKg) / (heightM * heightM);
  const valid = finiteInput(weightKg) && finiteInput(heightCm) && Number(weightKg) > 0 && Number(heightCm) > 0 && Number.isFinite(rawBmi);
  const bmi = rawBmi.toFixed(1);
  const numBmi = rawBmi;

  let category = "Normal weight";
  let color = "text-[var(--success)]";
  if (numBmi < 18.5) {
    category = "Underweight";
    color = "text-[var(--warn)]";
  } else if (numBmi >= 25 && numBmi < 30) {
    category = "Overweight";
    color = "text-[var(--warn)]";
  } else if (numBmi >= 30) {
    category = "Obesity";
    color = "text-[var(--danger)]";
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Weight (kg)" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        <Input label="Height (cm)" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
      </div>

      {valid ? (
      <div className="p-6 rounded-[14px] bg-[var(--surface-sunk)] border border-[var(--line)] text-center space-y-2">
        <span className="block text-xs uppercase tracking-wider font-semibold text-[var(--ink-soft)]">Body Mass Index</span>
        <span className="block font-mono text-5xl font-bold text-[var(--ink)]" data-testid="bmi-result">{bmi}</span>
        <span className={`block font-semibold text-base ${color}`}>{category}</span>
      </div>
      ) : <p role="alert">Enter finite, positive weight and height.</p>}
      <p>BMI uses adult reference categories and does not measure body composition.</p>
    </div>
  );
};

// 3. Percentage Calculator
export const PercentageCalculatorTool: React.FC = () => {
  const [pct, setPct] = useState("15");
  const [ofVal, setOfVal] = useState("200");

  const result = (Number(pct) / 100) * Number(ofVal);
  const valid = finiteInput(pct) && finiteInput(ofVal) && Number.isFinite(result);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4 items-center">
        <Input label="What is (%)" type="number" value={pct} onChange={(e) => setPct(e.target.value)} />
        <Input label="Of Amount" type="number" value={ofVal} onChange={(e) => setOfVal(e.target.value)} />
      </div>

      {valid ? (
      <ResultPanel title="Calculated Percentage Result" status="live" copyValue={result.toString()}>
        <span className="font-mono text-4xl font-bold text-[var(--accent)]" data-testid="percentage-result">{result.toFixed(2)}</span>
      </ResultPanel>
      ) : <p role="alert">Enter finite percentage and amount values.</p>}
    </div>
  );
};

// 4. EMI Calculator
export const EmiCalculatorTool: React.FC = () => {
  const [principal, setPrincipal] = useState("500000");
  const [rate, setRate] = useState("8.5");
  const [years, setYears] = useState("5");

  const monthlyRate = Number(rate) / 1200;
  const totalMonths = Number(years) * 12;
  const emi = monthlyRate === 0 ? Number(principal) / totalMonths : Number(principal) * monthlyRate / -Math.expm1(-totalMonths * Math.log1p(monthlyRate));
  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - Number(principal);
  const valid = [principal, rate, years].every(finiteInput) && Number(principal) > 0 && Number(rate) >= 0 && Number(rate) <= 100 && totalMonths > 0 && totalMonths <= 1200 && Math.abs(totalMonths - Math.round(totalMonths)) < 1e-8 && [emi, totalPayment, totalInterest].every(Number.isFinite);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Input label="Loan Amount" type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        <Input label="Interest Rate (% per year)" type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
        <Input label="Tenure (Years)" type="number" value={years} onChange={(e) => setYears(e.target.value)} />
      </div>

      <p>Fixed-rate principal and interest estimate. Tenure must be 1–1200 whole months (expressed in years); excludes fees, taxes and insurance.</p>
      {valid ? (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--accent)]" data-testid="emi">${emi.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-xs text-[var(--ink-soft)]">Monthly EMI</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--ink)]" data-testid="totalInterest">${totalInterest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-xs text-[var(--ink-soft)]">Total Interest</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-2xl font-bold text-[var(--focus)]" data-testid="totalPayment">${totalPayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-xs text-[var(--ink-soft)]">Total Payment</span>
        </div>
      </div>
      ) : <p role="alert">Enter a positive loan amount, rate from 0 to 100, and a tenure of whole months up to 100 years.</p>}
    </div>
  );
};

// 5. GST / VAT Calculator
export const GstCalculatorTool: React.FC = () => {
  const [amount, setAmount] = useState("1000");
  const [taxRate, setTaxRate] = useState("18");
  const [mode, setMode] = useState("exclusive");

  const base = Number(amount); const percent = Number(taxRate);
  const tax = mode === "exclusive" ? base * percent / 100 : base - base / (1 + percent / 100);
  const total = mode === "exclusive" ? base + tax : base;
  const netAmount = mode === "exclusive" ? base : base - tax;
  const valid = finiteInput(amount) && finiteInput(taxRate) && base >= 0 && percent >= 0 && percent <= 100 && [tax, total, netAmount].every(Number.isFinite);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Input label="Amount ($)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input label="Tax Rate (%)" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        <Select
          label="Tax Mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          options={[
            { value: "exclusive", label: "Add Tax (Exclusive)" },
            { value: "inclusive", label: "Remove Tax (Inclusive)" },
          ]}
        />
      </div>

      {valid ? (
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-xl font-bold text-[var(--ink)]" data-testid="gst-netAmount">${netAmount.toFixed(2)}</span>
          <span className="text-xs text-[var(--ink-soft)]">Net Amount</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-xl font-bold text-[var(--accent)]" data-testid="gst-tax">${tax.toFixed(2)}</span>
          <span className="text-xs text-[var(--ink-soft)]">Tax Amount</span>
        </div>
        <div className="p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
          <span className="block font-mono text-xl font-bold text-[var(--success)]" data-testid="gst-total">${total.toFixed(2)}</span>
          <span className="text-xs text-[var(--ink-soft)]">Total Amount</span>
        </div>
      </div>
      ) : <p role="alert">Enter a non-negative amount and tax rate from 0 to 100.</p>}
    </div>
  );
};
