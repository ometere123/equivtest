import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant } from "genlayer-js/types";
import { isAddress, parseRecord } from "./schema";

export interface EthereumProvider {
  request(args:{method:string;params?:unknown[]|object}):Promise<unknown>;
  on?(event:string,handler:(...args:unknown[])=>void):void;
  removeListener?(event:string,handler:(...args:unknown[])=>void):void;
}
declare global {interface Window {ethereum?:EthereumProvider}}
export const CHAIN_ID=61999;
export const ADDRESS=process.env.NEXT_PUBLIC_EQUIVTEST_ADDRESS||"";
export const isConfigured=()=>isAddress(ADDRESS);
export const getProvider=():EthereumProvider|null=>
  typeof window==="undefined"?null:window.ethereum??null;

export const readClient=()=>createClient({chain:studionet});
export async function readAt(address:string,method:string,args:unknown[]=[]):Promise<unknown>{
  if(!isAddress(address)) throw Error("A valid contract address is required.");
  return readClient().readContract({
    address:address as `0x${string}`,functionName:method,args:args as never[],
    transactionHashVariant:TransactionHashVariant.LATEST_FINAL
  });
}
export async function readRecord<T>(method:string,args:unknown[]=[]):Promise<T|null>{
  if(!isConfigured()) throw Error("Set NEXT_PUBLIC_EQUIVTEST_ADDRESS to the verified 61999 deployment.");
  return parseRecord<T>(await readAt(ADDRESS,method,args));
}
export async function connectWallet():Promise<string>{
  const provider=getProvider();
  if(!provider) throw Error("Install an injected EIP-1193 wallet to write transactions.");
  const accounts=await provider.request({method:"eth_requestAccounts"}) as string[];
  if(!Array.isArray(accounts)||!accounts.length||!isAddress(accounts[0])) throw Error("Wallet did not return an account.");
  const chain=await provider.request({method:"eth_chainId"});
  if(Number.parseInt(String(chain),16)!==CHAIN_ID){
    try {await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:"0xf22f"}]});}
    catch {
      await provider.request({method:"wallet_addEthereumChain",params:[{
        chainId:"0xf22f",chainName:"GenLayer StudioNet",
        rpcUrls:["https://studio.genlayer.com/api"],nativeCurrency:{name:"GEN",symbol:"GEN",decimals:18}
      }]});
      await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:"0xf22f"}]});
    }
  }
  return accounts[0];
}
export async function submit(address:string,account:string,method:string,args:unknown[],
  onHash?:(hash:string)=>void):Promise<string>{
  if(!isAddress(address)||!isAddress(account)) throw Error("Missing contract address or wallet.");
  const provider=getProvider();
  if(!provider) throw Error("No injected wallet detected.");
  const client=createClient({chain:studionet,account:account as `0x${string}`,provider:provider as never});
  const write={address:address as `0x${string}`,functionName:method,args:args as never[]};
  const estimate=await client.estimateTransactionFeesForWrite(write);
  const hash=await client.writeContract({
    ...write,fees:{distribution:estimate.distribution,feeValue:estimate.feeValue}
  });
  onHash?.(hash);
  const receipt=await client.waitForFinalization({hash});
  // FINALIZED is not equivalent to successful contract execution.
  const raw=receipt as {txExecutionResultName?:string;txExecutionResult?:{status?:string};executionResult?:string};
  const execution=raw.txExecutionResultName??raw.txExecutionResult?.status??raw.executionResult;
  if(!execution) throw Error("Transaction finalized but execution success is unverified. Inspect receipt: "+hash);
  if(!["FINISHED_WITH_RETURN","SUCCESS"].includes(String(execution)))
    throw Error("Transaction not successfully executed ("+execution+"): "+hash);
  return hash;
}
export async function writeApp(account:string,method:string,args:unknown[],onHash?:(h:string)=>void){
  if(!isConfigured()) throw Error("EquivTest address is not configured.");
  return submit(ADDRESS,account,method,args,onHash);
}
