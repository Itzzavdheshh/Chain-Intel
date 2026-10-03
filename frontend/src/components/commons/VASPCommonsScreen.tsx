import React, { useState } from "react";
import { Users, Search, Filter, ExternalLink, Copy, Check, Building2, ShieldCheck, ShieldAlert } from "lucide-react";
import { KNOWN_VASP_CATALOG } from "../../engine/vasp/vaspIntelligenceEngine";

export const VASPCommonsScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "DEPOSIT" | "HOT" | "COLD" | "MIXER" | "DOMESTIC">("ALL");
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  // Flatten catalog addresses for law enforcement commons directory view
  const allEntries = Object.values(KNOWN_VASP_CATALOG).flatMap((entity) =>
    entity.knownAddresses.map((ka) => ({
      vaspKey: entity.vaspKey,
      entityName: entity.name,
      category: entity.category,
      entityType: entity.entityType,
      jurisdiction: entity.jurisdiction,
      countryCode: entity.countryCode,
      cooperationPriority: entity.cooperationPriority,
      complianceContact: entity.complianceContact || "N/A",
      isDomestic: entity.isDomestic,
      address: ka.address,
      chain: ka.chain,
      role: ka.role,
      clusterName: ka.clusterName || "Main Entity Infrastructure",
      description: ka.description,
      status: "VERIFIED",
      provenanceSource: "CURATED_INTELLIGENCE",
      lastVerified: "2026-09-15",
    }))
  );

  const filteredEntries = allEntries.filter((item) => {
    const matchesSearch =
      item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clusterName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "DEPOSIT") return item.role === "DEPOSIT_WALLET";
    if (activeTab === "HOT") return item.role === "HOT_WALLET";
    if (activeTab === "COLD") return item.role === "COLD_WALLET";
    if (activeTab === "MIXER") return item.category.includes("Mixer") || item.category.includes("Bridge");
    if (activeTab === "DOMESTIC") return item.isDomestic;

    return true;
  });

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">VASP Intelligence Commons</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              National law-enforcement shared address verification repository & exchange cluster registry
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="text-emerald-700">{allEntries.length} Verified Addresses</span>
          <span className="text-slate-400">|</span>
          <span className="text-blue-700">{Object.keys(KNOWN_VASP_CATALOG).length} Regulated VASPs</span>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search address, VASP name, cluster, or jurisdiction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          {[
            { id: "ALL", label: "All Entities" },
            { id: "DEPOSIT", label: "Deposit Wallets" },
            { id: "HOT", label: "Hot Wallets" },
            { id: "COLD", label: "Cold Storage" },
            { id: "DOMESTIC", label: "FIU-IND Domestic" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition text-[11px] ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-2xs font-bold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Verified Exchange Address Directory</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-500">Showing {filteredEntries.length} records</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
            <tr>
              <th className="px-4 py-2.5">Address</th>
              <th className="px-4 py-2.5">VASP Entity</th>
              <th className="px-4 py-2.5">Wallet Role</th>
              <th className="px-4 py-2.5">Jurisdiction</th>
              <th className="px-4 py-2.5">Compliance Contact</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                  No matching VASP intelligence records found.
                </td>
              </tr>
            ) : (
              filteredEntries.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono font-bold text-blue-900">
                    <div className="flex items-center space-x-1.5">
                      <span className="break-all">{item.address}</span>
                      <button
                        onClick={() => handleCopy(item.address)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 shrink-0"
                        title="Copy Address"
                      >
                        {copiedAddr === item.address ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div>
                      <span>{item.entityName}</span>
                      <span className="block text-[10px] text-slate-400 font-normal">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        item.role === "DEPOSIT_WALLET"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : item.role === "HOT_WALLET"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                      }`}
                    >
                      {item.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{item.jurisdiction}</td>
                  <td className="px-4 py-3 text-slate-700 font-mono text-[11px]">{item.complianceContact}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        window.location.hash = "#/trace";
                      }}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[10px] font-semibold transition flex items-center space-x-1 ml-auto"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Trace Address</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
