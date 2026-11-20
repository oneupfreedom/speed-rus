
'use client';

import React, { useEffect, useMemo, useState } from 'react';

type ScannerRow = {
symbol: string;
price: number;
changePercent: number;
rangePct: number;
multiDayRangePct: number | null;
relVol: number;
isFallback?: boolean;
isCoilPop?: boolean;
isMultiCoil?: boolean;
isCoiling?: boolean;
setup: string;
entryPrice?: number;
stopPrice?: number;
trimPrice?: number;
target5Pct?: number;
downsideRiskPct?: number;
upsideTo5Pct?: number;
rrRatio?: number;
riskScore?: number;
riskLevel?: string;
coilScore?: number;
setupGrade?: string;
actionCall?: string;
profitVerdict?: string;
market?: string;
};

type ScannerResponse = {
sessionPhase: string;
daytimeActive: boolean;
totalScanned: number;
activeCount: number;
topCoilSetups: ScannerRow[];
rows: ScannerRow[];
updatedAt: string;
};

export default function CoilPopScannerPage() {
const [customTickers, setCustomTickers] = useState('');
const [filterText, setFilterText] = useState('');
const [onlySetups, setOnlySetups] = useState(false);
const [data, setData] = useState<ScannerResponse | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadScanner = async (symbolsOverride?: string) => {
setLoading(true);
setError(null);
try {
const cleaned = (symbolsOverride ?? customTickers)
.split(',')
.map((s) => s.trim().toUpperCase())
.filter(Boolean)
.join(',');
const qs = cleaned ? `?symbols=${encodeURIComponent(cleaned)}` : '';
const res = await fetch(`/api/scanner${qs}`, { cache: 'no-store' });
if (!res.ok) throw new Error(`Request failed (${res.status})`);
const json: ScannerResponse = await res.json();
setData(json);
} catch (err: unknown) {
setError(err instanceof Error ? err.message : 'Failed to load scanner');
} finally {
setLoading(false);
}
};

useEffect(() => {
loadScanner('');
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const filteredRows = useMemo(() => {
const list = data?.rows ?? [];
const q = filterText.trim().toUpperCase();

return list.filter((row) => {
if (onlySetups && !row.isCoilPop) return false;
if (!q) return true;
return (
row.symbol.toUpperCase().includes(q) ||
row.setup.toUpperCase().includes(q) ||
(row.profitVerdict || '').toUpperCase().includes(q) ||
(row.setupGrade || '').toUpperCase().includes(q) ||
(row.market || '').toUpperCase().includes(q)
);
});
}, [data, filterText, onlySetups]);

const topPicks = useMemo(() => {
return (data?.topCoilSetups ?? []).slice(0, 6);
}, [data]);

return (
<main className="min-h-screen bg-[#071a3a] text-white p-4 md:p-6">
<div className="max-w-7xl mx-auto space-y-5">
{/* Header */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
<div>
<p className="text-xs uppercase tracking-widest text-cyan-300 font-semibold">
Coil-to-Coil Momentum Co-Pilot • +5% Upside Target
</p>
<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
Coil Pop Early-Ignition Scanner
</h1>
<p className="text-xs md:text-sm text-blue-200 mt-1">
9:35 AM ET bell ignition • +1.0% to +2.75% pop band (up to +3.25% multi-coil) • Range coil + volume + risk/R:R check
</p>
</div>

<div className="flex items-center gap-2 self-start md:self-auto">
<span className="px-3 py-1.5 rounded-lg bg-blue-900/80 border border-cyan-400/30 text-xs font-semibold text-cyan-200">
{data?.sessionPhase || 'CHECKING SESSION'}
</span>
<button
type="button"
onClick={() => loadScanner()}
className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
>
{loading ? 'Scanning...' : 'Refresh'}
</button>
</div>
</div>

{/* Controls */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-950/60 border border-blue-400/20 p-3.5 rounded-xl">
<div className="flex gap-2">
<input
type="text"
value={customTickers}
onChange={(e) => setCustomTickers(e.target.value)}
placeholder="Add custom tickers (e.g. SOFI, RKLB, IONQ, RY.TO)..."
className="w-full rounded-lg bg-blue-900/50 border border-blue-400/30 px-3 py-2 text-sm text-white placeholder:text-blue-300/70 focus:outline-none focus:border-cyan-400"
/>
<button
type="button"
onClick={() => loadScanner(customTickers)}
className="px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-xs font-semibold shrink-0"
>
Scan
</button>
</div>

<input
type="text"
value={filterText}
onChange={(e) => setFilterText(e.target.value)}
placeholder="Filter by ticker, COIL POP, MULTI-COIL, A+, verdict..."
className="w-full rounded-lg bg-blue-900/50 border border-blue-400/30 px-3 py-2 text-sm text-white placeholder:text-blue-300/70 focus:outline-none focus:border-cyan-400"
/>

<div className="flex items-center justify-between px-2 text-xs text-blue-200">
<label className="flex items-center gap-2 cursor-pointer select-none">
<input
type="checkbox"
checked={onlySetups}
onChange={(e) => setOnlySetups(e.target.checked)}
className="rounded border-blue-400"
/>
<span>Only active COIL POP / MULTI-COIL</span>
</label>
<span>
Active: <strong>{data?.activeCount ?? 0}</strong> / {data?.totalScanned ?? 0}
</span>
</div>
</div>

{/* Top Ranked Coil Setups */}
{topPicks.length > 0 && (
<section className="bg-blue-950/50 border border-cyan-400/25 rounded-xl p-4">
<h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-3">
Top Ranked COIL POP & MULTI-COIL Setups
</h2>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
{topPicks.map((pick) => (
<div
key={pick.symbol}
className="rounded-lg bg-blue-900/45 border border-blue-300/20 p-3 space-y-1.5"
>
<div className="flex items-center justify-between">
<span className="font-bold text-base">
{pick.symbol}{' '}
<span className="text-[11px] font-normal text-blue-300">
({pick.market || 'US'})
</span>
</span>
<span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold">
{pick.setupGrade || '-'} • {pick.coilScore ?? 0}
</span>
</div>
<div className="flex items-center justify-between text-xs text-blue-100">
<span>
${pick.price?.toFixed(2)} (
<strong className={pick.changePercent >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
{pick.changePercent > 0 ? `+${pick.changePercent}%` : `${pick.changePercent}%`}
</strong>
)
</span>
<span className="font-semibold text-amber-200">{pick.profitVerdict}</span>
</div>
<div className="grid grid-cols-3 gap-1 pt-1 text-[11px] text-blue-200 border-t border-blue-400/15">
<div>Stop: <strong>${pick.stopPrice?.toFixed(2)}</strong></div>
<div>Trim: <strong>${pick.trimPrice?.toFixed(2)}</strong></div>
<div>+5%: <strong>${pick.target5Pct?.toFixed(2)}</strong></div>
</div>
<div className="flex items-center justify-between text-[11px] text-blue-300">
<span>R:R <strong>{pick.rrRatio ?? '-'}x</strong></span>
<span>Risk <strong>{pick.riskScore ?? '-'}</strong> ({pick.riskLevel || '-'})</span>
</div>
</div>
))}
</div>
</section>
)}

{/* Main Scanner Table */}
<div className="bg-blue-950/60 border border-blue-400/20 rounded-xl overflow-x-auto">
<table className="w-full text-left border-collapse text-xs md:text-sm">
<thead>
<tr className="border-b border-blue-400/20 text-[11px] uppercase tracking-wider text-blue-200 bg-blue-900/40">
<th className="py-3 px-3">Ticker</th>
<th className="py-3 px-3">Price / Chg</th>
<th className="py-3 px-3">Stop / Trim / +5%</th>
<th className="py-3 px-3">Rel Vol</th>
<th className="py-3 px-3">Grade / Score</th>
<th className="py-3 px-3">Risk / R:R</th>
<th className="py-3 px-3">Setup</th>
<th className="py-3 px-3">Verdict</th>
</tr>
</thead>
<tbody>
{error ? (
<tr>
<td colSpan={8} className="py-8 text-center text-rose-300">
{error}
</td>
</tr>
) : filteredRows.length === 0 ? (
<tr>
<td colSpan={8} className="py-10 text-center text-blue-200">
{loading
? 'Loading scanner rows...'
: 'No matching tickers for current filter.'}
</td>
</tr>
) : (
filteredRows.map((row) => (
<tr
key={row.symbol}
className="border-b border-blue-400/10 hover:bg-blue-900/35 transition"
>
<td className="py-2.5 px-3 font-bold whitespace-nowrap">
{row.symbol}{' '}
<span className="text-[10px] font-normal text-blue-300">
{row.market === 'CA (.TO)' ? 'CA' : 'US'}
</span>
</td>
<td className="py-2.5 px-3 whitespace-nowrap">
<span className="font-semibold">${row.price?.toFixed(2)}</span>{' '}
<span
className={
row.changePercent >= 0 ? 'text-emerald-300' : 'text-rose-300'
}
>
({row.changePercent > 0 ? `+${row.changePercent}%` : `${row.changePercent}%`})
</span>
</td>
<td className="py-2.5 px-3 whitespace-nowrap text-xs text-blue-100">
<span className="text-rose-300">${row.stopPrice?.toFixed(2)}</span> /{' '}
<span className="text-amber-200">${row.trimPrice?.toFixed(2)}</span> /{' '}
<span className="text-emerald-300">${row.target5Pct?.toFixed(2)}</span>
</td>
<td className="py-2.5 px-3 whitespace-nowrap font-medium">
{row.relVol?.toFixed(2)}x
</td>
<td className="py-2.5 px-3 whitespace-nowrap">
<span className="font-bold text-cyan-200">{row.setupGrade || '-'}</span>{' '}
<span className="text-blue-200">({row.coilScore ?? 0})</span>
</td>
<td className="py-2.5 px-3 whitespace-nowrap text-xs">
<span>{row.riskScore ?? '-'}</span>{' '}
<span className="text-blue-300">• {row.rrRatio ?? '-'}x</span>
</td>
<td className="py-2.5 px-3 whitespace-nowrap">
<span
className={`px-2 py-0.5 rounded text-xs font-semibold ${
row.isMultiCoil
? 'bg-purple-500/25 text-purple-200 border border-purple-400/40'
: row.isCoilPop
? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
: row.isCoiling
? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30'
: 'bg-blue-800/40 text-blue-200'
}`}
>
{row.setup}
</span>
</td>
<td className="py-2.5 px-3 whitespace-nowrap text-xs font-semibold text-amber-200">
{row.profitVerdict || row.actionCall || 'WATCH'}
</td>
</tr>
))
)}
</tbody>
</table>
</div>

<p className="text-[11px] text-blue-300/80">
Note: Scanner levels and risk/reward scores are informational decision aids, not financial advice or guaranteed fills. High-beta swings, FX conversions, and tax/TFSA rules all affect net results.
</p>
</div>
</main>
);
}
