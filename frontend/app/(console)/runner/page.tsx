"use client";
import {FormEvent,useEffect,useState} from "react";
import {PageTitle,FormField,Action,DataMessage,MutationStatus,Refresh,useCounts,useMutation,useRecent,useRecord,Status} from "@/components/Kit";
import {readAt} from "@/lib/genlayer";
import {Case,Run,Suite,Target,parseRecord} from "@/lib/schema";
export default function Runner(){
 const [suiteId,setSuiteId]=useState("");const [runId,setRunId]=useState("");const [caseId,setCaseId]=useState("");const [observation,setObservation]=useState("");
 const [method,setMethod]=useState("exercise");const [args,setArgs]=useState('["case-1", true, true, false]');
 const [releaseState,setReleaseState]=useState("ACTIVATED");const [findings,setFindings]=useState("1");const [scope,setScope]=useState("TEST_COHORT");const [dataExposure,setDataExposure]=useState("NONE");const [rollbackReady,setRollbackReady]=useState(true);const [changeSummary,setChangeSummary]=useState("");const [exceptionBasis,setExceptionBasis]=useState("");const [releaseNote,setReleaseNote]=useState("");
 const [position,setPosition]=useState("CONFORMING");const [interpretation,setInterpretation]=useState("");const [citedFact,setCitedFact]=useState("observed.exception_basis");
 const counts=useCounts();
 const suites=useRecent<Suite>("S",counts.counts?.suites??0,"get_suite",30);
 const runs=useRecent<Run>("R",counts.counts?.runs??0,"get_run",30);
 const suite=useRecord<Suite>("get_suite",suiteId);const run=useRecord<Run>("get_run",runId);
 const target=useRecord<Target>("get_target",suite.value?.target_id??"");
 const capture=useMutation(),assessment=useMutation(),open=useMutation(),action=useMutation(),review=useMutation(),close=useMutation();
 const [localError,setLocalError]=useState("");const [targetReadback,setTargetReadback]=useState<Record<string,unknown>|null>(null);
 useEffect(()=>{if(run.value?.suite_id)setSuiteId(run.value.suite_id);},[run.value?.suite_id]);
 async function refreshTargetObservation(){
   if(!target.value?.address||!observation.trim())throw Error("Target observation ID is required for readback.");
   const record=parseRecord<Record<string,unknown>>(await readAt(target.value.address,"get_equivtest_case",[observation.trim()]));
   if(!record||record.observation_id!==observation.trim())throw Error("Target write finalized but public observation readback did not match.");
   setTargetReadback(record);
 }
 async function mutate(state:ReturnType<typeof useMutation>,fn:string,params:unknown[]){
   if(await state.run(fn,params)){
    if(fn==="capture_case"){
     const snapshot=await readAt((process.env.NEXT_PUBLIC_EQUIVTEST_ADDRESS||""),"get_snapshot",[runId,caseId]);
     if(!parseRecord(snapshot))setLocalError("Capture finalized but snapshot state readback was empty.");
    }else if(fn==="evaluate_case"){
      const verdict=await readAt((process.env.NEXT_PUBLIC_EQUIVTEST_ADDRESS||""),"get_verdict",[runId,caseId]);
     if(!parseRecord(verdict))setLocalError("Assessment finalized but verdict state readback was empty.");
    }
    await run.refresh();await runs.refresh();await counts.refresh();
    if(fn==="close_run"){
      const finalRun=await readAt((process.env.NEXT_PUBLIC_EQUIVTEST_ADDRESS||""),"get_run",[runId]);
     const parsed=parseRecord<Run>(finalRun);if(!parsed||parsed.state!=="CLOSED")setLocalError("Close finalized but CLOSED run state was not read back.");
    }
   }
 }
 async function executeAction(e:FormEvent){e.preventDefault();
   try{const parsed:unknown=JSON.parse(args);
    if(!Array.isArray(parsed)||parsed.length>12)throw Error("Arguments must be a JSON array of no more than 12 entries.");
    if(!target.value?.address)throw Error("Choose a suite and target first.");
    if(await action.run(method,parsed,target.value.address)){if(target.value.version==="fixture-adversarial-2"&&observation.trim())await refreshTargetObservation();await run.refresh();}
   }catch(err){setLocalError(err instanceof Error?err.message:String(err));}
 }
 async function publishGuided(e:FormEvent){e.preventDefault();
   if(!target.value?.address||!observation.trim())return;
   if(changeSummary.trim().length<24||exceptionBasis.trim().length<24){setLocalError("Add a bounded change summary and exception basis (at least 24 characters each).");return;}
   if(await action.run("publish_observation",[observation.trim(),releaseState,Number(findings),scope,dataExposure,rollbackReady,changeSummary,exceptionBasis,releaseNote],target.value.address))await refreshTargetObservation();
 }
 async function submitReview(e:FormEvent){e.preventDefault();
   if(!target.value?.address||!observation.trim())return;
   if(interpretation.trim().length<24){setLocalError("Interpretation must explain the materiality or exception reasoning (at least 24 characters).");return;}
   if(await review.run("submit_interpretation",[observation.trim(),position,interpretation,citedFact],target.value.address))await refreshTargetObservation();
 }
 return <><PageTitle kicker="03 / Live verification" title="Test runner" detail="Execute genuine target actions, capture public evidence, request independent GenLayer assessment, then close an entirely evaluated run."/>
 <div className="inline"><Refresh onClick={()=>{void counts.refresh();void suites.refresh();void runs.refresh();void run.refresh();}}/></div>
 <div className="panel-grid"><section className="big-card"><div className="eyebrow">Step 1</div><h2>Open a test run</h2>
  <form className="form" onSubmit={e=>{e.preventDefault();void mutate(open,"open_run",[suiteId]);}}>
  <div className="field"><label>Frozen suite</label><select value={suiteId} onChange={e=>setSuiteId(e.target.value)} required><option value="">Choose a frozen suite…</option>{suites.items.filter(x=>x.frozen).map(s=><option key={s.id} value={s.id}>{s.id} · {s.title}</option>)}</select></div>
  <Action busy={open.busy}>Open run on chain</Action></form><MutationStatus state={open}/>
  <div className="divider"/><h3>Linked recheck</h3><p className="note">After a run closes, a recheck opens a fresh run against the same frozen suite and records its predecessor without changing prior verdicts.</p>
  <button type="button" className="btn btn-outline" disabled={open.busy||!runId||run.value?.state!=="CLOSED"} onClick={()=>void mutate(open,"open_recheck",[runId])}>Recheck closed run</button>
  <p className="note" style={{marginTop:12}}>Read the new run ID from the refreshed list. A global counter alone is not an authenticated ownership receipt.</p>
 </section>
 <section className="big-card"><div className="eyebrow">Step 2</div><h2>Choose an active run</h2>
  <div className="field"><label>Run</label><select value={runId} onChange={e=>setRunId(e.target.value)}><option value="">Choose a run…</option>{runs.items.map(r=><option value={r.id} key={r.id}>{r.id} · {r.suite_id} · {r.state} · {r.outcome}</option>)}</select></div>
  <div className="rows" style={{marginTop:18}}>{run.value?<div className="itemrow"><div><div className="itemtitle">{run.value.id}</div><div className="itemmeta">{run.value.suite_id} · {run.value.total} cases</div></div><Status value={run.value.outcome}/></div>:<div className="empty">Select a run to inspect the on-chain state.</div>}</div>
  {suite.value&&<p className="note" style={{marginTop:15}}>Suite: {suite.value.title}. Target: {target.value?.label??suite.value.target_id}.</p>}
 </section></div>
 <div className="panel-grid"><section className="big-card"><div className="eyebrow">Step 3</div><h2>Exercise target contract</h2>
 {target.value?.version==="fixture-adversarial-2"?<>
 <p className="note">Guided qualitative dispute. Publish an immutable bounded observation with materiality, exception and scope facts, then use two other wallets to submit conflicting interpretations. Wallet separation is an on-chain role check only; it is not proof of real-world authority.</p>
 <form className="form" onSubmit={publishGuided}><FormField label="Observation ID" value={observation} onChange={setObservation} placeholder="release-pass-1"/>
 <div className="field"><label>Public release state</label><select value={releaseState} onChange={e=>setReleaseState(e.target.value)}><option>DEFERRED</option><option>ACTIVATED</option><option>ROLLED_BACK</option></select></div>
 <FormField label="Unresolved critical findings" value={findings} onChange={setFindings} kind="text" placeholder="0"/>
 <div className="field"><label>Affected scope</label><select value={scope} onChange={e=>setScope(e.target.value)}><option>TEST_COHORT</option><option>SHARED_AUTH</option><option>PRODUCTION_USERS</option><option>UNKNOWN</option></select></div>
 <div className="field"><label>Customer-data exposure</label><select value={dataExposure} onChange={e=>setDataExposure(e.target.value)}><option>NONE</option><option>POSSIBLE</option><option>CONFIRMED</option><option>UNKNOWN</option></select></div>
 <label className="check"><input type="checkbox" checked={rollbackReady} onChange={e=>setRollbackReady(e.target.checked)}/> Rollback is ready and publicly bounded</label>
 <FormField label="Change summary (bounded public fact)" value={changeSummary} onChange={setChangeSummary} kind="textarea" rows={3} placeholder="Describe the affected boundary and who can receive the change."/>
 <FormField label="Exception basis (bounded public fact)" value={exceptionBasis} onChange={setExceptionBasis} kind="textarea" rows={3} placeholder="Explain why a narrowly documented exception should or should not apply."/>
 <FormField label="Release note (bounded public fact)" value={releaseNote} onChange={setReleaseNote} placeholder="Recorded public behavior"/>
 <Action busy={action.busy}>Publish immutable observation</Action></form>
 <MutationStatus state={action}/><div className="divider"/><h3>Submit this wallet&apos;s interpretation</h3>
 <form className="form" onSubmit={submitReview}><div className="field"><label>Interpretation</label><select value={position} onChange={e=>setPosition(e.target.value)}><option>CONFORMING</option><option>NONCONFORMING</option><option>UNCERTAIN</option></select></div>
 <FormField label="Natural-language interpretation" value={interpretation} onChange={setInterpretation} kind="textarea" rows={3} placeholder="Explain how the frozen requirement applies."/>
 <div className="field"><label>Cited public field</label><select value={citedFact} onChange={e=>setCitedFact(e.target.value)}><option>observed.exception_basis</option><option>observed.affected_scope</option><option>observed.data_exposure</option><option>observed.rollback_ready</option><option>observed.change_summary</option><option>observed.unresolved_critical_findings</option></select></div>
 <Action busy={review.busy}>Submit independent interpretation</Action></form><MutationStatus state={review}/></>:<>
 <p className="note">Send an actual target write. This compatible target exposes its own method. Supply its real method and JSON calldata arguments; this is not a source-code runner.</p>
 <form className="form" onSubmit={executeAction}><FormField label="Target write method" value={method} onChange={setMethod} placeholder="exercise"/>
 <FormField label="JSON argument array" kind="textarea" rows={3} value={args} onChange={setArgs} placeholder='["case-1",true,true,false]'/>
 <Action busy={action.busy}>Sign target action</Action></form><DataMessage value={localError}/><MutationStatus state={action}/></>}
 <div className="divider"/><div className="eyebrow">Step 4</div><h2>Capture evidence</h2><form className="form" onSubmit={e=>{e.preventDefault();void mutate(capture,"capture_case",[runId,caseId,observation]);}}>
 <div className="field"><label>Case from selected suite</label><select value={caseId} onChange={e=>setCaseId(e.target.value)} required><option value="">Choose a case…</option>{suite.value?.case_ids.map(id=><option key={id} value={id}>{id}</option>)}</select></div>
 <FormField label="Target observation ID" value={observation} onChange={setObservation} placeholder="case-1"/>
 <Action busy={capture.busy}>Capture target view</Action></form><MutationStatus state={capture}/>
 {targetReadback&&<details style={{marginTop:14}}><summary className="note" style={{cursor:"pointer",color:"#b3edcb"}}>Verified target public-view readback</summary><pre className="note code" style={{overflowX:"auto",marginTop:10}}>{JSON.stringify(targetReadback,null,2)}</pre></details>}
 </section>
 <section className="big-card"><div className="eyebrow">Step 5</div><h2>Independent assessment</h2><p className="note">The case must have captured evidence before validators can compare it against the frozen requirement. Finalization alone does not prove successful execution.</p>
 <div className="actions"><button className="btn" disabled={assessment.busy||!runId||!caseId} onClick={()=>void mutate(assessment,"evaluate_case",[runId,caseId])}>Evaluate {caseId||"case"} by consensus</button></div><MutationStatus state={assessment}/>
 <div className="divider"/><div className="eyebrow">Step 6</div><h2>Close the run</h2><p className="note">Closing checks that every case has a consensus-backed verdict. Failing and uncertain cases are never converted into a passing suite.</p>
 <div className="actions"><button className="btn btn-outline" disabled={!runId||close.busy} onClick={()=>void mutate(close,"close_run",[runId])}>Finalize suite outcome</button></div><MutationStatus state={close}/>
 {suite.value&&<div style={{marginTop:20}}><h3>Cases to assess</h3><div className="rows">{suite.value.case_ids.map(id=><button type="button" key={id} className="itemrow" onClick={()=>setCaseId(id)}><span className="itemtitle">{id}</span><span className="note">{id===caseId?"Selected":"Select case"}</span></button>)}</div></div>}
 </section></div></>;
}
