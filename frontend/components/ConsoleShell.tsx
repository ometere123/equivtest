"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Activity,BookOpenCheck,Boxes,ChartNoAxesCombined,ClipboardList,FlaskConical,Layers3,LayoutDashboard,ShieldCheck} from "lucide-react";
import {WalletButton} from "./WalletProvider";
import {ADDRESS,isConfigured} from "@/lib/genlayer";
import {short} from "@/lib/schema";
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
 <main className="content">{!isConfigured()&&<div className="alert" style={{marginBottom:23}}>No verified EquivTest deployment configured. Browsing is available after NEXT_PUBLIC_EQUIVTEST_ADDRESS is set; writes remain disabled until then.</div>}{children}
 <footer className="footer-note">EquivTest · Bounded semantic conformance · Results depend on the evidence exposed by participating contracts.</footer></main></div></div>;
}
