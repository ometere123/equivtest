"use client";
import {useState} from "react";
import Link from "next/link";
import {PageTitle,Refresh,useCounts,useRecent,useRecord,DataMessage,Status} from "@/components/Kit";
import {Conformance,Run,Suite} from "@/lib/schema";
export default function Registry(){
 const [runId,setRunId]=useState("");const [suiteId,setSuiteId]=useState("");const [targetId,setTargetId]=useState("");
 const {counts,refresh}=useCounts();const recent=useRecent<Run>("R",counts?.runs??0,"get_run",30);
 const inspected=useRecord<Conformance>("get_conformance",runId+suiteId+targetId,[runId,suiteId,targetId]);
 return <><PageTitle kicker="05 / Public conformance" title="Certification registry" detail="Read the on-chain conformance status for one exact run, frozen suite and registered target. A certification never proves overall security or real-world truth beyond observed evidence."/>
 <section className="big-card"><h2>Verify certification</h2><div className="two" style={{marginBottom:13}}>
 <div className="field"><label>Run ID</label><input value={runId} onChange={e=>setRunId(e.target.value)} placeholder="R-1"/></div>
 <div className="field"><label>Suite ID</label><input value={suiteId} onChange={e=>setSuiteId(e.target.value)} placeholder="S-1"/></div>
 </div><div className="two"><div className="field"><label>Target ID</label><input value={targetId} onChange={e=>setTargetId(e.target.value)} placeholder="T-1"/></div>
 <div style={{alignSelf:"end"}}><Refresh onClick={()=>void inspected.refresh()}/></div></div>
 {runId&&suiteId&&targetId&&<div className="itemrow" style={{marginTop:20}}><div><div className="itemtitle">{inspected.value?.certified?"Conformance certified":"No matching passing certification"}</div><div className="itemmeta">Exact IDs and frozen suite digest must match.</div>{inspected.value?.suite_digest&&<div className="itemmeta code">{inspected.value.suite_digest}</div>}
 <div className="itemmeta">{inspected.value?.self_test?"Owner-author/initiator overlap disclosed":"Independent test authorship not guaranteed"}</div></div>
 <Status value={inspected.value?.certified?"PASS":"NOT CERTIFIED"}/></div>}
 <DataMessage value={inspected.error}/></section>
 <div style={{marginTop:30}} className="inline"><h2 style={{margin:0}}>Latest public runs</h2><Refresh onClick={()=>{void refresh();void recent.refresh();}}/></div><p className="note">Showing the 30 most recent run IDs. Historical records remain addressable individually.</p>
 <div className="rows" style={{marginTop:20}}>{recent.items.map(r=><div className="itemrow" key={r.id}><div><div className="itemtitle">{r.id} · {r.suite_id} · {r.target_id}</div><div className="itemmeta">Initiator: {r.initiator} · {r.state}</div></div><div className="inline"><Status value={r.outcome}/><button type="button" className="btn btn-outline btn-small" onClick={()=>{setRunId(r.id);setSuiteId(r.suite_id);setTargetId(r.target_id);}}>Verify</button><Link href={"/results?run="+r.id} className="btn btn-outline btn-small">Evidence</Link></div></div>)}
 {!recent.items.length&&<div className="empty">No public runs are available yet.</div>}</div>
 </>;
}
