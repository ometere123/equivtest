"use client";
import {createContext,useCallback,useContext,useEffect,useState} from "react";
import {CHAIN_ID,connectWallet,getProvider} from "@/lib/genlayer";
import {isAddress,presentError,short} from "@/lib/schema";
type Wallet={account:string;connect:()=>Promise<void>;disconnect:()=>void;error:string};
const Context=createContext<Wallet>({account:"",connect:async()=>{},disconnect:()=>{},error:""});
export function WalletProvider({children}:{children:React.ReactNode}){
  const [account,setAccount]=useState("");const [error,setError]=useState("");
  const disconnect=useCallback(()=>{setAccount("");setError("");},[]);
  const connect=useCallback(async()=>{setError("");try{setAccount(await connectWallet());}catch(e){setError(presentError(e));}},[]);
  useEffect(()=>{const p=getProvider();if(!p)return;
    void (async()=>{try{const chain=await p.request({method:"eth_chainId"});const list=await p.request({method:"eth_accounts"}) as string[];if(Number.parseInt(String(chain),16)===CHAIN_ID&&Array.isArray(list)&&isAddress(list[0]??""))setAccount(list[0]);}catch{/** Wallets may reject passive reads. */}})();
    const accounts=(...args:unknown[])=>{const list=args[0] as string[];setAccount(Array.isArray(list)&&isAddress(list[0]??"")?list[0]:"");};
    const chain=(...args:unknown[])=>{if(Number.parseInt(String(args[0]),16)!==CHAIN_ID)setAccount("");};
    p.on?.("accountsChanged",accounts);p.on?.("chainChanged",chain);
    return()=>{p.removeListener?.("accountsChanged",accounts);p.removeListener?.("chainChanged",chain);};
  },[]);
  return <Context.Provider value={{account,connect,disconnect,error}}>{children}</Context.Provider>;
}
export const useWallet=()=>useContext(Context);
export function WalletButton(){
  const {account,connect,disconnect,error}=useWallet();
  return <div className="wallet-area"><button className="wallet-btn" onClick={account?disconnect:connect}>
    <span className="wallet-dot"/>{account?short(account,5):"Connect wallet"}
  </button>{error&&<div className="wallet-error" role="alert">{error}</div>}</div>;
}
