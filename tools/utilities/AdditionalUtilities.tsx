"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button, Input, Select, ResultPanel } from "@/components/ui";

const ErrorMessage = ({ value }: { value: string }) => value ? <p role="alert" className="text-sm text-[var(--danger)]">{value}</p> : null;
function downloadText(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function randomInteger(min: number, max: number) {
  const range = max - min + 1;
  const limit = Math.floor(4294967296 / range) * range;
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= limit);
  return min + value[0] % range;
}
export function RandomNumberGeneratorTool() {
  const [min, setMin] = useState("1"); const [max, setMax] = useState("100"); const [count, setCount] = useState("1");
  const [output, setOutput] = useState(""); const [error, setError] = useState("");
  function generate() {
    setOutput(""); setError("");
    const low = Number(min), high = Number(max), total = Number(count);
    if (!min.trim() || !max.trim() || !count.trim() || !Number.isSafeInteger(low) || !Number.isSafeInteger(high) || low > high || high - low + 1 > 4294967296 || !Number.isInteger(total) || total < 1 || total > 1000) { setError("Use integer bounds with minimum <= maximum, a range at most 4,294,967,296, and a count from 1 to 1,000."); return; }
    setOutput(Array.from({ length: total }, () => randomInteger(low, high)).join("\n"));
  }
  return <div className="space-y-4"><Input label="Minimum" value={min} onChange={(e) => setMin(e.target.value)} /><Input label="Maximum" value={max} onChange={(e) => setMax(e.target.value)} /><Input label="Number count" value={count} onChange={(e) => setCount(e.target.value)} /><Button onClick={generate}>Generate numbers</Button><Button variant="secondary" onClick={() => { setMin("1"); setMax("100"); setCount("1"); setOutput(""); setError(""); }}>Reset</Button><ErrorMessage value={error} />{output && <ResultPanel title="Random numbers" copyValue={output} onDownload={() => downloadText(output, "random-numbers.txt")}><pre>{output}</pre></ResultPanel>}</div>;
}

export function TimestampConverterTool() {
  const [timestamp, setTimestamp] = useState("0"); const [unit, setUnit] = useState("seconds");
  const [date, setDate] = useState("1970-01-01T00:00:00Z"); const [output, setOutput] = useState(""); const [error, setError] = useState("");
  function convert(fromTimestamp: boolean) {
    setOutput(""); setError("");
    let milliseconds: number;
    if (fromTimestamp) {
      const value = Number(timestamp);
      milliseconds = value * (unit === "seconds" ? 1000 : 1);
      if (!timestamp.trim() || !Number.isSafeInteger(value) || !Number.isSafeInteger(milliseconds) || Math.abs(milliseconds) > 8640000000000000) { setError("Enter an integer timestamp within the supported date range."); return; }
    } else {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(date)) { setError("Use a UTC ISO date such as 2026-10-11T12:00:00Z."); return; }
      milliseconds = Date.parse(date);
      const canonical = date.includes(".") ? date : date.replace("Z", ".000Z");
      if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== canonical) { setError("Enter a valid calendar date and time."); return; }
    }
    const parsed = new Date(milliseconds);
    setOutput(`UTC: ${parsed.toISOString()}\nUnix seconds: ${Math.floor(milliseconds / 1000)}\nUnix milliseconds: ${milliseconds}`);
  }
  return <div className="space-y-4"><Input label="Unix timestamp" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /><Select label="Timestamp unit" value={unit} onChange={(e) => setUnit(e.target.value)} options={[{ value: "seconds", label: "Seconds" }, { value: "milliseconds", label: "Milliseconds" }]} /><Button onClick={() => convert(true)}>Convert timestamp</Button><Input label="UTC date and time" value={date} onChange={(e) => setDate(e.target.value)} helperText="ISO format with Z for UTC. Milliseconds are optional." /><Button onClick={() => convert(false)}>Convert date</Button><Button variant="secondary" onClick={() => { setTimestamp("0"); setDate("1970-01-01T00:00:00Z"); setUnit("seconds"); setOutput(""); setError(""); }}>Reset</Button><ErrorMessage value={error} />{output && <ResultPanel title="Converted timestamp" copyValue={output} onDownload={() => downloadText(output, "timestamp.txt")}><pre>{output}</pre></ResultPanel>}</div>;
}
export const UnixTimeConverterTool = TimestampConverterTool;

export function DiceRollerTool() {
  const [sides, setSides] = useState("6"); const [count, setCount] = useState("1"); const [rolls, setRolls] = useState<number[]>([]); const [error, setError] = useState("");
  function roll() { setRolls([]); setError(""); const faces = Number(sides), total = Number(count); if (!Number.isInteger(faces) || faces < 2 || faces > 1000 || !Number.isInteger(total) || total < 1 || total > 100) { setError("Use 2 to 1,000 sides and 1 to 100 dice."); return; } setRolls(Array.from({ length: total }, () => randomInteger(1, faces))); }
  return <div className="space-y-4"><Input label="Dice sides" type="number" value={sides} onChange={(e) => setSides(e.target.value)} /><Input label="Dice count" type="number" value={count} onChange={(e) => setCount(e.target.value)} /><Button onClick={roll}>Roll dice</Button><Button variant="secondary" onClick={() => { setSides("6"); setCount("1"); setRolls([]); setError(""); }}>Reset</Button><ErrorMessage value={error} />{!!rolls.length && <ResultPanel title="Dice result" copyValue={rolls.join(", ")}><p aria-label="Individual rolls">{rolls.join(", ")}</p><p>Total: {rolls.reduce((sum, value) => sum + value, 0)}</p></ResultPanel>}</div>;
}
function formatTime(milliseconds: number) { const total = Math.floor(Math.max(0, milliseconds) / 1000); return `${Math.floor(total / 3600).toString().padStart(2, "0")}:${Math.floor(total / 60 % 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`; }
export function StopwatchTool() {
  const [elapsed, setElapsed] = useState(0); const [running, setRunning] = useState(false); const [laps, setLaps] = useState<number[]>([]); const anchor = useRef(0); const stored = useRef(0);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setElapsed(stored.current + performance.now() - anchor.current), 50); return () => window.clearInterval(timer); }, [running]);
  function pause() { stored.current += performance.now() - anchor.current; setElapsed(stored.current); setRunning(false); }
  return <div className="space-y-4"><output aria-label="Stopwatch elapsed" className="block font-mono text-3xl">{formatTime(elapsed)}.{Math.floor(elapsed % 1000 / 10).toString().padStart(2, "0")}</output><Button disabled={running} onClick={() => { anchor.current = performance.now(); setRunning(true); }}>Start stopwatch</Button><Button disabled={!running} onClick={pause}>Pause stopwatch</Button><Button disabled={!running || laps.length >= 100} onClick={() => setLaps((values) => [...values, stored.current + performance.now() - anchor.current])}>Record lap</Button><Button variant="secondary" onClick={() => { setRunning(false); stored.current = 0; setElapsed(0); setLaps([]); }}>Reset stopwatch</Button>{!!laps.length && <ol aria-label="Stopwatch laps">{laps.map((lap, index) => <li key={index}>Lap {index + 1}: {formatTime(lap)}.{Math.floor(lap % 1000 / 10).toString().padStart(2, "0")}</li>)}</ol>}</div>;
}
export function TimerTool() {
  const [seconds, setSeconds] = useState("60"); const [remaining, setRemaining] = useState(0); const [running, setRunning] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState(""); const deadline = useRef(0);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => { const value = Math.max(0, deadline.current - Date.now()); setRemaining(value); if (!value) { setRunning(false); setDone(true); } }, 50); return () => window.clearInterval(timer); }, [running]);
  function start() { setError(""); const duration = remaining > 0 ? remaining : Number(seconds) * 1000; if (!seconds.trim() || !Number.isInteger(Number(seconds)) || Number(seconds) < 1 || Number(seconds) > 86400) { setError("Enter a whole duration from 1 to 86,400 seconds."); return; } setDone(false); setRemaining(duration); deadline.current = Date.now() + duration; setRunning(true); }
  return <div className="space-y-4"><Input label="Timer duration (seconds)" type="number" value={seconds} disabled={running} onChange={(e) => { setSeconds(e.target.value); setRemaining(0); setDone(false); }} /><output aria-label="Timer remaining" className="block font-mono text-3xl">{formatTime(Math.ceil(remaining / 1000) * 1000)}</output><Button disabled={running} onClick={start}>{remaining > 0 ? "Resume timer" : "Start timer"}</Button><Button disabled={!running} onClick={() => { setRemaining(Math.max(0, deadline.current - Date.now())); setRunning(false); }}>Pause timer</Button><Button variant="secondary" onClick={() => { setRunning(false); setRemaining(0); setDone(false); setError(""); }}>Reset timer</Button><ErrorMessage value={error} />{done && <p role="status">Timer complete</p>}</div>;
}

type Todo = { id: string; text: string; completed: boolean };
const todoKey = "toolbox_todos_v1";
function readTodos() { try { return localStorage.getItem(todoKey) || "[]"; } catch { return "[]"; } }
function subscribeTodos(listener: () => void) { window.addEventListener("storage", listener); window.addEventListener("toolbox-todos-change", listener); return () => { window.removeEventListener("storage", listener); window.removeEventListener("toolbox-todos-change", listener); }; }
export function TodoListOnlineTool() {
  const raw = useSyncExternalStore(subscribeTodos, readTodos, () => "[]"); const [text, setText] = useState(""); const [error, setError] = useState("");
  const todos = useMemo<Todo[]>(() => { try { const parsed: unknown = JSON.parse(raw); return Array.isArray(parsed) ? parsed.filter((entry): entry is Todo => !!entry && typeof entry.id === "string" && typeof entry.text === "string" && typeof entry.completed === "boolean").slice(0, 500) : []; } catch { return []; } }, [raw]);
  function save(next: Todo[]) { try { localStorage.setItem(todoKey, JSON.stringify(next)); window.dispatchEvent(new Event("toolbox-todos-change")); setError(""); return true; } catch { setError("Unable to save tasks. Enable browser storage or free storage space."); return false; } }
  function add() { if (!text.trim() || text.trim().length > 500 || todos.length >= 500) { setError("Enter a task from 1 to 500 characters; up to 500 tasks are supported."); return; } if (save([...todos, { id: crypto.randomUUID(), text: text.trim(), completed: false }])) setText(""); }
  return <div className="space-y-4"><p>Saved in this browser. Private browsing or clearing site data can remove tasks.</p><form onSubmit={(e) => { e.preventDefault(); add(); }}><Input label="New task" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} /><Button type="submit">Add task</Button></form><ErrorMessage value={error} /><ul aria-label="Task list">{todos.map((todo) => <li key={todo.id} className="flex items-center gap-3 py-2"><label className="flex items-center gap-2"><input type="checkbox" checked={todo.completed} onChange={() => save(todos.map((entry) => entry.id === todo.id ? { ...entry, completed: !entry.completed } : entry))} /><span className={todo.completed ? "line-through" : ""}>{todo.text}</span></label><Button variant="ghost" aria-label={`Delete ${todo.text}`} onClick={() => save(todos.filter((entry) => entry.id !== todo.id))}>Delete</Button></li>)}</ul><p>{todos.filter((todo) => !todo.completed).length} tasks remaining</p><Button variant="secondary" disabled={!todos.some((todo) => todo.completed)} onClick={() => save(todos.filter((todo) => !todo.completed))}>Clear completed</Button><Button variant="secondary" disabled={!todos.length} onClick={() => downloadText(todos.map((todo) => `${todo.completed ? "[x]" : "[ ]"} ${todo.text}`).join("\n"), "tasks.txt")}>Download tasks</Button></div>;
}
export function PasswordStrengthCheckerTool() {
  const [password, setPassword] = useState(""); const [show, setShow] = useState(false);
  const groups = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((pattern) => pattern.test(password)).length;
  const common = /^(password|qwerty|letmein|admin|welcome|123456)/i.test(password) || /^(.)\1+$/.test(password);
  const label = common || password.length < 8 ? "Weak" : password.length < 12 || groups < 2 ? "Moderate" : password.length >= 16 && groups >= 3 ? "Strong" : "Good";
  return <div className="space-y-4"><Input label="Password to check" type={show ? "text" : "password"} value={password} maxLength={1000} autoComplete="off" onChange={(e) => setPassword(e.target.value)} /><Button variant="secondary" onClick={() => setShow((value) => !value)}>{show ? "Hide password" : "Show password"}</Button><Button variant="secondary" onClick={() => { setPassword(""); setShow(false); }}>Clear password</Button><p>Checked locally. This heuristic does not check breach databases or estimate cracking time. Avoid entering a real account password on shared devices.</p>{password && <ResultPanel title="Password assessment"><p aria-label="Password rating">{label}</p><p>{password.length} characters; {groups} character groups</p><ul><li>Use a unique password for every account and a password manager.</li>{password.length < 16 && <li>Consider at least 16 characters or a longer random passphrase.</li>}{common && <li>Avoid common words, predictable sequences, and repeated characters.</li>}<li>Enable multi-factor authentication where available.</li></ul></ResultPanel>}</div>;
}

export const additionalUtilityComponents = {
  "random-number-generator": RandomNumberGeneratorTool,
  "timestamp-converter": TimestampConverterTool,
  "unix-time-converter": UnixTimeConverterTool,
  "dice-roller": DiceRollerTool,
  stopwatch: StopwatchTool,
  timer: TimerTool,
  "todo-list-online": TodoListOnlineTool,
  "password-strength-checker": PasswordStrengthCheckerTool,
};
