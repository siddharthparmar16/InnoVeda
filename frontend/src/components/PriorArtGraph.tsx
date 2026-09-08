'use client';

import React, { useEffect, useState } from 'react';
import { BotanicalEntity, LegalReasoningStep } from '@/types/domain';

interface PriorArtGraphProps {
  query: string;
  resolvedBotanicals?: BotanicalEntity[];
  reasoningSteps?: LegalReasoningStep[];
  precedentCase?: string | null;
  isPatentable?: boolean;
}

export default function PriorArtGraph({ 
  query, 
  resolvedBotanicals = [], 
  reasoningSteps = [], 
  precedentCase = null,
  isPatentable = false 
}: PriorArtGraphProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full bg-slate-900 animate-pulse rounded-lg border border-slate-800"></div>;
  }

  // Determine botanical text
  const botanicalLabel = resolvedBotanicals.length > 0
    ? resolvedBotanicals.map(b => b.sanskrit_name).join(' + ')
    : 'Identified Botanicals';

  const botanicalSub = resolvedBotanicals.length > 0
    ? resolvedBotanicals.map(b => b.botanical_binomial).join(', ')
    : 'Taxonomic Resolution';

  // Determine prior art reference
  const afiRef = resolvedBotanicals.find(b => b.afi_reference)?.afi_reference || 'Ayurvedic Formulary of India (AFI)';
  
  // Determine primary statutory bar
  const primaryBar = reasoningSteps.find(s => s.severity === 'BARRED') || reasoningSteps[0];
  const statutoryLabel = primaryBar ? primaryBar.citation?.citation_code || primaryBar.title : 'Patents Act s.3(p)';

  // Determine route / outcome
  const outcomeLabel = isPatentable ? 'Viable Process Claim' : 'Sec 3(p) TK Bar';

  return (
    <div className="w-full bg-slate-950 rounded-xl border border-slate-800 p-5 relative overflow-hidden font-mono shadow-2xl">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      {/* Header Info */}
      <div className="relative z-10 flex justify-between items-center mb-4 text-xs text-slate-400 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-slate-300 font-semibold uppercase tracking-wider">Relational Knowledge Graph</span>
          <span className="text-slate-500">| Multi-source Entity Resolution</span>
        </div>
        <div className="text-[11px] text-slate-400">
          {resolvedBotanicals.length} Botanicals Resolved · {reasoningSteps.length} Statutory Knots
        </div>
      </div>

      {/* Dynamic Graph Flow */}
      <div className="relative z-10 flex flex-row items-center gap-2 py-6 overflow-x-auto w-full pb-8" style={{ minHeight: '160px' }}>
        
        {/* Node 1: User Query / Claim */}
        <div 
          onClick={() => setSelectedNode(selectedNode === 'input' ? null : 'input')}
          className={`cursor-pointer transition-all duration-300 flex flex-col items-start min-w-[14rem] max-w-[16rem] flex-shrink-0 p-4 rounded-xl border text-left shadow-lg ${
            selectedNode === 'input' ? 'ring-2 ring-blue-500 bg-slate-800 border-blue-500' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 w-full">
            <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">1</div>
            <div className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Claim Input</div>
          </div>
          <div className="text-sm text-slate-200 font-medium mb-2 w-full line-clamp-3" title={query}>
            &ldquo;{query || 'Ayurvedic Query'}&rdquo;
          </div>
          <div className="text-[10px] text-slate-400 mt-auto pt-2 w-full border-t border-slate-700/50">Natural Language Claim</div>
        </div>

        {/* Edge 1 */}
        <div className="flex items-center justify-center flex-shrink-0 px-1">
          <div className="h-0.5 w-8 bg-gradient-to-r from-blue-500 to-emerald-500 relative">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-400 bg-slate-950 px-1">taxa</span>
          </div>
        </div>

        {/* Node 2: Botanical Species */}
        <div 
          onClick={() => setSelectedNode(selectedNode === 'botanical' ? null : 'botanical')}
          className={`cursor-pointer transition-all duration-300 flex flex-col items-start min-w-[14rem] max-w-[16rem] flex-shrink-0 p-4 rounded-xl border text-left shadow-lg ${
            selectedNode === 'botanical' ? 'ring-2 ring-emerald-500 bg-slate-800 border-emerald-500' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 w-full">
            <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">2</div>
            <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Botanical Taxa</div>
          </div>
          <div className="text-sm text-slate-200 font-semibold truncate w-full" title={botanicalLabel}>
            {botanicalLabel}
          </div>
          <div className="text-xs text-emerald-300/80 italic truncate w-full mt-1 mb-2" title={botanicalSub}>
            {botanicalSub}
          </div>
          <div className="text-[10px] text-slate-400 mt-auto pt-2 w-full border-t border-slate-700/50">Taxonomic Resolution</div>
        </div>

        {/* Edge 2 */}
        <div className="flex items-center justify-center flex-shrink-0 px-1">
          <div className="h-0.5 w-8 bg-gradient-to-r from-emerald-500 to-amber-500 relative">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-400 bg-slate-950 px-1">TKDL</span>
          </div>
        </div>

        {/* Node 3: Classical Corpus / AFI */}
        <div 
          onClick={() => setSelectedNode(selectedNode === 'priorArt' ? null : 'priorArt')}
          className={`cursor-pointer transition-all duration-300 flex flex-col items-start min-w-[14rem] max-w-[16rem] flex-shrink-0 p-4 rounded-xl border text-left shadow-lg ${
            selectedNode === 'priorArt' ? 'ring-2 ring-amber-500 bg-slate-800 border-amber-500' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 w-full">
            <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">3</div>
            <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Prior-Art Corpus</div>
          </div>
          <div className="text-sm text-slate-200 font-semibold mb-2 w-full line-clamp-2" title={afiRef}>
            {afiRef.length > 35 ? afiRef.substring(0, 32) + '...' : afiRef}
          </div>
          <div className="text-[10px] text-slate-400 mt-auto pt-2 w-full border-t border-slate-700/50">Classical Text Reference</div>
        </div>

        {/* Edge 3 */}
        <div className="flex items-center justify-center flex-shrink-0 px-1">
          <div className="h-0.5 w-8 bg-gradient-to-r from-amber-500 to-rose-500 relative">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-400 bg-slate-950 px-1">statute</span>
          </div>
        </div>

        {/* Node 4: Triggered Statute */}
        <div 
          onClick={() => setSelectedNode(selectedNode === 'statute' ? null : 'statute')}
          className={`cursor-pointer transition-all duration-300 flex flex-col items-start min-w-[14rem] max-w-[16rem] flex-shrink-0 p-4 rounded-xl border text-left shadow-lg ${
            selectedNode === 'statute' ? 'ring-2 ring-rose-500 bg-slate-800 border-rose-500' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 w-full">
            <div className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[10px]">4</div>
            <div className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">Statutory Bar</div>
          </div>
          <div className="text-sm text-slate-200 font-semibold truncate w-full mb-2" title={statutoryLabel}>
            {statutoryLabel}
          </div>
          <div className="text-[10px] text-slate-400 mt-auto pt-2 w-full border-t border-slate-700/50">
            {precedentCase ? 'Biopiracy Precedent' : 'BDA & Patents Bar'}
          </div>
        </div>

        {/* Edge 4 */}
        <div className="flex items-center justify-center flex-shrink-0 px-1">
          <div className="h-0.5 w-8 bg-gradient-to-r from-rose-500 to-purple-500 relative">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-400 bg-slate-950 px-1">route</span>
          </div>
        </div>

        {/* Node 5: Protection Outcome / Viable Route */}
        <div 
          onClick={() => setSelectedNode(selectedNode === 'outcome' ? null : 'outcome')}
          className={`cursor-pointer transition-all duration-300 flex flex-col items-start min-w-[14rem] max-w-[16rem] flex-shrink-0 p-4 rounded-xl border text-left shadow-lg ${
            selectedNode === 'outcome' ? 'ring-2 ring-purple-500 bg-slate-800 border-purple-500' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 w-full">
            <div className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">5</div>
            <div className="text-[11px] text-purple-400 font-bold uppercase tracking-wider">IP Strategy</div>
          </div>
          <div className="text-sm text-slate-200 font-semibold truncate w-full mb-2">
            {outcomeLabel}
          </div>
          <div className="text-[10px] text-slate-400 mt-auto pt-2 w-full border-t border-slate-700/50">Process / GI Route</div>
        </div>

      </div>

      {/* Interactive Node Details Panel */}
      <div className="relative z-10 mt-2 p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 flex justify-between items-center shadow-inner">
        <div className="flex items-center gap-3">
          <div className="text-slate-500">
            {selectedNode ? 'ℹ️' : '💡'}
          </div>
          <div>
            {selectedNode === 'input' && (
              <span><strong>Claim Node:</strong> Query parsed with vernacular normalizer & IAST diacritic stripper.</span>
            )}
            {selectedNode === 'botanical' && (
              <span><strong>Taxa Node:</strong> Mapped to Ayurvedic Botanical Ontology and Latin binomials.</span>
            )}
            {selectedNode === 'priorArt' && (
              <span><strong>Prior-Art Node:</strong> Cross-referenced with AFI formulations and TKDL classical citations.</span>
            )}
            {selectedNode === 'statute' && (
              <span><strong>Statute Node:</strong> Triggers Section 3(p) / 3(e) product patent bar + Biological Diversity Act Section 6.</span>
            )}
            {selectedNode === 'outcome' && (
              <span><strong>Strategy Node:</strong> Routes formulation to Process Patent (extraction) or Geographical Indication.</span>
            )}
            {!selectedNode && (
              <span className="text-slate-400">Click any card in the graph above to inspect its entity connection and ontological derivation.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
