import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readJsonBody } from "./request-body";
export interface PlagiarismConfig { email: string; key: string; webhookSecret: string; origin: string; sandbox: boolean }
export interface PlagiarismResult { score: number; sources: { title: string; url: string; matchedWords?: number }[]; sourcesTruncated: boolean; otherSourceCount: number }
export class PlagiarismError extends Error { constructor(message: string,public status=502){super(message);} }
export function plagiarismConfig(env: Record<string,string|undefined>=process.env): PlagiarismConfig | null {
  const email=env.COPYLEAKS_EMAIL?.trim(),key=env.COPYLEAKS_API_KEY?.trim(),webhookSecret=env.COPYLEAKS_WEBHOOK_SECRET?.trim();
  if(!email||email.length>320||!key||key.length>500||!webhookSecret||! /^[\x21-\x7e]{32,128}$/.test(webhookSecret))return null;
  if(env.COPYLEAKS_SANDBOX && !["true","false"].includes(env.COPYLEAKS_SANDBOX))return null;
  try {const url=new URL(env.NEXT_PUBLIC_SITE_URL||"");if(url.protocol!=="https:"||url.username||url.password||url.pathname!=="/"||url.search||url.hash||["localhost","127.0.0.1","[::1]"].includes(url.hostname))return null;return {email,key,webhookSecret,origin:url.origin,sandbox:env.COPYLEAKS_SANDBOX!=="false"};}catch{return null;}
}
export const hashPlagiarismToken=(token: string)=>createHash("sha256").update(token).digest("hex");
export function newPlagiarismIdentity(){const token=randomBytes(32).toString("base64url");return {id:randomBytes(16).toString("hex"),token,tokenHash:hashPlagiarismToken(token)};}
export function validPlagiarismToken(token: string,hash: string){if(!/^[A-Za-z0-9_-]{43}$/.test(token)||! /^[a-f0-9]{64}$/.test(hash))return false;return timingSafeEqual(Buffer.from(hashPlagiarismToken(token),"hex"),Buffer.from(hash,"hex"));}
export function authorizedPlagiarismWebhook(value: string|null,secret: string){if(!value||value.length>256)return false;return timingSafeEqual(createHash("sha256").update(value).digest(),createHash("sha256").update(secret).digest());}
const record=(value: unknown): Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
export function parsePlagiarismCompletion(body: Record<string,unknown>,scanId: string): PlagiarismResult {
  const document=record(body.scannedDocument),results=record(body.results),score=record(results.score).aggregatedScore;
  if(document.scanId!==scanId||body.status!==0||typeof score!=="number"||!Number.isFinite(score)||score<0||score>100)throw new PlagiarismError("Invalid scan result",400);
  if(results.internet!==undefined&&!Array.isArray(results.internet))throw new PlagiarismError("Invalid scan sources",400);
  const sources: PlagiarismResult["sources"]=[];const internet=results.internet as unknown[]||[];
  for(const entry of internet.slice(0,200)){
    const item=record(entry);if(typeof item.url!=="string"||item.url.length>2048)continue;
    let url: URL;try{url=new URL(item.url);}catch{continue;}
    if(!["https:","http:"].includes(url.protocol)||url.username||url.password)continue;
    if(sources.length>=50)break;
    const matchedWords=typeof item.matchedWords==="number"&&Number.isSafeInteger(item.matchedWords)&&item.matchedWords>=0?item.matchedWords:undefined;
    sources.push({title:typeof item.title==="string"?item.title.slice(0,300):url.hostname,url:url.href,...(matchedWords===undefined?{}:{matchedWords})});
  }
  const otherSourceCount=[results.database,results.batch,results.repositories].reduce<number>((sum,value)=>sum+(Array.isArray(value)?value.length:0),0);
  return {score,sources,sourcesTruncated:internet.length>sources.length,otherSourceCount};
}
export function createPlagiarismProvider(config: PlagiarismConfig,fetcher: typeof fetch=fetch){
  let token="",expires=0,pending: Promise<string>|undefined;
  const request=async(url: string,method: string,body: unknown,bearer?: string,timeoutMs=15000,ignoreBody=false)=>{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Math.min(30000,Math.max(1000,timeoutMs)));
    try{const response=await fetcher(url,{method,redirect:"error",signal:controller.signal,headers:{"Content-Type":"application/json",...(bearer?{Authorization:`Bearer ${bearer}`}:{})},body:JSON.stringify(body)});
      if(!response.ok){void response.body?.cancel();throw new PlagiarismError("The originality check service is temporarily unavailable");}
      if(ignoreBody||response.status===204||response.headers.get("content-length")==="0"){void response.body?.cancel();return {};}
      const boundedBody = new Request(url, Object.assign({method:"POST",headers:response.headers,body:response.body},{duplex:"half"}));
      return await readJsonBody(boundedBody,1024*1024,Math.min(30000,Math.max(1000,timeoutMs)));
    }catch(error){if(error instanceof PlagiarismError)throw error;throw new PlagiarismError("The originality check service did not return a valid response");}finally{clearTimeout(timer);}
  };
  const login=async()=>{
    if(token&&Date.now()<expires)return token;
    if(!pending)pending=(async()=>{const result=await request("https://id.copyleaks.com/v3/account/login/api","POST",{email:config.email,key:config.key});if(typeof result.access_token!=="string"||!result.access_token||result.access_token.length>8192||/[\r\n]/.test(result.access_token))throw new PlagiarismError("The originality check service could not authenticate");token=result.access_token;expires=Date.now()+47*60*60*1000;return token;})().finally(()=>{pending=undefined;});
    return pending;
  };
  return {async submit(scanId: string,text: string,timeoutMs?: number){
    if(!/^[a-f0-9]{32}$/.test(scanId)||!text.trim()||text.length>20000)throw new PlagiarismError("Enter between 1 and 20,000 characters",400);
    const bearer=await login();
    await request(`https://api.copyleaks.com/v3/scans/submit/file/${scanId}`,"PUT",{base64:Buffer.from(text,"utf8").toString("base64"),filename:"text.txt",properties:{sandbox:config.sandbox,expiration:1,indexing:{copyleaksDb:false,repositories:[]},webhooks:{status:`${config.origin}/api/plagiarism/webhook/${scanId}/{STATUS}`,statusHeaders:[["x-plagiarism-webhook-secret",config.webhookSecret]]}}},bearer,timeoutMs,true);
  }};
}
let cachedProvider: ReturnType<typeof createPlagiarismProvider>|undefined,cachedKey="";
export function getPlagiarismProvider(config: PlagiarismConfig){const key=hashPlagiarismToken(JSON.stringify(config));if(cachedKey!==key){cachedProvider=createPlagiarismProvider(config);cachedKey=key;}return cachedProvider!;}



