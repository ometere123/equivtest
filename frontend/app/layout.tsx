import type {Metadata} from "next";
import "./globals.css";
import {WalletProvider} from "@/components/WalletProvider";
export const metadata:Metadata={title:"EquivTest | Semantic conformance for Intelligent Contracts",description:"Consensus-backed semantic conformance tests and public result registry on GenLayer StudioNet."};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><WalletProvider>{children}</WalletProvider></body></html>;
}
