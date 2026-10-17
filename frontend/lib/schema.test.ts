import {describe,it,expect} from "vitest";
import {isAddress,isId,parseRecord,short} from "./schema";
describe("untrusted registry decoding",()=>{
 it("rejects missing and invalid object responses",()=>{
  expect(parseRecord("")).toBeNull();
  expect(parseRecord("not-json")).toBeNull();
  expect(parseRecord("[]")).toBeNull();
  expect(parseRecord('{"id":"R-1"}')).toEqual({id:"R-1"});
 });
 it("accepts only complete EVM address forms",()=>{
  expect(isAddress("0x"+"a".repeat(40))).toBe(true);
  expect(isAddress("0x1")).toBe(false);
  expect(isAddress("0x"+"z".repeat(40))).toBe(false);
 });
 it("checks stable ID grammar",()=>{
  expect(isId("R-1","R")).toBe(true);
  expect(isId("R-01","R")).toBe(false);
  expect(isId("T-1","R")).toBe(false);
 });
 it("shortens only long strings",()=>expect(short("abc",5)).toBe("abc"));
});
