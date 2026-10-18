import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CalldataAddress, TransactionHashVariant, TransactionStatus } from "genlayer-js/types";
import { isAddress, parseRecord } from "./schema";

export interface EthereumProvider {
  request(args:{method:string;params?:unknown[]|object}):Promise<unknown>;
  on?(event:string,handler:(...args:unknown[])=>void):void;
  removeListener?(event:string,handler:(...args:unknown[])=>void):void;
}
declare global {interface Window {ethereum?:EthereumProvider}}
export const CHAIN_ID=61999;
const PENDING_KEY="equivtest.pending.61999";
export type Pending={hash:string;address:string;method:string;account:string};
export const parseChainId=(value:unknown)=>{
  if(typeof value==="number"&&Number.isInteger(value))return value;
  if(typeof value!=="string")return NaN;
  const text=value.trim();
  if(/^0x[\da-f]+$/i.test(text))return Number.parseInt(text,16);
  if(/^\d+$/.test(text))return Number.parseInt(text,10);
  return NaN;
};
const errorCode=(error:unknown)=>typeof error==="object"&&error!==null&&"code" in error?(error as {code?:unknown}).code:undefined;
const isUnknownChainError=(error:unknown)=>errorCode(error)===4902||errorCode(error)==="4902"||errorCode(error)===-32602;
export function pendingTransaction():Pending|null{
 if(typeof window==="undefined")return null;
 try{const raw=window.localStorage.getItem(PENDING_KEY);if(!raw)return null;
 const value=JSON.parse(raw) as Pending;
 return value && /^0x[0-9a-fA-F]{64}$/.test(value.hash)&&isAddress(value.address)&&isAddress(value.account)&&typeof value.method==="string"?value:null;
 }catch{return null;}
}

export const ADDRESS=process.env.NEXT_PUBLIC_EQUIVTEST_ADDRESS||"";
export const isConfigured=()=>isAddress(ADDRESS);
export const getProvider=():EthereumProvider|null=>
  typeof window==="undefined"?null:window.ethereum??null;

export const readClient=()=>createClient({chain:studionet});
function hexToBytes(value:string){
  const bytes=new Uint8Array(value.length/2);
  for(let index=0;index<bytes.length;index++)bytes[index]=Number.parseInt(value.slice(index*2,index*2+2),16);
  return bytes;
}
function toCalldataValue(value:unknown):unknown{
  if(value instanceof CalldataAddress||value instanceof Uint8Array)return value;
  if(typeof value==="string"&&isAddress(value))return new CalldataAddress(hexToBytes(value.slice(2)));
  if(Array.isArray(value))return value.map(toCalldataValue);
  if(value instanceof Map)return new Map(Array.from(value.entries(),([key,item])=>[key,toCalldataValue(item)]));
  if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,toCalldataValue(item)]));
  return value;
}
export const toCalldataArgs=(args:unknown[])=>args.map(toCalldataValue);
async function ensureStudioNet(provider:EthereumProvider){
  const current=await provider.request({method:"eth_chainId"});
  if(parseChainId(current)!==CHAIN_ID){
    try{
      await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:"0xf22f"}]});
    }catch(error){
      if(!isUnknownChainError(error))throw error;
      await provider.request({method:"wallet_addEthereumChain",params:[{
        chainId:"0xf22f",chainName:"GenLayer StudioNet",
        rpcUrls:["https://studio.genlayer.com/api"],nativeCurrency:{name:"GEN",symbol:"GEN",decimals:18}
      }]});
      await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:"0xf22f"}]});
    }
  }
  const confirmed=await provider.request({method:"eth_chainId"});
  if(parseChainId(confirmed)!==CHAIN_ID)throw Error("Wallet is not connected to GenLayer StudioNet (chain 61999).");
}
async function assertWalletReady(provider:EthereumProvider,account:string){
  await ensureStudioNet(provider);
  const accounts=await provider.request({method:"eth_accounts"});
  if(!Array.isArray(accounts)||!accounts.some(value=>typeof value==="string"&&value.toLowerCase()===account.toLowerCase()))
    throw Error("The connected wallet account changed. Reconnect before signing.");
}
export async function readAt(address:string,method:string,args:unknown[]=[]):Promise<unknown>{
  if(!isAddress(address)) throw Error("A valid contract address is required.");
  return readClient().readContract({
    address:address as `0x${string}`,functionName:method,args:toCalldataArgs(args) as never[],
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
  await ensureStudioNet(provider);
  return accounts[0];
}
export function executionName(receipt:unknown){
  if(!receipt||typeof receipt!=="object")return "";
  const value=receipt as {txExecutionResultName?:unknown;txExecutionResult?:{status?:unknown};executionResult?:unknown;execution_result?:unknown};
  const name=value.txExecutionResultName??value.txExecutionResult?.status??value.executionResult??value.execution_result;
  return typeof name==="string"?name:"";
}
export const executionSucceeded=(receipt:unknown)=>["FINISHED_WITH_RETURN","SUCCESS"].includes(executionName(receipt));
export async function submit(address:string,account:string,method:string,args:unknown[],
  onHash?:(hash:string)=>void):Promise<string>{
  if(!isAddress(address)||!isAddress(account)) throw Error("Missing contract address or wallet.");
  const provider=getProvider();
  if(!provider) throw Error("No injected wallet detected.");
  if(pendingTransaction()) throw Error("A previous transaction is awaiting final execution verification. Resume it before submitting another write.");
  await assertWalletReady(provider,account);
  const client=createClient({chain:studionet,account:account as `0x${string}`,provider:provider as never});
  const write={address:address as `0x${string}`,functionName:method,args:toCalldataArgs(args) as never[]};
  // StudioNet 61999 uses the stable 1.1.8 SDK, not the Consensus v0.6 fee-profile API.
  const hash=await client.writeContract({...write,value:BigInt(0)});
  window.localStorage.setItem(PENDING_KEY,JSON.stringify({hash,address,method,account}));
  onHash?.(hash);
  const receipt=await client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED});
  // FINALIZED is not equivalent to successful contract execution.
  const execution=executionName(receipt);
  if(!execution) throw Error("Transaction finalized but execution success is unverified. Inspect receipt: "+hash);
  if(!executionSucceeded(receipt)){
    // A finalized contract error is terminal; keep the pending marker only while
    // the network has not yet revealed the authoritative execution result.
    window.localStorage.removeItem(PENDING_KEY);
    throw Error("Transaction not successfully executed ("+execution+"): "+hash);
  }
  window.localStorage.removeItem(PENDING_KEY);
  return hash;
}
export async function resumePending():Promise<string>{
  const pending=pendingTransaction();
  if(!pending)throw Error("No pending transaction stored on this device.");
  const receipt=await readClient().waitForTransactionReceipt({
    hash:pending.hash as never,status:TransactionStatus.FINALIZED
  });
  const execution=executionName(receipt);
  if(!execution)throw Error("Transaction finalized but execution success is unverified: "+pending.hash);
  if(!executionSucceeded(receipt)){
    window.localStorage.removeItem(PENDING_KEY);
    throw Error("Transaction finalized without successful execution ("+execution+"): "+pending.hash);
  }
  window.localStorage.removeItem(PENDING_KEY);
  return pending.hash;
}
export async function writeApp(account:string,method:string,args:unknown[],onHash?:(h:string)=>void){
  if(!isConfigured()) throw Error("EquivTest address is not configured.");
  return submit(ADDRESS,account,method,args,onHash);
}
