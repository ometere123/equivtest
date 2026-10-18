"use client";
import {FormEvent,useEffect,useState} from "react";
import {PageTitle,FormField,Action,DataMessage,MutationStatus,Refresh,useCounts,useMutation,useRecent,useRecord,Status} from "@/components/Kit";
import {Case,Run,Suite,Target} from "@/lib/schema";
export default function Runner(){
 const [suiteId,setSuiteId]=useState("");const [runId,setRunId]=useState("");const [caseId,setCaseId]=useState("");const [observation,setObservation]=useState("");
 const [method,setMethod]=useState("exercise");const [args,setArgs]=useState('["case-1", true, true, false]');
 const [releaseState,setReleaseState]=useState("DEFERRED");const [findings,setFindings]=useState("0");const [releaseNote,setReleaseNote]=useState("");
 const [position,setPosition]=useState("CONFORMING");const [interpretation,setInterpretation]=useState("");const [citedFact,setCitedFact]=useState("observed.release_state");
 const counts=useCounts();
 const suites=useRecent<Suite>("S",counts.counts?.suites??0,"get_suite",30);
 const runs=useRecent<Run>("R",counts.counts?.runs??0,"get_run",30);
 const suite=useRecord<Suite>("get_suite",suiteId);const run=useRecord<Run>("get_run",runId);
 const target=useRecord<Target>("get_target",suite.value?.target_id??"");
 const capture=useMutation(),assessment=useMutation(),open=useMutation(),action=useMutation(),review=useMutation(),close=useMutation();
 useEffect(()=>{if(run.value?.suite_id)setSuiteId(run.value.suite_id);},[run.value?.suite_id]);
 async function mutate(state:ReturnType<typeof useMutation>,fn:string,params:unknown[]){
   if(await state.run(fn,params)){await run.refresh();await runs.refresh();await counts.refresh();}
 }
 async function executeAction(e:FormEvent){e.preventDefault();
   try{const parsed:unknown=JSON.parse(args);
    if(!Array.isArray(parsed)||parsed.length>12)throw Error("Arguments must be a JSON array of no more than 12 entries.");
    if(!target.value?.address)throw Error("Choose a suite and target first.");
    if(await action.run(method,parsed,target.value.address)){await run.refresh();}
   }catch(err){setLocalError(err instanceof Error?err.message:String(err));}
 }
 async function publishGuided(e:FormEvent){e.preventDefault();
   if(!target.value?.address||!observation.trim())return;
   await action.run("publish_observation",[observation.trim(),releaseState,Number(findings),releaseNote],target.value.address);
 }
 async function submitReview(e:FormEvent){e.preventDefault();
   if(!target.value?.address||!observation.trim())return;
   await review.run("submit_interpretation",[observation.trim(),position,interpretation,citedFact],target.value.address);
 }
 const [localError,setLocalError]=useState("");
 return <><PageTitle kicker="03 / Live verification" title="Test runner" detail="Execute genuine target actions, capture public evidence, request independent GenLayer assessment, then close an entirely evaluated run."/>
 <div className="inline"><Refresh onClick={()=>{void counts.refresh();void suites.refresh();void runs.refresh();void run.refresh();}}/></div>
 <div className="panel-grid"><section className="big-card"><div className="eyebrow">Step 1</div><h2>Open a test run</h2>
  <form className="form" onSubmit={e=>{e.preventDefault();void mutate(open,"open_run",[suiteId]);}}>
  <div className="field"><label>Frozen suite ID</label><input value={suiteId} onChange={e=>setSuiteId(e.target.value)} placeholder="S-1" list="suite-options" required/><datalist id="suite-options">{suites.items.filter(x=>x.frozen).map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</datalist></div>
  <Action busy={open.busy}>Open run on chain</Action></form><MutationStatus state={open}/>
  <div className="divider"/><h3>Linked recheck</h3><p className="note">After a run closes, a recheck opens a fresh run against the same frozen suite and records its predecessor without changing prior verdicts.</p>
  <button type="button" className="btn btn-outline" disabled={open.busy||!runId||run.value?.state!=="CLOSED"} onClick={()=>void mutate(open,"open_recheck",[runId])}>Recheck closed run</button>
  <p className="note" style={{marginTop:12}}>Read the new run ID from the refreshed list. A global counter alone is not an authenticated ownership receipt.</p>
 </section>
 <section className="big-card"><div className="eyebrow">Step 2</div><h2>Choose an active run</h2>
  <div className="field"><label>Run ID</label><input value={runId} onChange={e=>setRunId(e.target.value)} placeholder="R-1" list="run-options"/><datalist id="run-options">{runs.items.map(r=><option value={r.id} key={r.id}>{r.suite_id} · {r.state}</option>)}</datalist></div>
  <div className="rows" style={{marginTop:18}}>{run.value?<div className="itemrow"><div><div className="itemtitle">{run.value.id}</div><div className="itemmeta">{run.value.suite_id} · {run.value.total} cases</div></div><Status value={run.value.outcome}/></div>:<div className="empty">Select a run to inspect the on-chain state.</div>}</div>
  {suite.value&&<p className="note" style={{marginTop:15}}>Suite: {suite.value.title}. Target: {target.value?.label??suite.value.target_id}.</p>}
 </section></div>
 <div className="panel-grid"><section className="big-card"><div className="eyebrow">Step 3</div><h2>Exercise target contract</h2>
 {target.value?.version==="fixture-adversarial-1"?<>
 <p className="note">Guided adversarial fixture controls. Publish an immutable public release observation, then use two other wallets to submit conflicting interpretations. Each write is sent to the selected target address.</p>
 <form className="form" onSubmit={publishGuided}><FormField label="Observation ID" value={observation} onChange={setObservation} placeholder="release-pass-1"/>
 <div className="field"><label>Public release state</label><select value={releaseState} onChange={e=>setReleaseState(e.target.value)}><option>DEFERRED</option><option>ACTIVATED</option><option>ROLLED_BACK</option></select></div>
 <FormField label="Unresolved critical findings" value={findings} onChange={setFindings} kind="text" placeholder="0"/>
 <FormField label="Release note (bounded public fact)" value={releaseNote} onChange={setReleaseNote} placeholder="Recorded public behavior"/>
 <Action busy={action.busy}>Publish immutable observation</Action></form>
 <MutationStatus state={action}/><div className="divider"/><h3>Submit this wallet&apos;s interpretation</h3>
 <form className="form" onSubmit={submitReview}><div className="field"><label>Interpretation</label><select value={position} onChange={e=>setPosition(e.target.value)}><option>CONFORMING</option><option>NONCONFORMING</option><option>UNCERTAIN</option></select></div>
 <FormField label="Natural-language interpretation" value={interpretation} onChange={setInterpretation} kind="textarea" rows={3} placeholder="Explain how the frozen requirement applies."/>
 <FormField label="Cited public field" value={citedFact} onChange={setCitedFact} placeholder="observed.release_state"/>
 <Action busy={review.busy}>Submit independent interpretation</Action></form><MutationStatus state={review}/></>:<>
 <p className="note">Send an actual target write. This compatible target exposes its own method. Supply its real method and JSON calldata arguments; this is not a source-code runner.</p>
 <form className="form" onSubmit={executeAction}><FormField label="Target write method" value={method} onChange={setMethod} placeholder="exercise"/>
 <FormField label="JSON argument array" kind="textarea" rows={3} value={args} onChange={setArgs} placeholder='["case-1",true,true,false]'/>
 <Action busy={action.busy}>Sign target action</Action></form><DataMessage value={localError}/><MutationStatus state={action}/></>}
 <div className="divider"/><div className="eyebrow">Step 4</div><h2>Capture evidence</h2><form className="form" onSubmit={e=>{e.preventDefault();void mutate(capture,"capture_case",[runId,caseId,observation]);}}>
 <div className="field"><label>Case ID from frozen suite</label><input value={caseId} onChange={e=>setCaseId(e.target.value)} list="case-options" placeholder="C-1" required/><datalist id="case-options">{suite.value?.case_ids.map(id=><option key={id} value={id}/>)}</datalist></div>
 <FormField label="Target observation ID" value={observation} onChange={setObservation} placeholder="case-1"/>
 <Action busy={capture.busy}>Capture target view</Action></form><MutationStatus state={capture}/>
 </section>
 <section className="big-card"><div className="eyebrow">Step 5</div><h2>Independent assessment</h2><p className="note">The case must have captured evidence before validators can compare it against the frozen requirement. Finalization alone does not prove successful execution.</p>
 <div className="actions"><button className="btn" disabled={assessment.busy||!runId||!caseId} onClick={()=>void mutate(assessment,"evaluate_case",[runId,caseId])}>Evaluate {caseId||"case"} by consensus</button></div><MutationStatus state={assessment}/>
 <div className="divider"/><div className="eyebrow">Step 6</div><h2>Close the run</h2><p className="note">Closing checks that every case has a consensus-backed verdict. Failing and uncertain cases are never converted into a passing suite.</p>
 <div className="actions"><button className="btn btn-outline" disabled={!runId||close.busy} onClick={()=>void mutate(close,"close_run",[runId])}>Finalize suite outcome</button></div><MutationStatus state={close}/>
 {suite.value&&<div style={{marginTop:20}}><h3>Cases to assess</h3><div className="rows">{suite.value.case_ids.map(id=><button type="button" key={id} className="itemrow" onClick={()=>setCaseId(id)}><span className="itemtitle">{id}</span><span className="note">{id===caseId?"Selected":"Select case"}</span></button>)}</div></div>}
 </section></div></>;
}
