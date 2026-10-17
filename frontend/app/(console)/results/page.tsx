"use client";
import {Suspense,useState} from "react";
import {useSearchParams} from "next/navigation";
import {DataMessage,PageTitle,Refresh,Status,useRecord} from "@/components/Kit";
import {Case,Run,Snapshot,Suite,Verdict,short} from "@/lib/schema";
function ResultsInner(){
 const params=useSearchParams();const [id,setId]=useState(params.get("run")??"");
 const {value:run,error,refresh}=useRecord<Run>("get_run",id);
 const suite=useRecord<Suite>("get_suite",run?.suite_id??"");
 return <><PageTitle kicker="04 / Evidence history" title="Results explorer" detail="Inspect immutable verdict records and the exact frozen evidence each finding references. An execution error is not a semantic verdict."/>
 <div className="inline"><div className="field" style={{minWidth:230}}><label>Run identifier</label><input value={id} onChange={e=>setId(e.target.value)} placeholder="R-1"/></div><Refresh onClick={()=>{void refresh();void suite.refresh();}}/></div>
 <DataMessage value={error}/><div className="grid">{[["Run state",run?.state??"—"],["Outcome",run?.outcome??"—"],["Pass",run?.pass??"—"],["Fail",run?.fail??"—"]].map(([k,v])=><div className="card" key={k}><div className="metric-label">{k}</div><div className="metric" style={{fontSize:24}}>{v}</div></div>)}</div>
 {run&&<div className="big-card"><h2>{run.id} · {run.suite_id}</h2><div className="note code">Initiator: {short(run.initiator,12)} · Target: {run.target_id} · Suite digest: {run.suite_digest}</div>
 <p className="note">Passing {run.pass}, failing {run.fail}, inconclusive {run.inconclusive}, total {run.total}. Counts are final only when the run is CLOSED.</p></div>}
 {suite.value&&<div style={{marginTop:25}}><h2>Case-by-case findings</h2><div className="rows">{suite.value.case_ids.map(c=><ResultCard key={c} runId={id} caseId={c}/>)}</div></div>}
 {!run&&<div className="empty" style={{marginTop:20}}>Enter an existing run ID to read its public results.</div>}</>;
}
function ResultCard({runId,caseId}:{runId:string;caseId:string}){
 const verdict=useRecord<Verdict>("get_verdict",runId+"/"+caseId,[runId,caseId]);
 const snapshot=useRecord<Snapshot>("get_snapshot",runId+"/"+caseId,[runId,caseId]);
 const detail=useRecord<Case>("get_case",caseId);
 return <article className="big-card"><div className="inline" style={{justifyContent:"space-between"}}><div><h3 style={{marginBottom:4}}>{detail.value?.title??caseId}</h3><div className="note">{caseId} · {detail.value?.severity}</div></div><Status value={verdict.value?.verdict??"NOT ASSESSED"}/></div>
 <p className="note" style={{marginTop:18}}>{detail.value?.requirement}</p>
 {verdict.value?<><div className="divider"/><div className="eyebrow">{verdict.value.reason_code}</div><p style={{lineHeight:1.7,fontSize:13}}>{verdict.value.summary}</p><div className="note">Failed: {verdict.value.failed_criteria.join(", ")||"none"} · References: {verdict.value.evidence_refs.join(", ")||"none"}</div></>:<p className="note">No finalized semantic assessment has been stored.</p>}
 {snapshot.value&&<details style={{marginTop:20}}><summary className="note" style={{cursor:"pointer",color:"#b3edcb"}}>Inspect captured target evidence</summary><div className="divider"/><div className="note code">Provenance: {snapshot.value.provenance} · SHA-256: {snapshot.value.evidence_digest}</div><pre className="note code" style={{overflowX:"auto",marginTop:15,padding:18,background:"#071018",borderRadius:8}}>{JSON.stringify(snapshot.value.evidence,null,2)}</pre></details>}
 </article>;
}
export default function Results(){return <Suspense fallback={<div className="note">Loading results…</div>}><ResultsInner/></Suspense>;}
