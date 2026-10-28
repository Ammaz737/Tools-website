"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ResultPanel, Button, Input, Select, Badge, Card } from "@/components/ui";


function useCancelableRequest() {
  const active = useRef<AbortController | null>(null);
  const cancel = useCallback(() => { active.current?.abort(); active.current = null; }, []);
  const begin = useCallback(() => {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    return { signal: controller.signal, current: () => active.current === controller && !controller.signal.aborted };
  }, []);
  useEffect(() => cancel, [cancel]);
  return { begin, cancel };
}

// 1. Server Currency Converter Tool
export const CurrencyConverterServerTool: React.FC = () => {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{ updatedAt?: string; source?: string }>({});
  const { begin, cancel } = useCancelableRequest();
  const receiveRates = useCallback(async (request: ReturnType<typeof begin>) => {
    try {
      const response = await fetch("/api/rates", { signal: request.signal });
      const data = await response.json();
      if (!request.current()) return;
      if (!response.ok || !data.success || !data.rates || data.base !== "USD" || data.rates.USD !== 1 ||
        !Object.entries(data.rates).every(([currency, rate]) => /^[A-Z]{3}$/.test(currency) && typeof rate === "number" && Number.isFinite(rate) && rate > 0)) {
        throw new Error(data.error || "Exchange rates unavailable");
      }
      setRates(data.rates);
      setMetadata({ updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined, source: typeof data.source === "string" ? data.source : undefined });
    } catch (err) {
      if (request.current()) setError(err instanceof Error ? err.message : "Exchange rates unavailable");
    } finally { if (request.current()) setLoading(false); }
  }, []);
  useEffect(() => {
    const request = begin();
    // Start asynchronously; cleanup can invalidate an unmounted request first.
    void Promise.resolve().then(() => { if (request.current()) return receiveRates(request); });
    return cancel;
  }, [begin, cancel, receiveRates]);
  const retry = () => { setRates({}); setMetadata({}); setError(null); setLoading(true); void receiveRates(begin()); };
  const numericAmount = Number(amount);
  const amountError = !amount.trim() || !Number.isFinite(numericAmount) || numericAmount < 0 ? "Enter a finite amount of zero or more" : null;
  const converted = !amountError && rates[from] && rates[to] ? numericAmount / rates[from] * rates[to] : null;
  const result = converted !== null && Number.isFinite(converted) ? converted : null;
  const currencyOptions = (Object.keys(rates).length ? Object.keys(rates).sort() : ["USD", "EUR", "GBP", "PKR", "INR"]).map(value => ({ value, label: value }));
  return <div className="space-y-6">
    <div className="grid sm:grid-cols-3 gap-4">
      <Input label="Amount" type="number" min="0" step="any" value={amount} aria-invalid={!!amountError} onChange={e => setAmount(e.target.value)} />
      <Select label="From Currency" value={from} onChange={e => setFrom(e.target.value)} options={currencyOptions} />
      <Select label="To Currency" value={to} onChange={e => setTo(e.target.value)} options={currencyOptions} />
    </div>
    {amountError && <p role="alert" className="text-sm text-[var(--danger)]">⚠️ {amountError}</p>}
    {error && <div><p role="alert" className="text-sm text-[var(--danger)]">{error}</p><Button onClick={retry}>Retry exchange rates</Button></div>}
    <ResultPanel title="Exchange Rate Conversion" status={loading ? "processing" : result !== null ? "done" : "idle"}>
      {loading ? <p>Loading published exchange rates...</p> : result !== null ? <div className="text-center py-6 space-y-2">
        <span className="block text-xs">Converted Total</span>
        <span className="block font-mono text-3xl font-bold text-[var(--accent)]">{result.toFixed(2)} {to}</span>
        <span className="block text-xs">1 {from} = {(rates[to] / rates[from]).toFixed(4)} {to}</span>
      </div> : !error && !amountError ? <p role="alert">Conversion unavailable for these values</p> : null}
      {metadata.updatedAt && <p className="text-xs">Rates updated: {metadata.updatedAt}</p>}
      {metadata.source && <p className="text-xs">Source: {metadata.source}</p>}
      {Object.keys(rates).length > 0 && <p className="text-xs"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">Rates By Exchange Rate API</a> · Published reference rates, not a trading quote.</p>}
    </ResultPanel>
  </div>;
};

// 2. DNS Lookup Tool
export const DnsLookupTool: React.FC = () => {
  const [domain, setDomain] = useState("google.com");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultTarget, setResultTarget] = useState("");
  const { begin, cancel } = useCancelableRequest();
  const resetResult = () => { cancel(); setData(null); setError(null); setLoading(false); };

  const fetchDns = async () => {
    if (!domain.trim()) { resetResult(); setError("Enter a value before checking"); return; }
    const request = begin();
    setData(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dns?domain=${encodeURIComponent(domain)}`, { signal: request.signal });
      const json = await res.json();
      if (!request.current()) return;
      if (res.ok && json.success) {
        setData(json.records);
        setResultTarget(typeof json.domain === "string" ? json.domain : domain.trim());
      } else {
        setError(json.error || "Failed to fetch DNS records");
      }
    } catch (err: unknown) {
      if (!request.current()) return;
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      if (request.current()) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            label="Domain Name / Hostname"
            placeholder="e.g. example.com"
            value={domain}
            onChange={(e) => { resetResult(); setDomain(e.target.value); }}
          />
        </div>
        <Button variant="primary" onClick={fetchDns} loading={loading}>
          Lookup DNS
        </Button>
      </div>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] text-xs text-[var(--danger)] p-4">
          <p role="alert">⚠️ {error}</p>
        </Card>
      )}

      {data && (
        <ResultPanel title={`DNS Records for ${resultTarget}`} status="done">
          <div className="p-4 space-y-4 font-mono text-xs overflow-x-auto">
            {Object.entries(data).map(([type, records]) => (
              <div key={type} className="border-b border-[var(--line)] pb-3 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="accent" size="sm">{type}</Badge>
                  <span className="text-[var(--ink-soft)] font-sans text-xs">
                    ({Array.isArray(records) ? records.length : 0} entries)
                  </span>
                </div>
                {Array.isArray(records) && records.length > 0 ? (
                  <pre className="bg-[var(--surface-sunk)] p-2.5 rounded-[6px] text-[var(--ink)] overflow-x-auto">
                    {JSON.stringify(records, null, 2)}
                  </pre>
                ) : (
                  <span className="text-[var(--ink-faint)] italic">No records found</span>
                )}
              </div>
            ))}
          </div>
        </ResultPanel>
      )}
    </div>
  );
};

// 3. WHOIS Lookup Tool
export const WhoisLookupTool: React.FC = () => {
  const [domain, setDomain] = useState("github.com");
  const [whois, setWhois] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultTarget, setResultTarget] = useState("");
  const { begin, cancel } = useCancelableRequest();
  const resetResult = () => { cancel(); setWhois(null); setError(null); setLoading(false); };

  const fetchWhois = async () => {
    if (!domain.trim()) { resetResult(); setError("Enter a value before checking"); return; }
    const request = begin();
    setWhois(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/whois?domain=${encodeURIComponent(domain)}`, { signal: request.signal });
      const json = await res.json();
      if (!request.current()) return;
      if (res.ok && json.success) {
        setWhois(json.whois);
        setResultTarget(typeof json.domain === "string" ? json.domain : domain.trim());
      } else {
        setError(json.error || "WHOIS lookup failed");
      }
    } catch (err: unknown) {
      if (!request.current()) return;
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      if (request.current()) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input label="Domain Name" placeholder="e.g. github.com" value={domain} onChange={(e) => { resetResult(); setDomain(e.target.value); }} />
        </div>
        <Button variant="primary" onClick={fetchWhois} loading={loading}>
          Query WHOIS
        </Button>
      </div>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] text-xs text-[var(--danger)] p-4">
          <p role="alert">⚠️ {error}</p>
        </Card>
      )}

      {whois && (
        <ResultPanel title={`WHOIS Summary for ${resultTarget}`} status="done">
          <div className="p-4 space-y-3 font-sans text-xs">
            {Object.entries(whois).map(([key, val]) => (
              <div key={key} className="flex justify-between border-b border-[var(--line)] pb-2 last:border-0">
                <span className="font-semibold text-[var(--ink-soft)] capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                <span className="font-mono text-[var(--ink)]">
                  {Array.isArray(val) ? val.join(", ") : String(val)}
                </span>
              </div>
            ))}
          </div>
        </ResultPanel>
      )}
    </div>
  );
};

// 4. SSL Certificate Checker Tool
export const SslCheckerTool: React.FC = () => {
  const [domain, setDomain] = useState("vercel.com");
  const [cert, setCert] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultTarget, setResultTarget] = useState("");
  const { begin, cancel } = useCancelableRequest();
  const resetResult = () => { cancel(); setCert(null); setError(null); setLoading(false); };

  const fetchSsl = async () => {
    if (!domain.trim()) { resetResult(); setError("Enter a value before checking"); return; }
    const request = begin();
    setCert(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ssl?domain=${encodeURIComponent(domain)}`, { signal: request.signal });
      const json = await res.json();
      if (!request.current()) return;
      if (res.ok && json.success) {
        setCert(json.certificate);
        setResultTarget(typeof json.domain === "string" ? json.domain : domain.trim());
      } else {
        setError(json.error || "SSL inspection failed");
      }
    } catch (err: unknown) {
      if (!request.current()) return;
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      if (request.current()) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input label="Domain / Hostname" placeholder="e.g. vercel.com" value={domain} onChange={(e) => { resetResult(); setDomain(e.target.value); }} />
        </div>
        <Button variant="primary" onClick={fetchSsl} loading={loading}>
          Inspect SSL
        </Button>
      </div>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] text-xs text-[var(--danger)] p-4">
          <p role="alert">⚠️ {error}</p>
        </Card>
      )}

      {cert && (
        <ResultPanel title={`SSL Certificate for ${resultTarget}`} status="done">
          <div className="p-4 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <Badge variant={cert.valid ? "success" : "danger"} size="md">
                {cert.valid ? "VALID SSL CERTIFICATE" : "EXPIRED / INVALID"}
              </Badge>
              <span className="font-mono text-xs text-[var(--ink-soft)]">
                {String(cert.daysRemaining)} days remaining
              </span>
            </div>

            <div className="space-y-2 font-mono bg-[var(--surface-sunk)] p-3 rounded-[8px]">
              <div><span className="text-[var(--ink-soft)]">Subject CN:</span> {String(cert.subject)}</div>
              <div><span className="text-[var(--ink-soft)]">Issuer:</span> {String(cert.issuer)}</div>
              <div><span className="text-[var(--ink-soft)]">Valid From:</span> {String(cert.validFrom)}</div>
              <div><span className="text-[var(--ink-soft)]">Valid To:</span> {String(cert.validTo)}</div>
              <div><span className="text-[var(--ink-soft)]">Fingerprint:</span> {String(cert.fingerprint)}</div>
            </div>
          </div>
        </ResultPanel>
      )}
    </div>
  );
};

// 5. IP & Geolocation Lookup Tool
export const IpLookupTool: React.FC = () => {
  const [target, setTarget] = useState("");
  const [ipData, setIpData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { begin, cancel } = useCancelableRequest();
  const resetResult = () => { cancel(); setIpData(null); setError(null); setLoading(false); };

  const fetchIp = async () => {
    if (!target.trim()) { resetResult(); setError("Enter a public IP address or domain"); return; }
    const request = begin();
    setIpData(null);
    setLoading(true);
    setError(null);
    try {
      const url = target.trim() ? `/api/ip?query=${encodeURIComponent(target.trim())}` : "/api/ip";
      const res = await fetch(url, { signal: request.signal });
      const json = await res.json();
      if (!request.current()) return;
      if (res.ok && json.success) {
        setIpData(json.info);
      } else {
        setError(json.error || "IP lookup failed");
      }
    } catch (err: unknown) {
      if (!request.current()) return;
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      if (request.current()) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            label="IP Address or Hostname"
            placeholder="e.g. 8.8.8.8 or example.com"
            value={target}
            onChange={(e) => { resetResult(); setTarget(e.target.value); }}
          />
        </div>
        <Button variant="primary" onClick={fetchIp} loading={loading}>
          Lookup IP
        </Button>
      </div>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] text-xs text-[var(--danger)] p-4">
          <p role="alert">⚠️ {error}</p>
        </Card>
      )}

      {ipData && (
        <ResultPanel title={`IP Details: ${String(ipData.ip)}`} status="done">
          <div className="p-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[var(--surface-sunk)] rounded-[8px] space-y-1 font-mono">
              <span className="block text-[var(--ink-soft)] font-sans">Country & Region</span>
              <span className="block font-bold text-sm">{String(ipData.country)} ({String(ipData.countryCode)})</span>
              <span className="block text-[var(--ink-soft)]">{String(ipData.city)}, {String(ipData.region)}</span>
            </div>
            <div className="p-3 bg-[var(--surface-sunk)] rounded-[8px] space-y-1 font-mono">
              <span className="block text-[var(--ink-soft)] font-sans">ISP & Organization</span>
              <span className="block font-bold text-sm">{String(ipData.org)}</span>
              <span className="block text-[var(--ink-soft)]">TZ: {String(ipData.timezone)}</span>
            </div>
          </div>
        </ResultPanel>
      )}
    </div>
  );
};

// 6. Email & MX Validator Tool
export const EmailValidatorTool: React.FC = () => {
  const [email, setEmail] = useState("test@gmail.com");
  const [resData, setResData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultTarget, setResultTarget] = useState("");
  const { begin, cancel } = useCancelableRequest();
  const resetResult = () => { cancel(); setResData(null); setError(null); setLoading(false); };

  const checkEmail = async () => {
    if (!email.trim()) { resetResult(); setError("Enter a value before checking"); return; }
    const request = begin();
    setResData(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/email-check?email=${encodeURIComponent(email)}`, { signal: request.signal });
      const json = await res.json();
      if (!request.current()) return;
      if (res.ok && json.success) {
        setResData(json);
        setResultTarget(typeof json.email === "string" ? json.email : email.trim());
      } else {
        setError(json.error || "Email check failed");
      }
    } catch (err: unknown) {
      if (!request.current()) return;
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      if (request.current()) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input label="Email Address to Validate" placeholder="name@domain.com" value={email} onChange={(e) => { resetResult(); setEmail(e.target.value); }} />
        </div>
        <Button variant="primary" onClick={checkEmail} loading={loading}>
          Validate Email
        </Button>
      </div>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] text-xs text-[var(--danger)] p-4">
          <p role="alert">⚠️ {error}</p>
        </Card>
      )}

      {resData && (
        <ResultPanel title={`Email Diagnostic: ${resultTarget}`} status="done">
          <div className="p-4 space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={resData.hasMxRecords ? "success" : "danger"} size="md">
                {String(resData.status)}
              </Badge>
            </div>

            <div className="bg-[var(--surface-sunk)] p-3 rounded-[8px] font-mono space-y-1">
              <div><span className="text-[var(--ink-soft)]">Domain:</span> {String(resData.domain)}</div>
              <div><span className="text-[var(--ink-soft)]">Syntax Valid:</span> {resData.validSyntax ? "Yes ✓" : "No ✗"}</div>
              <div>
                <span className="text-[var(--ink-soft)]">MX Records:</span>{" "}
                {Array.isArray(resData.mxRecords) && resData.mxRecords.length > 0
                  ? resData.mxRecords.map((m: { exchange?: string }) => m.exchange).join(", ")
                  : "None"}
              </div>
            </div>
          </div>
        </ResultPanel>
      )}
    </div>
  );
};

// 7. Broken Link Checker Tool
export const BrokenLinkCheckerTool: React.FC = () => {
  const [url, setUrl] = useState("https://wikipedia.org");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { begin, cancel } = useCancelableRequest();
  const resetResult = () => { cancel(); setData(null); setError(null); setLoading(false); };

  const crawlPage = async () => {
    if (!url.trim()) { resetResult(); setError("Enter a value before checking"); return; }
    const request = begin();
    setData(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/crawl?url=${encodeURIComponent(url)}&mode=links`, { signal: request.signal },
      );
      const json = await res.json();
      if (!request.current()) return;
      if (res.ok && json.success) {
        setData(json);
      } else {
        setError(json.error || "Link crawler failed");
      }
    } catch (err: unknown) {
      if (!request.current()) return;
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      if (request.current()) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input label="Target URL to Crawl" placeholder="https://example.com" value={url} onChange={(e) => { resetResult(); setUrl(e.target.value); }} />
        </div>
        <Button variant="primary" onClick={crawlPage} loading={loading}>
          Crawl Links
        </Button>
      </div>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] text-xs text-[var(--danger)] p-4">
          <p role="alert">⚠️ {error}</p>
        </Card>
      )}

      {data && (
        <ResultPanel title={`Page Crawl Results for ${String(data.url)}`} status="done">
          <div className="p-4 space-y-4 text-xs font-mono">
            <div className="flex items-center gap-3">
              <Badge variant={Number(data.statusCode) < 400 ? "success" : "danger"} size="md">
                HTTP {String(data.statusCode)} ({String(data.statusText)})
              </Badge>
              <span className="text-[var(--ink-soft)]">{String(data.responseTimeMs)} ms response time</span>
            </div>

            <div>
              <span className="mb-1 block font-sans font-semibold text-[var(--ink-soft)]">
                Link status ({String(data.brokenCount ?? 0)} broken)
              </span>
              {Array.isArray(data.linkResults) && data.linkResults.length > 0 ? (
                <ul className="space-y-1 rounded-[8px] bg-[var(--surface-sunk)] p-3">
                  {(data.linkResults as Array<{
                    url: string;
                    statusCode: number;
                    ok: boolean;
                    statusText: string;
                  }>).map((link, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[var(--ink)]">
                      <Badge variant={link.ok ? "success" : "danger"} size="sm">
                        {link.statusCode || "ERR"}
                      </Badge>
                      <span className="truncate">{link.url}</span>
                    </li>
                  ))}
                </ul>
              ) : Array.isArray(data.sampleLinks) && data.sampleLinks.length > 0 ? (
                <ul className="space-y-1 rounded-[8px] bg-[var(--surface-sunk)] p-3">
                  {data.sampleLinks.map((link: string, idx: number) => (
                    <li key={idx} className="truncate text-[var(--ink)]">
                      {link}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="italic text-[var(--ink-faint)]">No links found</span>
              )}
            </div>
          </div>
        </ResultPanel>
      )}
    </div>
  );
};

// 8. Website Speed Test Tool
export const WebsiteSpeedTestTool: React.FC = () => {
  const [url, setUrl] = useState("https://google.com");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { begin, cancel } = useCancelableRequest();
  const resetResult = () => { cancel(); setData(null); setError(null); setLoading(false); };

  const runSpeedTest = async () => {
    if (!url.trim()) { resetResult(); setError("Enter a value before checking"); return; }
    const request = begin();
    setData(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crawl?url=${encodeURIComponent(url)}`, { signal: request.signal });
      const json = await res.json();
      if (!request.current()) return;
      if (res.ok && json.success) {
        setData(json);
      } else {
        setError(json.error || "Speed test failed");
      }
    } catch (err: unknown) {
      if (!request.current()) return;
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      if (request.current()) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input label="Target URL for Latency Check" placeholder="https://example.com" value={url} onChange={(e) => { resetResult(); setUrl(e.target.value); }} />
        </div>
        <Button variant="primary" onClick={runSpeedTest} loading={loading}>
          Test Speed
        </Button>
      </div>

      {error && (
        <Card variant="bordered" className="border-[var(--danger)] text-xs text-[var(--danger)] p-4">
          <p role="alert">⚠️ {error}</p>
        </Card>
      )}

      {data && (
        <ResultPanel title={`Speed Performance: ${String(data.url)}`} status="done">
          <div className="p-4 space-y-4 text-xs font-mono">
            <div className="grid sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[var(--surface-sunk)] rounded-[8px]">
                <span className="block text-[var(--ink-soft)] font-sans text-xs">Response Time</span>
                <span className="block font-bold text-lg text-[var(--success)]">{String(data.responseTimeMs)} ms</span>
              </div>
              <div className="p-3 bg-[var(--surface-sunk)] rounded-[8px]">
                <span className="block text-[var(--ink-soft)] font-sans text-xs">Page Weight</span>
                <span className="block font-bold text-lg">{((Number(data.pageSizeBytes) || 0) / 1024).toFixed(1)} KB</span>
              </div>
              <div className="p-3 bg-[var(--surface-sunk)] rounded-[8px]">
                <span className="block text-[var(--ink-soft)] font-sans text-xs">Status Code</span>
                <span className="block font-bold text-lg">{String(data.statusCode)}</span>
              </div>
            </div>

            <div>
              <span className="block font-sans font-semibold mb-1 text-[var(--ink-soft)]">Response Headers:</span>
              <pre className="bg-[var(--surface-sunk)] p-3 rounded-[8px] text-[var(--ink)] overflow-x-auto text-xs">
                {JSON.stringify(data.headers, null, 2)}
              </pre>
            </div>
          </div>
        </ResultPanel>
      )}
    </div>
  );
};
