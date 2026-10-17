"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Activity,BookOpenCheck,Boxes,ChartNoAxesCombined,ClipboardList,FlaskConical,Layers3,LayoutDashboard,ShieldCheck} from "lucide-react";
import {WalletButton} from "./WalletProvider";
import {ADDRESS,isConfigured,pendingTransaction,resumePending} from "@/lib/genlayer";
import {short,presentError} from "@/lib/schema";
import {useEffect,useState} from "react";
const navigation=[
  {href:"/dashboard",name:"Overview",icon:LayoutDashboard},
  {href:"/projects",name:"Projects",icon:Boxes},
  {href:"/suites",name:"Test suites",icon:BookOpenCheck},
  {href:"/runner",name:"Test runner",icon:FlaskConical},
  {href:"/results",name:"Results",icon:ChartNoAxesCombined},
  {href:"/registry",name:"Registry",icon:ShieldCheck}
];
export function ConsoleShell({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const current=navigation.find(x=>x.href===pathname)?.name??"Workbench";
 return <div className="shell"><aside className="sidebar">
   <Link href="/" className="brand"><span className="brand-mark"><Layers3 size={20}/></span>equivtest<span style={{color:"#b3edcb"}}>.</span></Link>
   <nav aria-label="Main navigation"><div className="nav-heading">Workspace</div><div className="navgroup">
     {navigation.map(({href,name,icon:Icon})=><Link key={href} href={href} className={"navlink "+(pathname===href?"active":"")}><Icon size={17}/>{name}</Link>)}
   </div></nav>
   <div className="sidebar-foot"><div className="inline"><Activity size={14} color="#b3edcb"/> GenLayer StudioNet</div>
     <div>Chain ID 61999</div><div className="code" title={ADDRESS}>{isConfigured()?short(ADDRESS,6):"Not deployed"}</div></div>
 </aside>
 <div className="main"><header className="topbar"><div className="breadcrumb">Workspace <span style={{padding:"0 10px"}}>/</span> <strong>{current}</strong></div>
 <div className="topactions"><span className="chainpill">● STUDIO NET · 61999</span><WalletButton/></div></header>
 <main className="content"><PendingRecovery/>{!isConfigured()&&<div className="alert" style={{marginBottom:23}}>No verified EquivTest deployment configured. Browsing is available after NEXT_PUBLIC_EQUIVTEST_ADDRESS is set; writes remain disabled until then.</div>}{children}
 <footer className="footer-note">EquivTest · Bounded semantic conformance · Results depend on the evidence exposed by participating contracts.</footer></main></div></div>;
}

function PendingRecovery(){
 const [hash,setHash]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 useEffect(()=>{setHash(pendingTransaction()?.hash??"");},[]);
 if(!hash)return null;
 return <div className="card" style={{marginBottom:22,borderColor:"#836039"}}>
 <div className="eyebrow">Recovery / submitted transaction</div>
 <p className="note">A transaction was already submitted from this browser. Resume verification before attempting another state-changing write.</p>
 <div className="note code break">{hash}</div>
 <div className="actions"><button type="button" disabled={busy} className="btn btn-outline btn-small" onClick={async()=>{
 setBusy(true);setMessage("");
 try{const tx=await resumePending();setHash("");setMessage("Execution verified: "+tx);}
 catch(e){setMessage(presentError(e));}finally{setBusy(false);}
 }}>Resume finalization check</button></div>
 {message&&<p role="status" className="note" style={{marginTop:12}}>{message}</p>}
 </div>;
}
