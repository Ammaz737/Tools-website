// Configuration readiness only: no secrets printed, no API requests or database writes.
const present = (name) => Boolean(process.env[name]?.trim());
const checks = [];
const add = (name, ok) => checks.push({ check: name, status: ok ? "READY" : "MISSING_OR_INVALID" });
const provider = (process.env.AI_PROVIDER || "auto").trim().toLowerCase();
const available = {
  openai: present("OPENAI_API_KEY"),
  gemini: present("GEMINI_API_KEY"),
  ollama: present("OLLAMA_BASE_URL") && present("OLLAMA_MODEL"),
};
add("AI provider selection and credentials", provider === "auto" ? Object.values(available).some(Boolean) : Boolean(available[provider]));
const uri = process.env.MONGODB_URI?.trim() || "";
let atlas = false;
try { const value = new URL(uri); atlas = value.protocol === "mongodb+srv:" && Boolean(value.hostname && value.username && value.password) && !/[<>]/.test(uri); } catch {}
add("MongoDB Atlas connection string", atlas);
add("MongoDB database name", present("MONGODB_DB"));
const password = process.env.ADMIN_PASSWORD?.trim() || "";
const secret = process.env.ADMIN_SESSION_SECRET?.trim() || "";
add("Admin password and independent signing secret", Boolean(password && secret.length >= 32 && secret !== password));
let publicOrigin = false;
try { const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || ""); publicOrigin = url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash && !["localhost", "127.0.0.1"].includes(url.hostname); } catch {}
add("Production HTTPS site origin", publicOrigin);
add("Copyleaks credentials, authenticated webhook and live mode", present("COPYLEAKS_EMAIL") && present("COPYLEAKS_API_KEY") && (process.env.COPYLEAKS_WEBHOOK_SECRET?.trim().length || 0) >= 32 && process.env.COPYLEAKS_SANDBOX === "false" && publicOrigin && atlas);
let office = false;
try { const url = new URL(process.env.OFFICE_CONVERTER_URL || ""); office = ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash; } catch {}
add("Native Office converter service URL (configuration only)", office);
const validQuota = (name) => { const raw = process.env[name]?.trim(); const value = raw ? Number(raw) : 1; return Number.isSafeInteger(value) && value >= 1 && value <= 100000; };
add("Shared provider daily quota configuration", atlas && validQuota("AI_DAILY_REQUEST_LIMIT") && validQuota("PLAGIARISM_DAILY_REQUEST_LIMIT"));
for (const check of checks) console.log(`${check.status}: ${check.check}`);
console.log("This validates configuration shape only; live integrations and production readiness require separate verification.");
process.exitCode = checks.every((check) => check.status === "READY") ? 0 : 1;
