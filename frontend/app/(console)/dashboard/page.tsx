"use client";
import Link from "next/link";
import {ArrowRight,ShieldCheck,FlaskConical,BookOpenCheck,Boxes} from "lucide-react";
import {PageTitle,DataMessage,Refresh,useCounts,useRecent,Status} from "@/components/Kit";
import {Run} from "@/lib/schema";
export default function Dashboard(){
 const {counts,error,refresh}=useCounts();const {items:runs}=useRecent<Run>("R",counts?.runs??0,"get_run",6);
 return <><PageTitle kicker="Your testing workspace" title="Overview" detail="Track registered contracts, frozen suites and consensus results. All figures are read directly from the public EquivTest contract."/>
 <div className="inline"><Refresh onClick={refresh}/></div><DataMessage value={error}/>
 <div className="grid">{[[Boxes,"Targets",counts?.targets],[BookOpenCheck,"Suites",counts?.suites],[FlaskConical,"Cases",counts?.cases],[ShieldCheck,"Runs",counts?.runs]].map(([Icon,label,value],i)=>{
 const Component=Icon as typeof Boxes;return <div className="card" key={i}><Component size={21} color="#b3edcb"/><div className="metric">{value??"—"}</div><div className="metric-label">{String(label)}</div></div>;
 })}</div>
 <div className="panel-grid"><div className="big-card"><div className="eyebrow">Latest activity</div><h2>Recent test runs</h2>
  <div className="rows" style={{marginTop:20}}>{runs.length?runs.map(r=><Link href={"/results?run="+encodeURIComponent(r.id)} key={r.id} className="itemrow"><div><div className="itemtitle">{r.id} · {r.suite_id}</div><div className="itemmeta">{r.total} semantic cases · {r.state}</div></div><Status value={r.outcome}/></Link>):<div className="empty">No completed or pending test runs found.</div>}</div>
 </div><div className="big-card"><div className="eyebrow">Quick start</div><h2>Prove what your contract promises.</h2><p className="subheading">Register a target that exposes the EquivTest evidence adapter. Define and freeze criteria before capturing real outcomes.</p>
 <div className="actions"><Link className="btn" href="/projects">Register contract <ArrowRight size={14}/></Link><Link className="btn btn-outline" href="/suites">Build suite</Link></div><div className="divider"/><p className="note">A pass certifies one exact suite against captured observations. It is not a general security audit.</p></div></div></>;
}
