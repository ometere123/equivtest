"use client";
import {useState} from "react";
import Link from "next/link";
import {PageTitle,Refresh,useCounts,useRecent,useRecord,DataMessage,Status} from "@/components/Kit";
import {Conformance,Run} from "@/lib/schema";
export default function Registry(){
 const [runId,setRunId]=useState("");
 const {counts,refresh}=useCounts();const recent=useRecent<Run>("R",counts?.runs??0,"get_run",30);
 const selected=recent.items.find(item=>item.id===runId);const suiteId=selected?.suite_id??"";const targetId=selected?.target_id??"";
 const inspected=useRecord<Conformance>("get_conformance",runId&&suiteId&&targetId?runId+"/"+suiteId+"/"+targetId:"",[runId,suiteId,targetId]);
 return <><PageTitle kicker="05 / Public conformance" title="Certification registry" detail="Read the on-chain conformance status for one exact run, frozen suite and registered target. A certification never proves overall security or real-world truth beyond observed evidence."/>
 <section className="big-card"><h2>Verify certification</h2><div className="two" style={{marginBottom:13}}>
 <div className="field"><label>Exact public run</label><select value={runId} onChange={e=>setRunId(e.target.value)}><option value="">Choose a run…</option>{recent.items.map(r=><option key={r.id} value={r.id}>{r.id} · {r.suite_id} · {r.target_id} · {r.outcome}</option>)}</select></div>
 <div className="field"><label>Bound suite / target</label><div className="note code" style={{minHeight:43,padding:12}}>{suiteId&&targetId?suiteId+" / "+targetId:"Select a run to load exact bindings."}</div></div>
 </div><div className="two"><div className="note">The registry derives the suite and target from the selected run and queries the exact tuple on chain.</div>
 <div style={{alignSelf:"end"}}><Refresh onClick={()=>{void refresh();void recent.refresh();void inspected.refresh();}}/></div></div>
 {runId&&suiteId&&targetId&&<div className="itemrow" style={{marginTop:20}}><div><div className="itemtitle">{inspected.value?.certified?"Conformance certified":"No matching passing certification"}</div><div className="itemmeta">Exact IDs and frozen suite digest must match.</div>{inspected.value?.suite_digest&&<div className="itemmeta code">{inspected.value.suite_digest}</div>}
 <div className="itemmeta">{inspected.value?.reason??"Exact IDs and frozen suite digest must match."}</div>
  <div className="itemmeta">{inspected.value?.independent?"Independent tester and role bindings verified":"Role independence is not certified"}</div>
  <div className="itemmeta">{inspected.value?.independence_scope??"ON_CHAIN_ROLE_SEPARATION_ONLY"} · real-world authority not attested</div></div>
 <Status value={inspected.value?.certified?"PASS":"NOT CERTIFIED"}/></div>}
 <DataMessage value={inspected.error}/></section>
 <div style={{marginTop:30}} className="inline"><h2 style={{margin:0}}>Latest public runs</h2><Refresh onClick={()=>{void refresh();void recent.refresh();}}/></div><p className="note">Showing the 30 most recent run IDs. Historical records remain addressable individually.</p>
 <div className="rows" style={{marginTop:20}}>{recent.items.map(r=><div className="itemrow" key={r.id}><div><div className="itemtitle">{r.id} · {r.suite_id} · {r.target_id}</div><div className="itemmeta">Initiator: {r.initiator} · {r.state}</div></div><div className="inline"><Status value={r.outcome}/><button type="button" className="btn btn-outline btn-small" onClick={()=>setRunId(r.id)}>Verify</button><Link href={"/results?run="+r.id} className="btn btn-outline btn-small">Evidence</Link></div></div>)}
 {!recent.items.length&&<div className="empty">No public runs are available yet.</div>}</div>
 </>;
}
