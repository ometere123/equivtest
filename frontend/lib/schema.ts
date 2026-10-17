export type Target={id:string;address:string;label:string;version:string;schema:string;registrant:string};
export type Suite={id:string;target_id:string;title:string;description:string;owner:string;supersedes:string;case_ids:string[];frozen:boolean;digest:string};
export type Case={id:string;suite_id:string;title:string;requirement:string;criteria:string;severity:"LOW"|"MEDIUM"|"HIGH"|"CRITICAL"};
export type Run={id:string;suite_id:string;target_id:string;initiator:string;state:"OPEN"|"CLOSED";total:number;pass:number;fail:number;inconclusive:number;outcome:"PENDING"|"PASS"|"FAIL"|"INCONCLUSIVE";suite_digest:string;recheck_of?:string};
export type Snapshot={run_id:string;case_id:string;suite_id?:string;target_id?:string;observation_id:string;target_address:string;target_version:string;suite_digest:string;evidence:Record<string,unknown>;evidence_digest:string;provenance:string;captured_by:string};
export type Verdict={run_id:string;case_id:string;verdict:"PASS"|"FAIL"|"INCONCLUSIVE";reason_code:string;failed_criteria:string[];evidence_refs:string[];summary:string;evidence_digest:string;suite_digest:string};
export type Counts={targets:number;suites:number;cases:number;runs:number};
export type Conformance={certified:boolean;reason?:string;run_id?:string;suite_id?:string;target_id?:string;suite_digest?:string;outcome?:string;self_test?:boolean;author?:string};
export const short=(value:string,n=7)=>value?value.length>n*2?value.slice(0,n)+"…"+value.slice(-n):value:"—";
export const isAddress=(value:string)=>/^0x[\da-fA-F]{40}$/.test(value);
export const isId=(v:string,kind:string)=>new RegExp("^"+kind+"-[1-9][0-9]*$").test(v);
export const parseRecord=<T>(value:unknown):T|null=>{
  if(value===null || value===undefined || value==="") return null;
  try{
    const parsed=typeof value==="string"?JSON.parse(value):value;
    return parsed && typeof parsed==="object" && !Array.isArray(parsed)?parsed as T:null;
  }catch{return null;}
};
export const presentError=(error:unknown)=>error instanceof Error?error.message:String(error);
export const explorerTx=(hash:string)=>"https://explorer-studio.genlayer.com/tx/"+encodeURIComponent(hash);
