"use client";

import { useState } from "react";
import { Input, ResultPanel, Select } from "@/components/ui";

type Field = { label: string; initial: string; min?: number; max?: number; integer?: boolean };
type Calculation = { fields: Field[]; calculate: (values: number[]) => Record<string, number>; note?: string };
const money = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function Calculator({ fields, calculate, note }: Calculation) {
  const [values, setValues] = useState(() => fields.map((field) => field.initial));
  let result: Record<string, number> | null = null;
  let error = "";
  const numbers = values.map(Number);
  const invalid = fields.findIndex((field, i) => !values[i].trim() || !Number.isFinite(numbers[i]) || (field.min !== undefined && numbers[i] < field.min) || (field.max !== undefined && numbers[i] > field.max) || (field.integer && !Number.isSafeInteger(numbers[i])));
  if (invalid >= 0) error = `Enter a valid ${fields[invalid].label.toLowerCase()}${fields[invalid].min !== undefined ? ` (minimum ${fields[invalid].min})` : ""}${fields[invalid].max !== undefined ? ` (maximum ${fields[invalid].max})` : ""}.`;
  else {
    result = calculate(numbers);
    if (Object.values(result).some((value) => !Number.isFinite(value))) { error = "These values exceed the supported calculation range."; result = null; }
  }
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2">{fields.map((field, i) => <Input key={field.label} label={field.label} type="number" step={field.integer ? "1" : "any"} min={field.min} max={field.max} value={values[i]} onChange={(event) => setValues(values.map((value, index) => index === i ? event.target.value : value))} />)}</div>
    {note && <p className="text-sm text-[var(--ink-soft)]">{note}</p>}
    {error ? <p role="alert">{error}</p> : result && <ResultPanel title="Calculation result" status="live"><dl className="space-y-3">{Object.entries(result).map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt>{label}</dt><dd className="font-mono" data-testid={label}>{money(value)}</dd></div>)}</dl></ResultPanel>}
  </div>;
}
export const DiscountCalculatorTool = () => <Calculator fields={[{ label: "Original price", initial: "100", min: 0 }, { label: "Discount percent", initial: "20", min: 0, max: 100 }]} calculate={([price, discount]) => ({ "Discount amount": price * discount / 100, "Final price": price * (1 - discount / 100) })} />;
export const ProfitCalculatorTool = () => <Calculator fields={[{ label: "Revenue", initial: "1000", min: 0 }, { label: "Total costs", initial: "600", min: 0 }]} calculate={([revenue, costs]) => ({ "Net profit": revenue - costs, ...(revenue > 0 ? { "Profit margin percent": (revenue - costs) / revenue * 100 } : {}), ...(costs > 0 ? { "Markup percent": (revenue - costs) / costs * 100 } : {}) })} note="Net profit is revenue minus all costs. Negative results represent a loss." />;
export const RoiCalculatorTool = () => <Calculator fields={[{ label: "Initial investment", initial: "1000", min: 0.01 }, { label: "Final value", initial: "1200", min: 0 }, { label: "Additional income", initial: "0", min: 0 }]} calculate={([initial, final, income]) => ({ "Net return": final + income - initial, "ROI percent": (final + income - initial) / initial * 100 })} note="Simple return; excludes taxes, fees, inflation and annualization." />;
export const TipCalculatorTool = () => <Calculator fields={[{ label: "Bill amount", initial: "100", min: 0 }, { label: "Tip percent", initial: "15", min: 0, max: 1000 }, { label: "People", initial: "2", min: 1, max: 1000000, integer: true }]} calculate={([bill, tip, people]) => ({ "Tip amount": bill * tip / 100, "Total bill": bill * (1 + tip / 100), "Per person": bill * (1 + tip / 100) / people })} />;
export const MarginCalculatorTool = () => {
  const [mode, setMode] = useState("margin");
  return <div className="space-y-6"><Select label="Pricing calculation" value={mode} options={[{ value: "margin", label: "Calculate margin from selling price" }, { value: "price", label: "Calculate selling price from target margin" }]} onChange={(e) => setMode(e.target.value)} />{mode === "margin" ? <Calculator key="margin" fields={[{ label: "Cost", initial: "60", min: 0 }, { label: "Selling price", initial: "100", min: 0.01 }]} calculate={([cost, price]) => ({ "Gross profit": price - cost, "Gross margin percent": (price - cost) / price * 100, ...(cost > 0 ? { "Markup percent": (price - cost) / cost * 100 } : {}) })} note="Gross margin divides profit by selling price; markup divides profit by cost. Markup is undefined for zero cost." /> : <Calculator key="price" fields={[{ label: "Cost", initial: "60", min: 0 }, { label: "Target margin percent", initial: "40", min: 0, max: 99.99 }]} calculate={([cost, margin]) => ({ "Required selling price": cost / (1 - margin / 100) })} />}</div>;
};
export const MortgageCalculatorTool = () => <Calculator fields={[{ label: "Loan principal", initial: "200000", min: 0.01 }, { label: "Annual interest percent", initial: "6", min: 0, max: 100 }, { label: "Loan term years", initial: "30", min: 1, max: 100, integer: true }]} calculate={([principal, annual, years]) => {
  const months = years * 12; const rate = annual / 1200;
  const payment = rate === 0 ? principal / months : principal * rate / -Math.expm1(-months * Math.log1p(rate));
  return { "Monthly payment": payment, "Total payments": payment * months, "Total interest": payment * months - principal };
}} note="Fixed-rate estimate for principal and interest only. Excludes property tax, insurance, fees and early payments." />;

export const DateCalculatorTool = () => {
  const [start, setStart] = useState("2026-01-01"); const [end, setEnd] = useState("2026-01-31"); const [shift, setShift] = useState("7");
  const parse = (value: string) => { const date = new Date(`${value}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date.getTime() : NaN; };
  const days = (parse(end) - parse(start)) / 86400000;
  const shifted = parse(start) + Number(shift) * 86400000;
  const validShift = shift.trim() !== "" && Number.isSafeInteger(Number(shift)) && Number.isFinite(new Date(shifted).getTime());
  return <div className="space-y-6"><Input label="Start date" type="date" value={start} onChange={(e) => setStart(e.target.value)} /><Input label="End date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /><Input label="Days to add or subtract" type="number" step="1" value={shift} onChange={(e) => setShift(e.target.value)} />{validShift ? <p>Adjusted start date: <output data-testid="Adjusted date">{new Date(shifted).toISOString().slice(0, 10)}</output></p> : <p role="alert">Enter a whole number of days within the supported date range.</p>}<p>Elapsed calendar days, excluding the start date. Earlier end dates produce negative results.</p>{Number.isFinite(days) ? <ResultPanel title="Date difference" status="live"><output data-testid="Elapsed days">{days} days</output></ResultPanel> : <p role="alert">Enter valid start and end dates.</p>}</div>;
};

const operations = ["Add", "Subtract", "Multiply", "Divide", "Power", "Square root", "Natural logarithm", "Sine", "Cosine", "Tangent"];
export const ScientificCalculatorTool = () => {
  const [a, setA] = useState("10"); const [b, setB] = useState("2"); const [operation, setOperation] = useState("Add");
  const x = Number(a); const y = Number(b); const binary = operations.indexOf(operation) < 5;
  let result = NaN;
  if (a.trim() && Number.isFinite(x) && (!binary || (b.trim() && Number.isFinite(y)))) {
    switch (operation) { case "Add": result = x + y; break; case "Subtract": result = x - y; break; case "Multiply": result = x * y; break; case "Divide": result = x / y; break; case "Power": result = x ** y; break; case "Square root": result = Math.sqrt(x); break; case "Natural logarithm": result = Math.log(x); break; case "Sine": result = Math.sin(x); break; case "Cosine": result = Math.cos(x); break; case "Tangent": result = Math.abs(Math.cos(x)) < 1e-12 ? NaN : Math.tan(x); }
  }
  return <div className="space-y-6"><Select label="Operation" value={operation} options={operations.map((value) => ({ value, label: value }))} onChange={(e) => setOperation(e.target.value)} /><Input label="First operand" type="number" step="any" value={a} onChange={(e) => setA(e.target.value)} />{binary && <Input label="Second operand" type="number" step="any" value={b} onChange={(e) => setB(e.target.value)} />}<p>Trigonometric angles use radians.</p>{Number.isFinite(result) ? <ResultPanel title="Scientific result" status="live"><output data-testid="Scientific result">{Number(result.toPrecision(12)).toString()}</output></ResultPanel> : <p role="alert">Enter finite values within the operation domain. Division by zero and non-real results are undefined.</p>}</div>;
};

export const calculatorToolComponents = {
  "discount-calculator": DiscountCalculatorTool,
  "profit-calculator": ProfitCalculatorTool,
  "scientific-calculator": ScientificCalculatorTool,
  "date-calculator": DateCalculatorTool,
  "mortgage-calculator": MortgageCalculatorTool,
  "roi-calculator": RoiCalculatorTool,
  "tip-calculator": TipCalculatorTool,
  "margin-calculator": MarginCalculatorTool,
};
