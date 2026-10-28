import { enforceProviderQuota } from "@/lib/server/provider-quota";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireToolAccess } from "@/lib/server/tool-access";
import { isSameOriginRequest } from "@/lib/server/same-origin";
import { readJsonBody, RequestBodyError } from "@/lib/server/request-body";
import { plagiarismConfig, getPlagiarismProvider, newPlagiarismIdentity, PlagiarismError } from "@/lib/server/plagiarism";
import { createPlagiarismJob, finishPlagiarismJob } from "@/lib/server/plagiarism-jobs";
export const runtime="nodejs";
export async function POST(request: Request){
  const limited=enforceRateLimit(request,"plagiarism-submit",5);if(limited)return limited;
  const reply=(body: unknown,status: number)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
  if(!isSameOriginRequest(request))return reply({error:"Invalid request origin"},403);
  try{
    const body=await readJsonBody(request,96*1024);
    if(typeof body.text!=="string"||!body.text.trim()||body.text.length>20000)return reply({error:"Enter between 1 and 20,000 characters"},400);
    if(body.consent!==true)return reply({error:"Please confirm permission to transmit this text for checking"},400);
    const access=await requireToolAccess("plagiarism-checker",{inputChars:body.text.length});if("response"in access)return access.response;
    const config=plagiarismConfig();if(!config)return reply({error:"Originality checking is temporarily unavailable"},503);
    const quota=await enforceProviderQuota("plagiarism");if(quota)return quota;
    const identity=newPlagiarismIdentity();await createPlagiarismJob(identity.id,identity.tokenHash,config.sandbox);
    try{await getPlagiarismProvider(config).submit(identity.id,body.text,access.status.timeoutMs);}catch(error){await finishPlagiarismJob(identity.id).catch(()=>undefined);throw error;}
    return reply({jobId:identity.id,accessToken:identity.token,state:"pending",sandbox:config.sandbox},202);
  }catch(error){return reply({error:error instanceof RequestBodyError||error instanceof PlagiarismError?error.message:"Originality checking is temporarily unavailable"},error instanceof RequestBodyError||error instanceof PlagiarismError?error.status:503);}
}
