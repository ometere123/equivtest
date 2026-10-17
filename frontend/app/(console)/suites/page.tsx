"use client";
import {FormEvent,useState} from "react";
import {useSearchParams} from "next/navigation";
import {Suspense} from "react";
import {PageTitle,FormField,Action,DataMessage,MutationStatus,Refresh,useCounts,useMutation,useRecent,useRecord,Status} from "@/components/Kit";
import {Suite,Case} from "@/lib/schema";
function SuitesMain(){
 const params=useSearchParams();const [target,setTarget]=useState(params.get("target")??"");
 const [name,setName]=useState("");const [description,setDescription]=useState("");const [supersedes,setSupersedes]=useState("");
 const [suiteId,setSuiteId]=useState("");const [caseTitle,setCaseTitle]=useState("");const [requirement,setRequirement]=useState("");const [criteria,setCriteria]=useState("");const [severity,setSeverity]=useState("HIGH");
 const create=useMutation(),add=useMutation(),freeze=useMutation();const {counts,refresh}=useCounts();const recent=useRecent<Suite>("S",counts?.suites??0,"get_suite");
 const detail=useRecord<Suite>("get_suite",suiteId);
 async function onCreate(e:FormEvent){e.preventDefault();if(await create.run("create_suite",[target,name,description,supersedes])){setName("");setDescription("");await refresh();}}
 async function onAdd(e:FormEvent){e.preventDefault();if(await add.run("add_case",[suiteId,caseTitle,requirement,criteria,severity])){setCaseTitle("");setRequirement("");setCriteria("");await detail.refresh();await refresh();}}
 async function onFreeze(){if(await freeze.run("freeze_suite",[suiteId])){await detail.refresh();await recent.refresh();}}
 return <><PageTitle kicker="02 / Define expectations" title="Test suites" detail="Author requirements and criteria before executing tests. A frozen suite is immutable; later requirements must use a new suite linked to the previous ID."/>
 <div className="panel-grid"><section className="big-card"><h2>Create suite</h2><form onSubmit={onCreate} className="form">
 <FormField label="Registered target ID" value={target} onChange={setTarget} placeholder="T-1"/>
 <FormField label="Suite title" value={name} onChange={setName} placeholder="Milestone integrity"/>
 <FormField label="Description" kind="textarea" value={description} onChange={setDescription} placeholder="What behavioural promises does this suite evaluate?"/>
 <FormField label="Supersedes suite ID (blank for new)" required={false} value={supersedes} onChange={setSupersedes} placeholder="S-2"/>
 <div className="actions"><Action busy={create.busy}>Create draft suite</Action></div></form><MutationStatus state={create}/></section>
 <section className="big-card"><div className="inline" style={{justifyContent:"space-between"}}><h2>Suites</h2><Refresh onClick={()=>{void refresh();void recent.refresh();}}/></div><DataMessage value={recent.error}/>
 <div className="rows">{recent.items.map(s=><button type="button" className="itemrow" key={s.id} onClick={()=>setSuiteId(s.id)} style={{textAlign:"left",borderColor:s.id===suiteId?"#a3e4c3":undefined}}><div><div className="itemtitle">{s.title}</div><div className="itemmeta">{s.id} · {s.target_id} · {s.case_ids.length} cases</div></div><Status value={s.frozen?"FROZEN":"DRAFT"}/></button>)}
 {!recent.items.length&&<div className="empty">Create a suite against a registered target.</div>}</div></section></div>
 <div className="panel-grid"><section className="big-card"><h2>Define a semantic case</h2><p className="note">Select a draft suite by clicking it above, or supply an ID below.</p>
 <form className="form" onSubmit={onAdd}>
 <FormField label="Suite ID" value={suiteId} onChange={setSuiteId} placeholder="S-1"/>
 <FormField label="Case title" value={caseTitle} onChange={setCaseTitle} placeholder="Open material challenges block completion"/>
 <FormField label="Requirement" kind="textarea" value={requirement} onChange={setRequirement} placeholder="The contract must never complete an unresolved materially challenged milestone."/>
 <FormField label="Acceptance criteria" kind="textarea" value={criteria} onChange={setCriteria} placeholder="A completed milestone and open material challenge are a contradiction. Missing challenge materiality is inconclusive."/>
 <div className="field"><label>Severity</label><select value={severity} onChange={e=>setSeverity(e.target.value)}>{["LOW","MEDIUM","HIGH","CRITICAL"].map(x=><option key={x}>{x}</option>)}</select></div>
 <div className="actions"><Action busy={add.busy}>Add case</Action></div></form><MutationStatus state={add}/></section>
 <section className="big-card"><h2>Selected suite</h2><DataMessage value={detail.error}/>{detail.value?<><div className="itemrow"><div><div className="itemtitle">{detail.value.title}</div><div className="itemmeta code">ID {detail.value.id} · owner {detail.value.owner}</div></div><Status value={detail.value.frozen?"FROZEN":"DRAFT"}/></div>
 <p className="note" style={{marginTop:16}}>{detail.value.description}</p><div className="code note">Digest: {detail.value.digest||"Not frozen"}</div>
 <div className="divider"/><h3>Case IDs</h3><div className="rows">{detail.value.case_ids.map(id=><CaseDetail key={id} id={id}/>)}</div>
 {!detail.value.frozen&&<div className="actions"><button className="btn" onClick={onFreeze} disabled={freeze.busy||!detail.value.case_ids.length}>Freeze suite permanently</button></div>}
 <MutationStatus state={freeze}/></>:<div className="empty">Select a suite to inspect its cases and freeze it.</div>}</section></div></>;
}
function CaseDetail({id}:{id:string}){const {value}=useRecord<Case>("get_case",id);return <div className="itemrow"><div><div className="itemtitle">{value?.title??id}</div><div className="itemmeta">{id} · {value?.severity??"Loading"}</div><div className="itemmeta">{value?.requirement}</div></div></div>;}
export default function Suites(){return <Suspense fallback={<div className="note">Loading suites…</div>}><SuitesMain/></Suspense>;}
