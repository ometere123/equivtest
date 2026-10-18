import {describe,it,expect} from "vitest";
import {CalldataAddress} from "genlayer-js/types";
import {executionName,executionSucceeded,toCalldataArgs,FINALIZATION_POLL_INTERVAL_MS,FINALIZATION_POLL_RETRIES} from "./genlayer";

describe("GenLayer calldata arguments",()=>{
 it("encodes address strings as GenLayer calldata addresses",()=>{
  const address="0xe8A8590B3259A4bFDf06462EaCE4e3d9A6A25B1f";
  const [value]=toCalldataArgs([address]);
  expect(value).toBeInstanceOf(CalldataAddress);
  expect(Array.from((value as CalldataAddress).bytes)).toEqual(Array.from(Buffer.from(address.slice(2),"hex")));
 });
 it("recursively preserves ordinary strings and nested values",()=>{
  const address="0x647483f23849895d0c7e6c4fAd267d76a6365B5A";
  const [value]=toCalldataArgs([["case-1",{target:address}]]);
  expect(value).toBeInstanceOf(Array);
  expect((value as unknown[])[0]).toBe("case-1");
  expect((value as unknown[])[1]).toMatchObject({target:expect.any(CalldataAddress)});
 });
 it("accepts StudioNet SUCCESS and rejects error or unknown final receipts",()=>{
  expect(executionName({execution_result:"SUCCESS"})).toBe("SUCCESS");
  expect(executionSucceeded({execution_result:"SUCCESS"})).toBe(true);
  expect(executionSucceeded({txExecutionResultName:"FINISHED_WITH_RETURN"})).toBe(true);
  expect(executionName({consensus_data:{leader_receipt:[{execution_result:"SUCCESS"}]}})).toBe("SUCCESS");
  expect(executionSucceeded({consensus_data:{leader_receipt:[{execution_result:"SUCCESS"}]}})).toBe(true);
  expect(executionSucceeded({consensus_data:{leader_receipt:[{execution_result:"ERROR"}]}})).toBe(false);
  expect(executionSucceeded({execution_result:"ERROR"})).toBe(false);
  expect(executionSucceeded({status_name:"FINALIZED"})).toBe(false);
 });
 it("uses a consensus-sized finalization window",()=>{
  expect(FINALIZATION_POLL_INTERVAL_MS).toBe(5000);
  expect(FINALIZATION_POLL_RETRIES).toBe(60);
  expect(FINALIZATION_POLL_INTERVAL_MS*FINALIZATION_POLL_RETRIES).toBeGreaterThanOrEqual(180000);
 });
});
