import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireToolAccess } from "@/lib/server/tool-access";
import { readPlagiarismJob } from "@/lib/server/plagiarism-jobs";
export const runtime="nodejs";
export async function GET(request: Request,context: {params: Promise<{jobId: string}>}){
  const limited=enforceRateLimit(request,"plagiarism-poll",120);if(limited)return limited;
  const reply=(body: unknown,status: number)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
  const {jobId}=await context.params;const token=request.headers.get("authorization")?.replace(/^Bearer /,"")||"";
  if(!/^[a-f0-9]{32}$/.test(jobId)||! /^[A-Za-z0-9_-]{43}$/.test(token))return reply({error:"Check not found or expired"},404);
  const access=await requireToolAccess("plagiarism-checker");if("response"in access)return access.response;
  try{const job=await readPlagiarismJob(jobId,token);return job?reply(job,200):reply({error:"Check not found or expired"},404);}catch{return reply({error:"Results are temporarily unavailable"},503);}
}
