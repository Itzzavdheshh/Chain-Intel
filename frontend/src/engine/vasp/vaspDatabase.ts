import { VASPMatch } from "../../types";
import { KNOWN_VASP_CATALOG, evaluateAddressVaspIntelligence } from "./vaspIntelligenceEngine";

export const KNOWN_VASP_DATABASE: Record<string, VASPMatch> = {
  coindcx: {
    name: "CoinDCX",
    jurisdiction: "India (FIU-IND Registered)",
    countryCode: "IN",
    cooperationPriority: "DOMESTIC",
    addressCount: 14250,
    verifiedDate: "2026-08-15",
    confidenceLevel: "AUTHORITATIVE",
    category: "Regulated Exchange",
    knownAddressMatches: 14250,
    complianceContact: "nodal-officer@coindcx.com",
    isDomestic: true,
  },
  binance: {
    name: "Binance",
    jurisdiction: "Global / Cayman Islands (FIU-IND Registered)",
    countryCode: "GLOBAL",
    cooperationPriority: "CROSS_BORDER_PRIORITY",
    addressCount: 189200,
    verifiedDate: "2026-08-20",
    confidenceLevel: "AUTHORITATIVE",
    category: "Global Exchange",
    knownAddressMatches: 189200,
    complianceContact: "le-compliance@binance.com",
    isDomestic: false,
  },
  wazirx: {
    name: "WazirX",
    jurisdiction: "India (FIU-IND Registered)",
    countryCode: "IN",
    cooperationPriority: "DOMESTIC",
    addressCount: 9800,
    verifiedDate: "2026-07-28",
    confidenceLevel: "AUTHORITATIVE",
    category: "Regulated Exchange",
    knownAddressMatches: 9800,
    complianceContact: "legal@wazirx.com",
    isDomestic: true,
  },
  kraken: {
    name: "Kraken",
    jurisdiction: "United States (FinCEN Registered)",
    countryCode: "US",
    cooperationPriority: "CROSS_BORDER_STANDARD",
    addressCount: 45100,
    verifiedDate: "2026-08-10",
    confidenceLevel: "HIGH",
    category: "Regulated Exchange",
    knownAddressMatches: 45100,
    complianceContact: "lawenforcement@kraken.com",
    isDomestic: false,
  },
  fixedfloat: {
    name: "FixedFloat",
    jurisdiction: "Seychelles (Non-KYC Instant Swap)",
    countryCode: "SC",
    cooperationPriority: "URGENT_REVIEW",
    addressCount: 3200,
    verifiedDate: "2026-06-12",
    confidenceLevel: "HIGH",
    category: "Instant Swap Service",
    knownAddressMatches: 3200,
    complianceContact: "compliance@fixedfloat.com",
    isDomestic: false,
  },
};

export const KNOWN_ADDRESS_MAP: Record<string, string> = {
  "0x71c765ec7ab88b098defb751b7401b5f6d8976f": "coindcx",
  "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be": "binance",
  "0x28c6c06298d514db089934071355e5743bf21d60": "binance",
  "0x0d0707963952f2a77298587ab17fa5b169528d9c": "wazirx",
  "0x1db3439a222c519ab44bb1144fe2816f77e5b272": "kraken",
};

export interface MatchResult {
  isMatch: boolean;
  matchType: "EXACT_MATCH" | "CLUSTER_RELATION" | "FORWARDING_RELATION" | "KNOWN_DEPOSIT" | "NO_MATCH";
  vaspKey?: string;
  vaspDetails?: VASPMatch;
  confidenceScore: number;
  explanation: string;
}

export function matchAddress(address: string): MatchResult {
  const evalResult = evaluateAddressVaspIntelligence(address);

  if (evalResult.isAttributed && evalResult.vaspKey && KNOWN_VASP_DATABASE[evalResult.vaspKey]) {
    const vasp = KNOWN_VASP_DATABASE[evalResult.vaspKey];
    return {
      isMatch: true,
      matchType: evalResult.primaryRole === "DEPOSIT_WALLET" ? "KNOWN_DEPOSIT" : "EXACT_MATCH",
      vaspKey: evalResult.vaspKey,
      vaspDetails: vasp,
      confidenceScore: evalResult.confidenceScore,
      explanation: evalResult.reasons[0] || ("Match found for " + vasp.name),
    };
  }

  return {
    isMatch: false,
    matchType: "NO_MATCH",
    confidenceScore: 0,
    explanation: "Address does not match any known VASP dataset or identified cluster.",
  };
}
