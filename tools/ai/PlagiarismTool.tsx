"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Textarea } from "@/components/ui";
import type { PlagiarismResult } from "@/lib/server/plagiarism";
interface Job {jobId: string;accessToken: string; sandbox: boolean}
export function PlagiarismTool(){
  const [text,setText]=useState(""),[consent,setConsent]=useState(false),[job,setJob]=useState<Job|null>(null);
  const [busy,setBusy]=useState(false),[polling,setPolling]=useState(false),[error,setError]=useState(""),[result,setResult]=useState<PlagiarismResult|null>(null);
  const submitController=useRef<AbortController|null>(null);const generation=useRef(0);
  useEffect(()=>()=>{generation.current++;submitController.current?.abort();},[]);
  useEffect(()=>{
    if(!job||!polling)return;
    let active=true,attempts=0;let timer: ReturnType<typeof setTimeout>|undefined;let controller: AbortController|undefined;
    const poll=async()=>{
      controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),10000);
      try{const response=await fetch(`/api/plagiarism/${job.jobId}`,{headers:{Authorization:`Bearer ${job.accessToken}`},cache:"no-store",signal:controller.signal});const body=await response.json();
        if(!active)return;
        if(!response.ok)throw new Error("Results could not be retrieved. Try checking the result again.");
        if(body.state==="completed"&&body.result){setResult(body.result);setPolling(false);return;}
        if(body.state==="error"){setError("This check could not be completed. You can start another check.");setPolling(false);return;}
        if(++attempts>=100){setError("The check is taking longer than expected. Try checking the result again later.");setPolling(false);return;}
        timer=setTimeout(()=>void poll(),3000);
      }catch{if(active){setError("Results could not be retrieved. Try checking the result again.");setPolling(false);}}finally{clearTimeout(timeout);}
    };
    void poll();return()=>{active=false;clearTimeout(timer);controller?.abort();};
  },[job,polling]);
  const reset=()=>{generation.current++;submitController.current?.abort();setText("");setConsent(false);setJob(null);setBusy(false);setPolling(false);setResult(null);setError("");};
  const submit=async()=>{
    if(!text.trim()||!consent){setError("Enter text and confirm permission to send it for checking.");return;}
    const current=++generation.current;submitController.current?.abort();const controller=new AbortController();submitController.current=controller;const timeout=setTimeout(()=>controller.abort(),45000);
    setBusy(true);setError("");setResult(null);setJob(null);
    try{const response=await fetch("/api/plagiarism",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,consent:true}),signal:controller.signal});const body=await response.json();if(current!==generation.current)return;
      if(!response.ok){setError(typeof body.error==="string"?body.error:"The check is temporarily unavailable.");return;}
      if(typeof body.jobId!=="string"||typeof body.accessToken!=="string")throw new Error("Invalid check response");
      setJob({jobId:body.jobId,accessToken:body.accessToken,sandbox:body.sandbox===true});setPolling(true);
    }catch{if(current===generation.current)setError("The check could not be started. If you already submitted it, avoid repeated submissions and try later.");}finally{clearTimeout(timeout);if(current===generation.current)setBusy(false);}
  };
  return <div className="space-y-5">
    <p id="plagiarism-privacy">Your text is sent to an external originality checking service. Submit only content you have permission to share. Results identify similarities for review; they do not prove plagiarism or authorship. Scan results expire after 24 hours. Clearing this page does not cancel an already submitted check.</p>
    <Textarea label="Text to check" value={text} onChange={event=>{setText(event.target.value);setResult(null);setError("");}} maxLength={20000} rows={10} disabled={busy||polling} aria-describedby="plagiarism-privacy" />
    <label className="flex items-start gap-3"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} disabled={busy||polling}/><span>I have permission to send this text for originality checking.</span></label>
    <div className="flex flex-wrap gap-3"><Button onClick={()=>void submit()} disabled={busy||polling||!consent||!text.trim()}>{busy?"Submitting…":polling?"Checking…":"Check originality"}</Button><Button variant="secondary" onClick={reset}>Clear check</Button>{job&&!polling&&!result&&<Button variant="secondary" onClick={()=>{setError("");setPolling(true);}}>Check existing result</Button>}</div>
    {error&&<p role="alert">{error}</p>}
    <p role="status" aria-live="polite">{busy?"Submitting your text.":polling?"Your check is in progress. Results will appear here.":result?"Check complete.":""}</p>
    {result&&<div className="space-y-3" data-testid="plagiarism-result">
      {job?.sandbox&&<p role="note">Test result: these are simulated matches and must not be used to judge this text.</p>}
      <p>Text similarity: <strong>{result.score.toFixed(1)}%</strong></p>
      <p>This percentage describes similar words in the sources checked. Review context, quotations and citations yourself. A low score does not prove originality.</p>
      <h3 className="font-semibold">Matched web sources</h3>
      {result.sources.length?<ul className="space-y-2">{result.sources.map((source,index)=><li key={`${index}:${source.url}`}><a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="underline break-all">{source.title||source.url}</a>{source.matchedWords!==undefined&&<span> — {source.matchedWords} matched words</span>}</li>)}</ul>:<p>No linked web sources were returned.</p>}
      {result.sourcesTruncated&&<p>Some source links are omitted or unavailable in this summary.</p>}
      {result.otherSourceCount>0&&<p>{result.otherSourceCount} additional non-web source entries were reported without public links.</p>}
    </div>}
  </div>;
}
export const PlagiarismCheckerTool = PlagiarismTool;
