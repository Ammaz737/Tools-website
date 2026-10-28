import assert from "node:assert/strict";
import test from "node:test";
import { plagiarismConfig, newPlagiarismIdentity, validPlagiarismToken, authorizedPlagiarismWebhook, parsePlagiarismCompletion, createPlagiarismProvider, type PlagiarismConfig } from "../lib/server/plagiarism";
const config: PlagiarismConfig={email:"test@example.org",key:"test-key",webhookSecret:"z".repeat(40),origin:"https://staging.example.org",sandbox:true};
const env={COPYLEAKS_EMAIL:config.email,COPYLEAKS_API_KEY:config.key,COPYLEAKS_WEBHOOK_SECRET:config.webhookSecret,NEXT_PUBLIC_SITE_URL:config.origin};
const id="a".repeat(32);
test("plagiarism config fails closed and defaults to simulated sandbox",()=>{
  assert.equal(plagiarismConfig({}),null);assert.equal(plagiarismConfig({...env,COPYLEAKS_WEBHOOK_SECRET:"short"}),null);
  assert.equal(plagiarismConfig({...env,NEXT_PUBLIC_SITE_URL:"http://staging.example.org"}),null);
  assert.equal(plagiarismConfig({...env,NEXT_PUBLIC_SITE_URL:"https://user:secret@example.org"}),null);
  assert.equal(plagiarismConfig({...env,COPYLEAKS_SANDBOX:"0"}),null);
  assert.equal(plagiarismConfig(env)?.sandbox,true);assert.equal(plagiarismConfig({...env,COPYLEAKS_SANDBOX:"false"})?.sandbox,false);
});
test("anonymous polling credentials are random and only hashes authenticate",()=>{
  const a=newPlagiarismIdentity(),b=newPlagiarismIdentity();assert.notEqual(a.id,b.id);assert.notEqual(a.token,b.token);assert.notEqual(a.token,a.tokenHash);
  assert.ok(validPlagiarismToken(a.token,a.tokenHash));assert.equal(validPlagiarismToken(b.token,a.tokenHash),false);assert.equal(validPlagiarismToken(a.token,a.tokenHash.slice(1)),false);assert.equal(validPlagiarismToken("",a.tokenHash),false);
});
test("webhook custom secret requires exact authenticated value",()=>{
  assert.ok(authorizedPlagiarismWebhook(config.webhookSecret,config.webhookSecret));assert.equal(authorizedPlagiarismWebhook(null,config.webhookSecret),false);assert.equal(authorizedPlagiarismWebhook("wrong",config.webhookSecret),false);
});
const completion=(score: unknown=12.5)=>({status:0,scannedDocument:{scanId:id},results:{score:{aggregatedScore:score},internet:[{title:"Published source",url:"https://example.org/page",matchedWords:25}]}});
test("documented completion score and source data are retained without fabricated originality",()=>{
  assert.deepEqual(parsePlagiarismCompletion(completion(),id),{score:12.5,sources:[{title:"Published source",url:"https://example.org/page",matchedWords:25}],sourcesTruncated:false,otherSourceCount:0});
  assert.equal(parsePlagiarismCompletion(completion(0),id).score,0);
});
test("completion rejects wrong scan ID, non-success status, missing and invalid scores",()=>{
  for(const score of [undefined,null,"25",-1,101,NaN]){const body=completion();body.results.score.aggregatedScore=score;assert.throws(()=>parsePlagiarismCompletion(body,id));}
  assert.throws(()=>parsePlagiarismCompletion(completion(),"b".repeat(32)));
  assert.throws(()=>parsePlagiarismCompletion({...completion(),status:1},id));
});
test("public summaries strip unsafe links and bound source list and title length",()=>{
  const body=completion();body.results.internet=[{title:"Bad",url:"javascript:alert(1)",matchedWords:1},{title:"Credentials",url:"https://secret:pw@example.org",matchedWords:1},...Array.from({length:70},(_,i)=>({title:"A".repeat(1000),url:`https://example.org/${i}`,matchedWords:i}))];
  const result=parsePlagiarismCompletion(body,id);assert.equal(result.sources.length,50);assert.equal(result.sources[0].title.length,300);assert.ok(result.sourcesTruncated);assert.ok(result.sources.every(source=>source.url.startsWith("https://example.org/")));
});
test("submission matches official login/file/webhook contract and encodes UTF8",async()=>{
  const calls:{url:string;init:RequestInit}[]=[];
  const fetcher=(async(url,init)=>{calls.push({url:String(url),init:init!});return calls.length===1?Response.json({access_token:"mock-access-token"}):new Response(null,{status:201});}) as typeof fetch;
  await createPlagiarismProvider(config,fetcher).submit(id,"اردو🙂");
  assert.equal(calls[0].url,"https://id.copyleaks.com/v3/account/login/api");assert.deepEqual(JSON.parse(calls[0].init.body as string),{email:config.email,key:config.key});
  assert.equal(calls[1].url,`https://api.copyleaks.com/v3/scans/submit/file/${id}`);assert.equal(calls[1].init.method,"PUT");assert.equal(calls[1].init.redirect,"error");assert.equal((calls[1].init.headers as Record<string,string>).Authorization,"Bearer mock-access-token");
  const payload=JSON.parse(calls[1].init.body as string);assert.equal(Buffer.from(payload.base64,"base64").toString("utf8"),"اردو🙂");assert.equal(payload.properties.sandbox,true);assert.equal(payload.properties.expiration,1);assert.deepEqual(payload.properties.indexing,{copyleaksDb:false,repositories:[]});
  assert.deepEqual(payload.properties.webhooks,{status:`${config.origin}/api/plagiarism/webhook/${id}/{STATUS}`,statusHeaders:[["x-plagiarism-webhook-secret",config.webhookSecret]]});
});
test("provider login is reused with concurrent single-flight authentication",async()=>{
  let logins=0,submissions=0;
  const fetcher=(async(url)=>{if(String(url).startsWith("https://id.")){logins++;await new Promise(resolve=>setTimeout(resolve,10));return Response.json({access_token:"token"});}submissions++;return new Response(null,{status:201});})as typeof fetch;
  const provider=createPlagiarismProvider(config,fetcher);await Promise.all([provider.submit(id,"A"),provider.submit("b".repeat(32),"B")]);await provider.submit("c".repeat(32),"C");assert.equal(logins,1);assert.equal(submissions,3);
});
test("malformed login, oversized response and upstream failures are sanitized",async()=>{
  for(const response of [Response.json({access_token:null}),new Response("x".repeat(1024*1024+1)),new Response("sensitive-key-and-provider-error",{status:401})]){
    await assert.rejects(createPlagiarismProvider(config,(async()=>response)as typeof fetch).submit(id,"text"),error=>error instanceof Error&&!error.message.includes("sensitive"));
  }
});
test("empty and oversized source input never reaches provider",async()=>{
  let calls=0;const provider=createPlagiarismProvider(config,(async()=>{calls++;return Response.json({});})as typeof fetch);
  for(const input of [" ","a".repeat(20001)])await assert.rejects(provider.submit(id,input));assert.equal(calls,0);
});
test("submission route requires browser origin and explicit transfer consent before any scan",async()=>{
  const {POST}=await import("../app/api/plagiarism/route");
  const missingOrigin=await POST(new Request("https://example.org/api/plagiarism",{method:"POST",body:JSON.stringify({text:"original text",consent:true})}));assert.equal(missingOrigin.status,403);
  const missingConsent=await POST(new Request("https://example.org/api/plagiarism",{method:"POST",headers:{origin:"https://example.org"},body:JSON.stringify({text:"original text"})}));assert.equal(missingConsent.status,400);
});
test("poll route rejects malformed IDs or missing access token without database access",async()=>{
  const {GET}=await import("../app/api/plagiarism/[jobId]/route");
  const response=await GET(new Request("https://example.org/api/plagiarism/bad"),{params:Promise.resolve({jobId:"bad"})});assert.equal(response.status,404);assert.equal(response.headers.get("cache-control"),"no-store");
});

