"use client";
import {useCallback,useEffect,useId,useState} from "react";
import {ADDRESS,PendingReadback,readRecord,submit,writeApp} from "@/lib/genlayer";
import {useWallet} from "@/components/WalletProvider";
import {explorerTx,presentError,Counts} from "@/lib/schema";
import {CheckCircle2,ExternalLink,Loader2,RefreshCw} from "lucide-react";
export function PageTitle({kicker,title,detail}:{kicker:string;title:string;detail:string}){
 return <><div className="eyebrow">{kicker}</div><h1>{title}</h1><p className="subheading">{detail}</p></>;
}
export function DataMessage({value,type="error"}:{value:string;type?:"error"|"success"}){
 return value?<div className={type==="error"?"alert":"success"} role={type==="error"?"alert":"status"}>{value}</div>:null;
}
export function FormField({label,value,onChange,placeholder,kind="text",required=true,rows=3}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;kind?:"text"|"textarea";required?:boolean;rows?:number}){
 const id=useId();
 return <div className="field"><label htmlFor={id}>{label}</label>{kind==="textarea"?<textarea id={id} required={required} rows={rows} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/>:<input id={id} required={required} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/>}</div>;
}
export function useMutation(){
 const {account}=useWallet(); const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [hash,setHash]=useState("");const [done,setDone]=useState("");
 const readbackFor=useCallback((method:string,args:unknown[],targetAddress?:string):PendingReadback|undefined=>{
   if(targetAddress&&(method==="publish_observation"||method==="submit_interpretation"))return {address:targetAddress,method:"get_equivtest_case",args:[args[0]],expected:{observation_id:String(args[0])}};
   if(targetAddress)return undefined;
   if(method==="capture_case")return {address:ADDRESS,method:"get_snapshot",args:[args[0],args[1]],expected:{run_id:String(args[0]),case_id:String(args[1])}};
   if(method==="evaluate_case")return {address:ADDRESS,method:"get_verdict",args:[args[0],args[1]],expected:{run_id:String(args[0]),case_id:String(args[1])}};
   if(method==="close_run")return {address:ADDRESS,method:"get_run",args:[args[0]],expected:{id:String(args[0]),state:"CLOSED"}};
   if(method==="freeze_suite")return {address:ADDRESS,method:"get_suite",args:[args[0]],expected:{id:String(args[0]),frozen:"true"}};
   return {address:ADDRESS,method:"get_counts",args:[]};
 },[]);
 const run=useCallback(async(method:string,args:unknown[],targetAddress?:string)=>{
   if(!account){setError("Connect your EIP-1193 wallet first.");return false;}
   setBusy(true);setError("");setDone("");setHash("");
   try{const readback=readbackFor(method,args,targetAddress);const h=targetAddress?await submit(targetAddress,account,method,args,setHash,readback):await writeApp(account,method,args,setHash,readback);
     setDone(method+" executed successfully. Finalized transaction: "+h);return true;
   }catch(e){setError(presentError(e));return false;}finally{setBusy(false);}
 },[account]);
 return {run,busy,error,hash,done,clear:()=>{setError("");setDone("");}};
}
export function MutationStatus({state}:{state:ReturnType<typeof useMutation>}){
 return <div className="rows" style={{marginTop:12}}>{state.busy&&<div className="note inline"><Loader2 size={14}/> Processing wallet and protocol finalisation… Consensus may take several minutes; keep this tab open. If interrupted, use the recovery banner.</div>}
   <DataMessage value={state.error}/><DataMessage value={state.done} type="success"/>
   {state.hash&&<div className="note code">Transaction: <a href={explorerTx(state.hash)} target="_blank" rel="noreferrer">{state.hash} <ExternalLink size={12} style={{display:"inline"}}/></a></div>}</div>;
}
export function Action({children,busy}:{children:React.ReactNode;busy:boolean}){return <button type="submit" className="btn" disabled={busy}>{busy?<Loader2 size={14}/>:<CheckCircle2 size={14}/>} {children}</button>;}
export function Refresh({onClick}:{onClick:()=>void}){return <button className="btn btn-outline btn-small" type="button" onClick={onClick}><RefreshCw size={13}/> Refresh</button>;}
export function useCounts(){
 const [counts,setCounts]=useState<Counts|null>(null);const [error,setError]=useState("");
 const refresh=useCallback(async()=>{try{setError("");setCounts(await readRecord<Counts>("get_counts"));}catch(e){setError(presentError(e));}},[]);
 useEffect(()=>{void refresh();},[refresh]);return {counts,error,refresh};
}
export function useRecord<T>(method:string,id:string,args?:string[]){
 const [value,setValue]=useState<T|null>(null);const [error,setError]=useState("");
 const refresh=useCallback(async()=>{if(!id){setValue(null);return;}
   try{setError("");setValue(await readRecord<T>(method,args??[id]));}catch(e){setError(presentError(e));}},[method,id,JSON.stringify(args)]);
 useEffect(()=>{void refresh();},[refresh]);return {value,error,refresh};
}
export function useRecent<T>(prefix:string,count:number,method:string,limit=30){
 const [items,setItems]=useState<T[]>([]);const [error,setError]=useState(""); const [pending,setPending]=useState(false);
 const refresh=useCallback(async()=>{if(!count){setItems([]);return;}setPending(true);
  try{setError("");const start=Math.max(1,count-limit+1);
    const result: T[]=[];
    for(let index=count;index>=start;index-=5){
      const ids=Array.from({length:Math.min(5,index-start+1)},(_,i)=>prefix+"-"+(index-i));
      const group=await Promise.all(ids.map(id=>readRecord<T>(method,[id])));
      for(const row of group){if(row!==null)result.push(row as T);}
    }setItems(result);
  }catch(e){setError(presentError(e));}finally{setPending(false);}
 },[prefix,count,method,limit]);
 useEffect(()=>{void refresh();},[refresh]);return {items,error,refresh,pending};
}
export function Status({value}:{value:string}){return <span className={"tag "+(value==="FAIL"?"fail":value==="INCONCLUSIVE"?"inconclusive":"")}>{value}</span>;}
