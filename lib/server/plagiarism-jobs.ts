import { getDb, isMongoConfigured } from "../db";
import { type PlagiarismResult, PlagiarismError, validPlagiarismToken } from "./plagiarism";
export interface PlagiarismJob { _id: string; tokenHash: string; state: "pending"|"completed"|"error"; sandbox: boolean; createdAt: Date; expiresAt: Date; result?: PlagiarismResult }
let indexReady: Promise<void>|undefined;
async function collection(){
  if(!isMongoConfigured())throw new PlagiarismError("Originality checking is temporarily unavailable",503);
  const db=await getDb();const jobs=db.collection<PlagiarismJob>("plagiarism_jobs");
  if(!indexReady)indexReady=jobs.createIndex({expiresAt:1},{expireAfterSeconds:0,timeoutMS:5000}).then(()=>undefined).catch(error=>{indexReady=undefined;throw error;});
  await indexReady;return jobs;
}
export async function createPlagiarismJob(id: string,tokenHash: string,sandbox: boolean){const jobs=await collection();await jobs.insertOne({_id:id,tokenHash,state:"pending",sandbox,createdAt:new Date(),expiresAt:new Date(Date.now()+24*60*60*1000)},{timeoutMS:5000});}
export async function readPlagiarismJob(id: string,token: string){const jobs=await collection();const job=await jobs.findOne({_id:id,expiresAt:{$gt:new Date()}},{timeoutMS:5000});if(!job||!validPlagiarismToken(token,job.tokenHash))return null;return {state:job.state,sandbox:job.sandbox,...(job.result?{result:job.result}:{})};}
export async function finishPlagiarismJob(id: string,result?: PlagiarismResult){const jobs=await collection();return jobs.updateOne({_id:id,state:"pending",expiresAt:{$gt:new Date()}},{$set:{state:result?"completed":"error",...(result?{result}:{})}},{timeoutMS:5000});}
