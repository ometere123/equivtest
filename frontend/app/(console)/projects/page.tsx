"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
import {PageTitle,FormField,Action,DataMessage,MutationStatus,Refresh,useCounts,useMutation,useRecent} from "@/components/Kit";
import {Target,isAddress,short} from "@/lib/schema";
export default function Projects(){
 const [address,setAddress]=useState("");const [label,setLabel]=useState(""); const state=useMutation();
 const {counts,refresh}=useCounts();const recent=useRecent<Target>("T",counts?.targets??0,"get_target");
 async function handle(e:FormEvent){e.preventDefault();if(!isAddress(address))return; if(await state.run("register_target",[address,label])){setAddress("");setLabel("");await refresh();}}
 return <><PageTitle kicker="01 / Target registry" title="Projects" detail="Register genuine GenLayer contracts with a public evidence interface. Registration identifies the signer, but does not imply code ownership or publisher authenticity."/>
 <div className="panel-grid"><section className="big-card"><h2>Register a target</h2><p className="note">The target must implement get_equivtest_manifest() and get_equivtest_case(observation_id).</p>
 <form className="form" onSubmit={handle}><FormField label="Target contract address" value={address} onChange={setAddress} placeholder="0x… (StudioNet 61999)"/><FormField label="Display name" value={label} onChange={setLabel} placeholder="Milestone resolver"/>
 <div className="actions"><Action busy={state.busy}>Verify adapter and register</Action></div></form><MutationStatus state={state}/></section>
 <section className="big-card"><div className="inline" style={{justifyContent:"space-between"}}><h2>Registered targets</h2><Refresh onClick={()=>{void refresh();void recent.refresh();}}/></div><DataMessage value={recent.error}/>
 <div className="rows">{recent.items.length?recent.items.map(t=><div key={t.id} className="itemrow"><div><div className="itemtitle">{t.label}</div><div className="itemmeta">{t.id} · {t.version}</div><div className="itemmeta code">{short(t.address,10)}</div></div><Link className="btn btn-outline btn-small" href={"/suites?target="+t.id}>Test</Link></div>):<div className="empty">No target registrations to show.</div>}</div>
 <p className="note">Showing up to 30 recent targets. Older IDs can still be queried through public contract reads.</p></section></div></>;
}
