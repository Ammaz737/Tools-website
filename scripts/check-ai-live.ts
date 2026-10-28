import { writeFile } from "node:fs/promises";
import { processAiTask, type AiTaskRequest } from "../lib/server/ai";
async function main() {
  // Synthetic fixtures only; no user document content, Atlas writes or automatic retries.
  const cases: { id: string; request: AiTaskRequest; verify: (text: string, score?: number) => boolean; scope?: string }[] = [
    { id: "ai-translator", request: { task: "translate", prompt: "The meeting is on Monday at the library.", targetLanguage: "Spanish" }, verify: text => /lunes/i.test(text) && /biblioteca/i.test(text) },
    { id: "grammar-checker", request: { task: "grammar", prompt: "She go to school every day." }, verify: text => /she/i.test(text) && /goes/i.test(text) },
    { id: "spell-checker", request: { task: "grammar", prompt: "I recieved teh package." }, verify: text => /received/i.test(text) && /the package/i.test(text) },
    { id: "paraphrasing-tool", request: { task: "paraphrase", prompt: "The meeting starts at nine. Attendance is optional." }, verify: text => /nine|9/.test(text) && /optional|voluntary|not (?:required|mandatory)/i.test(text) },
    { id: "article-rewriter", request: { task: "rewrite", prompt: "Mira visited the library on Tuesday. Rewrite as one short sentence without adding facts." }, verify: text => /Mira/.test(text) && /Tuesday/.test(text) && /library/.test(text) },
    { id: "ai-summarizer", request: { task: "summarize", prompt: "The lab tested 20 samples. Five failed. Fifteen passed." }, verify: text => /20|twenty/i.test(text) && /5|five/i.test(text) && /15|fifteen/i.test(text) },
    { id: "ai-writer", request: { task: "write", prompt: "Write exactly two short sentences about a fictional blue kite. Mention no people or dates.", length: "short" }, verify: text => /blue/i.test(text) && /kite/i.test(text) && text.split(/\s+/).length <= 120 },
    { id: "ai-humanizer", request: { task: "humanize", prompt: "The store opens at 8 AM on Monday." }, verify: text => /8|eight/i.test(text) && /Monday/i.test(text) && /open|welcom/i.test(text) },
    { id: "ai-email-writer", request: { task: "email", prompt: "Write a two-sentence email to Alex confirming Friday at 10 AM. Sign as Sam." }, verify: text => /Alex/.test(text) && /Friday/.test(text) && /10|ten/i.test(text) && /Sam/.test(text) },
    { id: "ai-detector", request: { task: "detect", prompt: "At dawn I spilled tea on my notebook, laughed, and copied my shopping list again." }, verify: (text,score) => text.length > 10 && typeof score === "number" && score >= 0 && score <= 100, scope: "Live structured-output contract only; authorship detection accuracy is not established." },
  ];
  const results=[];
  const original=globalThis.fetch; let httpStatus: number | undefined;
  globalThis.fetch=async (...args: Parameters<typeof fetch>) => { const response=await original(...args);httpStatus=response.status;return response; };
  try {
    for (const entry of cases) {
      httpStatus=undefined;const started=Date.now();const output=await processAiTask({...entry.request,timeoutMs:20000});
      if(!output.success){results.push({id:entry.id,status:"BLOCKED",httpStatus,errorCode:output.errorCode,durationMs:Date.now()-started});break;}
      const text=output.result||"";
      results.push({id:entry.id,status:entry.verify(text,output.score)?"SCOPED_PASS":"QUALITY_REVIEW_REQUIRED",httpStatus,result:text.slice(0,1200),score:output.score,scope:entry.scope||"Synthetic task fixture only, not comprehensive accuracy.",durationMs:Date.now()-started});
    }
  } finally {globalThis.fetch=original;}
  for(const entry of cases) if(!results.some(result=>result.id===entry.id))results.push({id:entry.id,status:"BLOCKED",reason:"Stopped after provider failure; no automatic retries or further spending."});
  await writeFile("docs/ai-live-results.json",JSON.stringify({checkedAt:new Date().toISOString(),scope:"Actual application provider function and configured private account. Synthetic prompts, at most10 sequential requests, 20second deadlines, existing2048output-token cap, no retries. Public production route/Atlas quota is a separate acceptance; no Atlas writes.",results},null,2)+"\n");
  console.log(results.map(result=>({id:result.id,status:result.status,...("httpStatus"in result?{httpStatus:result.httpStatus}:{})})));
  if(results.some(result=>result.status!=="SCOPED_PASS"))process.exitCode=1;
}
void main().catch(()=>{console.error("Live AI verification could not complete; no credentials logged");process.exitCode=1;});
