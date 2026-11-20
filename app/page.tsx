
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface ScannerRow {
symbol: string;
name?: string;
price: number;
changePercent: number;
relVol: number;
score: number;
setup: string;
signal: string;
isCoilPop?: boolean;
isCoiling?: boolean;
source?: 'live' | 'fallback' | string;
}

const PHASE_LABELS: Record<string, string> = {
PRE_BELL: 'PRE-BELL (< 9:35 AM ET)',
BELL_935_WINDOW: '9:35 AM ET BELL WINDOW',
DAY_SESSION: 'ACTIVE SESSION (9:35 AM - 4:00 PM ET)',
POST_CLOSE: 'POST-CLOSE'
};

export default function ScannerPage() {
const [rows, setRows] = useState<ScannerRow[]>([]);
const [sessionPhase, setSessionPhase] = useState<string>('BELL_935_WINDOW');
const [filterText, setFilterText] = useState<string>('');
const [customInput, setCustomInput] = useState<string>('');
const [customTickers, setCustomTickers] = useState<string[]>([]);
const [coilPopOnly, setCoilPopOnly] = useState<boolean>(false);
const [primeBandOnly, setPrimeBandOnly] = useState<boolean>(false);
const [lockedSymbol, setLockedSymbol] = useState<string | null>(null);
const [lastSync, setLastSync] = useState<string>('');
const [loading, setLoading] = useState<boolean>(false);

const fetchScanner = useCallback(async (extraList: string[]) => {
setLoading(true);
try {
const query =
extraList.length > 0
? `?symbols=${encodeURIComponent(extraList.join(','))}`
: '';
const res = await fetch(`/api/scanner${query}`, { cache: 'no-store' });
const data = await res.json();
if (data?.ok && Array.isArray(data.rows)) {
setRows(data.rows);
if (data.sessionPhase) setSessionPhase(data.sessionPhase);
const timeStr = new Date().toLocaleTimeString([], {
hour: '2-digit',
minute: '2-digit',
second: '2-digit'
});
setLastSync(timeStr);
}
} catch {
// Keep existing rows on transient network hiccup
} finally {
setLoading(false);
}
}, []);

useEffect(() => {
fetchScanner(customTickers);
const interval = setInterval(() => {
fetchScanner(customTickers);
}, 30000);
return () => clearInterval(interval);
}, [fetchScanner, customTickers]);

const handleAddTickers = (e: React.FormEvent) => {
e.preventDefault();
const parsed = customInput
.split(',')
.map((s) => s.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, ''))
.filter(Boolean);

if (parsed.length === 0) return;

const merged = [...new Set([...parsed, ...customTickers])].slice(0, 30);
setCustomTickers(merged);
setCustomInput('');
};

const filteredRows = useMemo(() => {
const q = filterText.trim().toUpperCase();
return rows.filter((row) => {
if (coilPopOnly && !row.isCoilPop) return false;
if (
primeBandOnly &&
(row.changePercent < 1.5 || row.changePercent > 2.35)
) {
return false;
}
if (!q) return true;
return (
row.symbol.toUpperCase().includes(q) ||
(row.name || '').toUpperCase().includes(q) ||
row.setup.toUpperCase().includes(q) ||
(row.source || '').toUpperCase().includes(q)
);
});
}, [rows, filterText, coilPopOnly, primeBandOnly]);

const liveCount = useMemo(
() => rows.filter((r) => r.source === 'live').length,
[rows]
);

const fallbackCount = useMemo(
() => rows.filter((r) => r.source !== 'live').length,
[rows]
);

const spotlight = useMemo(() => {
return rows.find((r) => r.isCoilPop) || rows[0] || null;
}, [rows]);

const lockedRow = useMemo(() => {
if (!lockedSymbol) return null;
return rows.find((r) => r.symbol === lockedSymbol) || null;
}, [rows, lockedSymbol]);

const lockedStalled = useMemo(() => {
if (!lockedRow) return false;
return lockedRow.changePercent < 0.85 || lockedRow.relVol < 1.0;
}, [lockedRow]);

const overtakenByCoil = useMemo(() => {
if (!lockedRow) return null;
return (
rows.find(
(r) =>
r.symbol !== lockedRow.symbol &&
r.isCoilPop &&
r.changePercent >= lockedRow.changePercent + 1.2
) || null
);
}, [rows, lockedRow]);

return (
<main className="min-h-screen bg-[#07132b] text-white p-4 md:p-8 font-sans">
<div className="max-w-6xl mx-auto space-y-6">
<header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-blue-800/60 pb-5">
<div>
<p className="text-xs uppercase tracking-widest text-cyan-300 font-semibold">
COIL-TO-COIL MOMENTUM CO-PILOT • +5% UPSIDE TARGET
</p>
<h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
Coil Pop Early-Ignition Scanner
</h1>
<p className="text-sm text-blue-200/80 mt-1">
9:35 AM ET bell ignition • +1.0% to +2.35% pop band • Range coil + volume confirmation
</p>
</div>

<div className="flex flex-wrap items-center gap-3">
<span className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-900/80 border border-blue-600/50 text-cyan-200">
{PHASE_LABELS[sessionPhase] || sessionPhase}
</span>
<span className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900/90 border border-slate-700 text-blue-100">
LIVE: {liveCount} • FALLBACK: {fallbackCount}
</span>
<span className="text-xs text-blue-200/80">
Auto-Sync (30s): {lastSync || 'Syncing...'}
</span>
<button
type="button"
onClick={() => fetchScanner(customTickers)}
className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
>
{loading ? 'SYNCING...' : 'REFRESH'}
</button>
</div>
</header>

{lockedRow && (
<div className="rounded-xl bg-slate-900/90 border border-cyan-500/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
<div>
<div className="flex flex-wrap items-center gap-2">
<span className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">
LOCKED ACTIVE POSITION: {lockedRow.symbol} • +5% GOAL: $
{(lockedRow.price * 1.05).toFixed(2)}
</span>
<span
className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
lockedRow.source === 'live'
? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
: 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
}`}
>
{lockedRow.source === 'live' ? 'LIVE' : 'FALLBACK'}
</span>
</div>
<div className="text-sm mt-1">
Current: <strong>${lockedRow.price.toFixed(2)}</strong> (
{lockedRow.changePercent >= 0 ? '+' : ''}
{lockedRow.changePercent.toFixed(2)}%) • Rel Vol:{' '}
<strong>{lockedRow.relVol.toFixed(2)}x</strong>
</div>
{lockedStalled && (
<div className="text-xs text-amber-300 font-semibold mt-1">
WARNING: Momentum stalling on {lockedRow.symbol} (check % gain &amp; relative volume).
</div>
)}
{overtakenByCoil && (
<div className="text-xs text-emerald-300 font-semibold mt-1">
FASTER COIL DETECTED: {overtakenByCoil.symbol} (
+{overtakenByCoil.changePercent.toFixed(2)}%) is +1.2% ahead of{' '}
{lockedRow.symbol}.
</div>
)}
</div>
<button
type="button"
onClick={() => setLockedSymbol(null)}
className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-600"
>
UNLOCK
</button>
</div>
)}

{spotlight && (
<section className="rounded-xl bg-gradient-to-r from-blue-950 via-blue-900/80 to-slate-900 border border-blue-600/50 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
<div>
<div className="flex flex-wrap items-center gap-2">
<span className="text-xs uppercase tracking-wider text-cyan-300 font-bold">
COIL POP SPOTLIGHT • +5% TARGET: ${(spotlight.price * 1.05).toFixed(2)}
</span>
<span
className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
spotlight.source === 'live'
? 'bg-emerald-400 text-slate-950'
: 'bg-amber-400 text-slate-950'
}`}
>
{spotlight.source === 'live' ? 'LIVE DATA' : 'FALLBACK DATA'}
</span>
</div>
<div className="text-lg md:text-xl font-bold mt-1">
{spotlight.symbol}{' '}
<span className="font-normal text-blue-100">
(${spotlight.price.toFixed(2)} •{' '}
{spotlight.changePercent >= 0 ? '+' : ''}
{spotlight.changePercent.toFixed(2)}% •{' '}
{spotlight.relVol.toFixed(2)}x Rel Vol)
</span>
</div>
<div className="text-xs text-blue-200 mt-1">
Setup: <strong>{spotlight.setup}</strong> • Signal:{' '}
<strong>{spotlight.signal}</strong> • Score:{' '}
<strong>{spotlight.score}</strong>
</div>
</div>

<button
type="button"
onClick={() =>
setLockedSymbol(
lockedSymbol === spotlight.symbol ? null : spotlight.symbol
)
}
className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition shrink-0"
>
{lockedSymbol === spotlight.symbol
? `UNLOCK ${spotlight.symbol}`
: `LOCK ${spotlight.symbol}`}
</button>
</section>
)}

<section className="rounded-xl bg-[#0b1d3f] border border-blue-800/60 p-4 space-y-3">
<form
onSubmit={handleAddTickers}
className="flex flex-col sm:flex-row gap-2.5"
>
<input
type="text"
value={customInput}
onChange={(e) => setCustomInput(e.target.value)}
placeholder="Add custom tickers (e.g. SOFI, RKLB, IONQ, RY.TO)..."
className="flex-1 rounded-lg bg-[#07132b] border border-blue-700/70 px-3.5 py-2 text-sm text-white placeholder:text-blue-300/50 focus:outline-none focus:border-cyan-400"
/>
<button
type="submit"
className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
>
+ ADD TICKER
</button>
</form>

<div className="flex flex-col md:flex-row gap-2.5">
<input
type="text"
value={filterText}
onChange={(e) => setFilterText(e.target.value)}
placeholder="Filter by ticker, company, COIL POP, LIVE, or FALLBACK..."
className="flex-1 rounded-lg bg-[#07132b] border border-blue-700/70 px-3.5 py-2 text-sm text-white placeholder:text-blue-300/50 focus:outline-none focus:border-cyan-400"
/>
<div className="flex gap-2">
<button
type="button"
onClick={() => setCoilPopOnly((v) => !v)}
className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition ${
coilPopOnly
? 'bg-amber-400 text-slate-950 border-amber-300'
: 'bg-[#07132b] text-blue-100 border-blue-700/70 hover:border-cyan-400'
}`}
>
COIL POP ONLY
</button>
<button
type="button"
onClick={() => setPrimeBandOnly((v) => !v)}
className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition ${
primeBandOnly
? 'bg-cyan-400 text-slate-950 border-cyan-300'
: 'bg-[#07132b] text-blue-100 border-blue-700/70 hover:border-cyan-400'
}`}
>
PRIME 1.5–2.35% ONLY
</button>
</div>
</div>
</section>

<section className="rounded-xl bg-[#0b1d3f] border border-blue-800/60 overflow-x-auto">
<table className="w-full text-left border-collapse text-sm">
<thead>
<tr className="border-b border-blue-800/70 text-[11px] uppercase tracking-wider text-blue-300/80">
<th className="py-3 px-4">Ticker</th>
<th className="py-3 px-4">Source</th>
<th className="py-3 px-4">Price / Chg</th>
<th className="py-3 px-4">+5% Target</th>
<th className="py-3 px-4">Rel Vol</th>
<th className="py-3 px-4">Score</th>
<th className="py-3 px-4">Setup</th>
<th className="py-3 px-4">Signal</th>
<th className="py-3 px-4 text-right">Action</th>
</tr>
</thead>
<tbody className="divide-y divide-blue-900/60">
{filteredRows.map((row) => {
const isLocked = lockedSymbol === row.symbol;
const isLive = row.source === 'live';
return (
<tr
key={row.symbol}
className={
isLocked
? 'bg-cyan-950/50'
: row.isCoilPop
? 'bg-amber-950/20'
: 'hover:bg-blue-950/40'
}
>
<td className="py-3 px-4">
<div className="font-bold text-white">{row.symbol}</div>
<div className="text-xs text-blue-300/70 truncate max-w-[180px]">
{row.name || row.symbol}
</div>
</td>
<td className="py-3 px-4">
<span
className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
isLive
? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
: 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
}`}
>
{isLive ? 'LIVE' : 'FALLBACK'}
</span>
</td>
<td className="py-3 px-4">
<div className="font-semibold">
${row.price.toFixed(2)}
</div>
<div
className={`text-xs font-semibold ${
row.changePercent >= 0
? 'text-emerald-400'
: 'text-rose-400'
}`}
>
({row.changePercent >= 0 ? '+' : ''}
{row.changePercent.toFixed(2)}%)
</div>
</td>
<td className="py-3 px-4 text-cyan-200 font-medium">
${(row.price * 1.05).toFixed(2)}
</td>
<td className="py-3 px-4 font-medium">
{row.relVol.toFixed(2)}x
</td>
<td className="py-3 px-4 font-bold text-cyan-300">
{row.score}
</td>
<td className="py-3 px-4">
<span
className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
row.setup === 'COIL POP'
? 'bg-amber-400 text-slate-950'
: row.setup === 'COILING'
? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
: 'bg-slate-800 text-slate-300'
}`}
>
{row.setup}
</span>
</td>
<td className="py-3 px-4">
<span
className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
row.signal === 'EARLY POP'
? 'bg-emerald-400 text-slate-950'
: 'bg-blue-900/70 text-blue-200'
}`}
>
{row.signal}
</span>
</td>
<td className="py-3 px-4 text-right">
<button
type="button"
onClick={() =>
setLockedSymbol(isLocked ? null : row.symbol)
}
className={`px-3 py-1.5 rounded text-xs font-bold border transition ${
isLocked
? 'bg-cyan-400 text-slate-950 border-cyan-300'
: 'bg-[#07132b] text-blue-100 border-blue-700 hover:border-cyan-400'
}`}
>
{isLocked ? 'LOCKED' : 'LOCK'}
</button>
</td>
</tr>
);
})}
{filteredRows.length === 0 && (
<tr>
<td
colSpan={9}
className="py-8 px-4 text-center text-blue-300/70"
>
No matching tickers for current filter.
</td>
</tr>
)}
</tbody>
</table>
</section>
</div>
</main>
);
}
