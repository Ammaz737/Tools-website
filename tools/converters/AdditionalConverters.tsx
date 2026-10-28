"use client";

import { useState } from "react";
import { Input, ResultPanel, Select } from "@/components/ui";
function UnitConverter({ units, initial }: { units: Record<string, number>; initial: string }) {
  const keys = Object.keys(units); const [value, setValue] = useState(initial); const [from, setFrom] = useState(keys[0]); const [to, setTo] = useState(keys[1]);
  const converted = Number(value) * (units[from] / units[to]);
  const valid = value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number.isFinite(converted);
  const options = keys.map((key) => ({ value: key, label: key }));
  return <div className="space-y-6"><Input label="Value" type="number" min="0" step="any" value={value} onChange={(e) => setValue(e.target.value)} /><Select label="From unit" value={from} options={options} onChange={(e) => setFrom(e.target.value)} /><Select label="To unit" value={to} options={options} onChange={(e) => setTo(e.target.value)} />{valid ? <ResultPanel title="Converted value" status="live"><output data-testid="Converted value">{Number(converted.toPrecision(12)).toString()} {to}</output></ResultPanel> : <p role="alert">Enter a finite, non-negative value within the supported range.</p>}</div>;
}
export const AreaConverterTool = () => <UnitConverter initial="1" units={{ "Square meters": 1, "Square feet": 0.09290304, "Square kilometers": 1000000, Hectares: 10000, Acres: 4046.8564224, "Square inches": 0.00064516, "Square miles": 2589988.110336 }} />;
export const DataStorageConverterTool = () => <div className="space-y-4"><p>Decimal units use powers of 1000; binary units (KiB, MiB, GiB, TiB) use powers of 1024. Eight bits equal one byte.</p><UnitConverter initial="1024" units={{ Bytes: 1, Bits: 0.125, KB: 1000, MB: 1000000, GB: 1000000000, TB: 1000000000000, KiB: 1024, MiB: 1048576, GiB: 1073741824, TiB: 1099511627776 }} /></div>;
const zones = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Karachi", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"];
export const TimeZoneConverterTool = () => {
  const [instant, setInstant] = useState("2026-01-01T12:00:00Z"); const [zone, setZone] = useState("America/New_York");
  // Require a UTC instant so DST folds/gaps in local time never need guessing.
  const date = new Date(instant);
  const valid = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(instant) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 19) === instant.slice(0, 19);
  const formatted = valid ? new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZoneName: "longOffset" }).format(date) : "";
  return <div className="space-y-6"><Input label="UTC instant (ISO 8601)" value={instant} onChange={(e) => setInstant(e.target.value)} helperText="Example: 2026-01-01T12:00:00Z. Include seconds and the Z UTC suffix." /><Select label="Destination time zone" value={zone} options={zones.map((value) => ({ value, label: value }))} onChange={(e) => setZone(e.target.value)} /><p>Converts an explicit UTC instant. Destination daylight saving rules apply automatically.</p>{valid ? <ResultPanel title="Local time" status="live"><output data-testid="Local time">{formatted}</output></ResultPanel> : <p role="alert">Enter a valid UTC timestamp ending in Z, including seconds.</p>}</div>;
};

export const converterToolComponents = {
  "area-converter": AreaConverterTool,
  "data-storage-converter": DataStorageConverterTool,
  "time-zone-converter": TimeZoneConverterTool,
};
