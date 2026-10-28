import { plagiarismConfig, authorizedPlagiarismWebhook, parsePlagiarismCompletion, PlagiarismError } from "@/lib/server/plagiarism";
import { finishPlagiarismJob } from "@/lib/server/plagiarism-jobs";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { readJsonBody, RequestBodyError } from "@/lib/server/request-body";
export const runtime="nodejs";
export async function POST(request: Request,context: {params: Promise<{jobId: string;status: string}>}){
  const reply=(body: unknown,status: number)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
  const config=plagiarismConfig();if(!config||!authorizedPlagiarismWebhook(request.headers.get("x-plagiarism-webhook-secret"),config.webhookSecret))return reply({error:"Unauthorized"},401);
  const limited=enforceRateLimit(request,"plagiarism-webhook",60);if(limited)return limited;
  const {jobId,status}=await context.params;if(!/^[a-f0-9]{32}$/.test(jobId)||!["completed","error","creditsChecked","indexed"].includes(status))return reply({error:"Invalid callback"},400);
  try{
    const body=await readJsonBody(request,1024*1024);
    if(status==="completed")await finishPlagiarismJob(jobId,parsePlagiarismCompletion(body,jobId));
    else if(status==="error")await finishPlagiarismJob(jobId);
    return reply({accepted:true},200);
  }catch(error){return reply({error:error instanceof RequestBodyError||error instanceof PlagiarismError?error.message:"Callback temporarily unavailable"},error instanceof RequestBodyError||error instanceof PlagiarismError?error.status:503);}
}
