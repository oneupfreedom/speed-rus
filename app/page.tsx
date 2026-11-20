
'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface ThreePointCheck {
passedCount: number;
passPctBand: boolean;
passTorqueCap: boolean;
passRelVol: boolean;
}

interface ScannerRow {
symbol: string;
name?: string;
price: number;
changePercent: number;
relVol: number;
score: number;
setup: string;
signal: string;
isPrimeEarlyCoil?: boolean;
isCoiling?: boolean;
threePoint?: ThreePointCheck;
}

export default function ScannerPage() {
const [rows, setRows] = useState<ScannerRow[]>([]);
const [filterText, setFilterText] = useState('');
const [customInput, setCustomInput] = useState('');
const [customTickers, setCustomTickers] = useState<string[]>([]);
const [primeOnly, setPrimeOnly] = useState(false);
const [coilPoperoOnly, setCoilPoperoOnly] = useState(false);
const [lockedSymbol, setLockedSymbol] = useState<string | null>(null);
const [lastSync, setLastSync] = useState<string>('');
const [loading, setLoading] = useState<boolean>(false);
const [errorMsg, setErrorMsg] = useState<string | null>(null);

const fetchScanner = useCallback(
async (extraList: string[] = customTickers) => {
setLoading(true);
setErrorMsg(null);
try {
const query =
extraList.length > 0
? `?symbols=${encodeURIComponent(extraList.join(','))}`
: '';
const res = await fetch(`/api/scanner${query}`, { cache: 'no-store' });
const data = await res.json();
if (!res.ok) {
throw new Error(data?.error || 'Failed to load scanner');
}
setRows(Array.isArray(data?.rows) ? data.rows : []);
setLastSync(new Date().toLocaleTimeString());
} catch (err: unknown) {
const message =
err instanceof Error ? err.message : 'Unable to sync scanner';
setErrorMsg(message);
} finally {
setLoading(false);
}
},
[customTickers]
);

useEffect(() => {
fetchScanner(customTickers);
const interval = setInterval(() => fetchScanner(customTickers), 30000);
return () => clearInterval(interval);
}, [fetchScanner, customTickers]);

const handleAddCustomTickers = (e: React.FormEvent) => {
e.preventDefault();
const parsed = customInput
.split(',')
.map((s) => s.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, ''))
.filter(Boolean);

if (parsed.length === 0) return;

const merged = [...new Set([...parsed, ...customTickers])].slice(0, 30);
setCustomTickers(merged);
setCustomInput('');
fetchScanner(merged);
};

const lockedRow = lockedSymbol
? rows.find((r) => r.symbol === lockedSymbol) || null
: null;

const strongerLeader = lockedRow
? rows.find(
(r) =>
r.symbol !== lockedRow.symbol && r.score - lockedRow.score >= 12
) || null
: null;

const coilPoperoLeader =
rows.find((r) => r.isPrimeEarlyCoil) ||
rows.find((r) => r.setup === 'COIL POP') ||
rows.find(
(r) =>
r.isCoiling &&
r.changePercent >= 1.2 &&
r.changePercent <= 3.0
) ||
rows[0] ||
null;

const filteredRows = rows.filter((row) => {
const query = filterText.trim().toLowerCase();
const matchesSearch =
!query ||
row.symbol.toLowerCase().includes(query) ||
(row.name && row.name.toLowerCase().includes(query)) ||
row.setup.toLowerCase().includes(query) ||
row.signal.toLowerCase().includes(query);

if (primeOnly && !row.isPrimeEarlyCoil) return false;
if (
coilPoperoOnly &&
row.setup !== 'COIL POP' &&
!row.isPrimeEarlyCoil
) {
return false;
}
return matchesSearch;
});

return (
<main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
<div className="max-w-6xl mx-auto space-y-6">
<header className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 md:p-6 shadow-xl">
<div className="text-xs font-bold tracking-widest uppercase text-sky-400 mb-1">
Coil-to-Coil Momentum Co-Pilot
</div>
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
<div>
<h1 className="text-2xl md:text-3xl font-bold text-white">
Speedy Early-Ignition Engine
</h1>
<p className="text-sm text-slate-400 mt-1">
Lock your active coil pop—the scanner warns you when momentum
stalls or a +12 pt coil overtakes it.
</p>
{lockedRow && (
<div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
<span>Locked: {lockedRow.symbol}</span>
<span>·</span>
<span>Score {lockedRow.score}</span>
<span>·</span>
<span>{lockedRow.setup}</span>
</div>
)}
</div>

<div className="flex items-center gap-3">
<span className="text-xs text-slate-400">
Auto-Sync (30s): {lastSync || '--:--:--'}
</span>
<button
type="button"
onClick={() => fetchScanner(customTickers)}
disabled={loading}
className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold tracking-wider uppercase transition"
>
{loading ? 'Syncing...' : 'Refresh'}
</button>
</div>
</div>

{coilPoperoLeader && (
<div className="mt-4 rounded-xl bg-sky-500/10 border border-sky-400/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
<div>
<div className="text-[11px] font-extrabold tracking-widest uppercase text-sky-300">
Coil Popero Spotlight
</div>
<div className="text-base font-bold text-white mt-0.5">
{coilPoperoLeader.symbol}{' '}
<span className="text-sm font-normal text-slate-300">
(${coilPoperoLeader.price.toFixed(2)} ·{' '}
{coilPoperoLeader.changePercent >= 0 ? '+' : ''}
{coilPoperoLeader.changePercent.toFixed(2)}% ·{' '}
{coilPoperoLeader.relVol.toFixed(2)}x Rel Vol)
</span>
</div>
<div className="text-xs text-slate-300 mt-0.5">
Setup: <strong>{coilPoperoLeader.setup}</strong> · Signal:{' '}
<strong>{coilPoperoLeader.signal}</strong> · Score:{' '}
<strong>{coilPoperoLeader.score}</strong>
</div>
</div>

<div className="flex items-center gap-2">
<button
type="button"
onClick={() =>
setLockedSymbol(
lockedSymbol === coilPoperoLeader.symbol
? null
: coilPoperoLeader.symbol
)
}
className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold uppercase transition"
>
{lockedSymbol === coilPoperoLeader.symbol
? 'Locked'
: `Lock ${coilPoperoLeader.symbol}`}
</button>
</div>
</div>
)}

{strongerLeader && lockedRow && (
<div className="mt-4 rounded-xl bg-amber-500/15 border border-amber-400/50 p-3.5 text-amber-200 text-sm flex flex-wrap items-center justify-between gap-2">
<span>
<strong>Switch Warning:</strong> {strongerLeader.symbol} (Score{' '}
{strongerLeader.score} · {strongerLeader.setup}) is +
{strongerLeader.score - lockedRow.score} pts ahead of{' '}
{lockedRow.symbol} (Score {lockedRow.score}).
</span>
<button
type="button"
onClick={() => setLockedSymbol(strongerLeader.symbol)}
className="px-3 py-1 rounded bg-amber-400 text-slate-950 text-xs font-extrabold uppercase"
>
Switch to {strongerLeader.symbol}
</button>
</div>
)}

{errorMsg && (
<div className="mt-4 rounded-xl bg-rose-500/15 border border-rose-500/40 p-3 text-rose-200 text-sm">
{errorMsg}
</div>
)}
</header>

<section className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 md:p-6">
<form
onSubmit={handleAddCustomTickers}
className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4"
>
<input
type="text"
value={customInput}
onChange={(e) => setCustomInput(e.target.value)}
placeholder="Add custom tickers (e.g. SOFI, RKLB, IONQ)..."
className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
/>
<button
type="submit"
className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold tracking-wider uppercase transition"
>
+ Add Ticker
</button>
{customTickers.length > 0 && (
<button
type="button"
onClick={() => {
setCustomTickers([]);
fetchScanner([]);
}}
className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-bold uppercase transition"
>
Clear ({customTickers.length})
</button>
)}
</form>

<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
<input
type="text"
value={filterText}
onChange={(e) => setFilterText(e.target.value)}
placeholder="Filter by ticker, company, or COIL POP..."
className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
/>
<button
type="button"
onClick={() => setCoilPoperoOnly((prev) => !prev)}
className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase border transition ${
coilPoperoOnly
? 'bg-sky-500/20 border-sky-400 text-sky-300'
: 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
}`}
>
{coilPoperoOnly ? '✓ COIL POPERO ON' : 'COIL POPERO'}
</button>
<button
type="button"
onClick={() => setPrimeOnly((prev) => !prev)}
className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase border transition ${
primeOnly
? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
: 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
}`}
>
{primeOnly ? '✓ PRIME 1.5–2.3% ON' : 'PRIME 1.5–2.3% ONLY'}
</button>
</div>

<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-slate-800 text-[11px] font-bold tracking-wider uppercase text-slate-400">
<th className="py-3 px-3">Ticker</th>
<th className="py-3 px-3">Price / Chg</th>
<th className="py-3 px-3">Rel Vol</th>
<th className="py-3 px-3">Score</th>
<th className="py-3 px-3">Setup</th>
<th className="py-3 px-3">Signal</th>
<th className="py-3 px-3 text-right">Action</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-800/70 text-sm">
{filteredRows.length === 0 ? (
<tr>
<td colSpan={7} className="py-8 text-center text-slate-400">
{primeOnly
? 'No stocks currently match PRIME 1.5–2.3% + 3/3 checks. Toggle off PRIME 1.5–2.3% ONLY to view all tickers.'
: coilPoperoOnly
? 'No COIL POPERO rows match right now. Toggle COIL POPERO off or add custom tickers above.'
: 'No scanner tickers match your current filter.'}
</td>
</tr>
) : (
filteredRows.map((row) => {
const isLocked = lockedSymbol === row.symbol;
const isPositive = row.changePercent >= 0;

return (
<tr
key={row.symbol}
className={`transition ${
isLocked ? 'bg-sky-500/10' : 'hover:bg-slate-800/40'
}`}
>
<td className="py-3.5 px-3 font-bold text-white">
<div>{row.symbol}</div>
{row.name && (
<div className="text-xs font-normal text-slate-400 truncate max-w-[160px]">
{row.name}
</div>
)}
</td>

<td className="py-3.5 px-3">
<div className="font-semibold text-white">
${row.price.toFixed(2)}
</div>
<div
className={`text-xs font-semibold ${
isPositive ? 'text-emerald-400' : 'text-rose-400'
}`}
>
({isPositive ? '+' : ''}
{row.changePercent.toFixed(2)}%)
</div>
</td>

<td className="py-3.5 px-3 font-medium text-slate-200">
{row.relVol.toFixed(2)}x
</td>

<td className="py-3.5 px-3 font-bold text-sky-300">
{row.score}
</td>

<td className="py-3.5 px-3">
<div className="flex flex-col items-start gap-1">
<span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
{row.setup}
</span>

{row.isPrimeEarlyCoil ? (
<span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
PRIME 1.5–2.3% · 3/3 PASS
</span>
) : row.setup === 'COIL POP' && row.threePoint ? (
<span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
{row.threePoint.passedCount}/3 CHECKS
</span>
) : null}
</div>
</td>

<td className="py-3.5 px-3">
<span className="px-2.5 py-1 rounded text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-400/30">
{row.signal}
</span>
</td>

<td className="py-3.5 px-3 text-right">
<button
type="button"
onClick={() =>
setLockedSymbol(isLocked ? null : row.symbol)
}
className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
isLocked
? 'bg-emerald-500 text-slate-950'
: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
}`}
>
{isLocked ? 'Locked' : 'Lock'}
</button>
</td>
</tr>
);
})
)}
</tbody>
</table>
</div>
</section>
</div>
</main>
);
}
