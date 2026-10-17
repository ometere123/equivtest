import Link from "next/link";
import {ArrowRight,CheckCircle2,Layers3,ShieldCheck,Zap,ArrowUpRight} from "lucide-react";
import {WalletButton} from "@/components/WalletProvider";
export default function Home(){
  return <><header className="hero-top"><Link href="/" className="brand"><span className="brand-mark"><Layers3 size={20}/></span> equivtest<span style={{color:"#b3edcb"}}>.</span></Link><div className="inline"><span className="chainpill">● STUDIO NET · 61999</span><WalletButton/></div></header>
  <section className="hero"><div className="hero-inner"><div className="eyebrow">Developer tools / Built on GenLayer</div>
    <h1>Code can pass tests.<br/><strong>But did it keep its promise?</strong></h1>
    <p className="hero-copy">EquivTest turns a contract&apos;s intended behaviour into frozen, independently assessed conformance cases. Capture real contract evidence. Obtain consensus-backed findings. Publish an auditable record.</p>
    <div className="actions"><Link href="/dashboard" className="btn">Open workbench <ArrowRight size={15}/></Link><Link href="/registry" className="btn btn-outline">Explore public registry <ArrowUpRight size={15}/></Link></div>
    <div className="progress-line"><ShieldCheck size={15}/> No custodial funds · Immutable assessments · GenLayer consensus</div>
  </div></section>
  <section className="content"><div className="eyebrow">How it works</div><h2>Three steps. Verifiable outcomes.</h2>
    <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))"}}>
      {[["01","Freeze the rules","Specify the behaviour your Intelligent Contract must satisfy before measuring the outcome."],["02","Capture real evidence","Execute a target action, then read its public outcome through an opt-in on-chain adapter."],["03","Let validators decide","GenLayer independently validates the judgment and commits the accepted result to a public registry."]].map(x=><article key={x[0]} className="card"><div className="eyebrow">{x[0]}</div><h3>{x[1]}</h3><p className="note">{x[2]}</p></article>)}
    </div>
    <div className="panel-grid"><div className="big-card"><CheckCircle2 color="#b3edcb" size={22}/><h2 style={{marginTop:20}}>Testing semantics, not just syntax.</h2><p className="subheading">Deterministic tooling should still check what it can prove. EquivTest adds consensus-based review for bounded cases that require interpreting a natural-language obligation against observable evidence.</p><Link href="/suites" className="btn">Create a suite <ArrowRight size={14}/></Link></div>
    <div className="big-card"><Zap color="#b3edcb" size={22}/><h2 style={{marginTop:20}}>No verdict by admin override.</h2><p className="subheading">A result belongs to a frozen suite, exact captured observations and a consensus-accepted assessment. An inconclusive or failed transaction is never silently converted into PASS.</p><Link href="/results" className="btn btn-outline">Inspect results <ArrowRight size={14}/></Link></div></div>
    <p className="footer-note">EquivTest does not certify complete contract security or facts that a target&apos;s public interface cannot independently establish.</p>
  </section></>;
}
