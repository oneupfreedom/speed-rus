'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface ScannerStock {
ticker: string;
name?: string;
price: number;
changePercent: number;
relVol: number;
rangePosition?: number;
spreadPercent?: number;
score: number;
setup: string;
signal: string;
}

export default function HomePage() {
const [stocks, setStocks] = useState<ScannerStock[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [lastSync, setLastSync] = useState('');
const [filterText, setFilterText] = useState('');
const [lockedTicker, setLockedTicker] = useState<string | null>(null);

const fetchSetups = useCallback(async () => {
setLoading(true);
setError('');
try {
const res = await fetch('/api/scanner', { cache: 'no-store' });
const data = await res.json();

if (!res.ok || data?.success === false) {
throw new Error(data?.error || 'Scanner API returned an error');
}

const list: ScannerStock[] = Array.isArray(data?.stocks) ? data.stocks : [];
setStocks(list);

setLastSync(
new Date().toLocaleTimeString('en-US', {
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
})
);
} catch (err: unknown) {
const message =
err instanceof Error ? err.message : 'Could not load scanner setups';
setError(message);
setStocks([]);
} finally {
setLoading(false);
}
}, []);

useEffect(() => {
fetchSetups();
const timer = setInterval(fetchSetups, 30000);
return () => clearInterval(timer);
}, [fetchSetups]);

const lockedStock = useMemo(
() => stocks.find((s) => s.ticker === lockedTicker) || null,
[stocks, lockedTicker]
);

const switchCandidate = useMemo(() => {
if (!lockedStock) return null;
const betterCoils = stocks
.filter(
(s) =>
s.ticker !== lockedStock.ticker &&
s.score - lockedStock.score >= 12
)
.sort((a, b) => {
if (a.setup === 'COIL POP' && b.setup !== 'COIL POP') return -1;
if (b.setup === 'COIL POP' && a.setup !== 'COIL POP') return 1;
return b.score - a.score;
});
return betterCoils[0] || null;
}, [stocks, lockedStock]);

const lockedWeakening =
lockedStock &&
(lockedStock.setup === 'PULLBACK / DIP' || lockedStock.score < 55);

const visibleStocks = useMemo(() => {
const term = filterText.trim().toLowerCase();
if (!term) return stocks;
return stocks.filter(
(s) =>
String(s.ticker || '').toLowerCase().includes(term) ||
String(s.name || '').toLowerCase().includes(term) ||
String(s.setup || '').toLowerCase().includes(term)
);
}, [stocks, filterText]);

return (
<main className="min-h-screen bg-[#070b14] text-slate-100 p-3 md:p-5">
<div className="max-w-5xl mx-auto space-y-3">
{(switchCandidate || lockedWeakening) && lockedStock && (
<div className="rounded-xl border-2 border-amber-400 bg-amber-500/20 p-4 flex flex-wrap items-center justify-between gap-3">
<div>
<p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
SWITCH WARNING — ROTATION TRIGGERED
</p>
<p className="text-sm font-semibold text-white mt-0.5">
{switchCandidate ? (
<>
<strong>{lockedStock.ticker}</strong> (Score {lockedStock.score}) is lagging{' '}
<strong>{switchCandidate.ticker}</strong> ({switchCandidate.setup}, Score{' '}
{switchCandidate.score}, +{switchCandidate.score - lockedStock.score} pts).
</>
) : (
<>
<strong>{lockedStock.ticker}</strong> is losing momentum ({lockedStock.setup}, Score{' '}
{lockedStock.score}). Watch for a fresh COIL POP to rotate into.
</>
)}
</p>
</div>
{switchCandidate && (
<button
type="button"
onClick={() => setLockedTicker(switchCandidate.ticker)}
className="rounded-lg bg-amber-400 hover:bg-amber-300 px-4 py-2 text-xs font-extrabold text-slate-950 cursor-pointer"
>
SWITCH TO {switchCandidate.ticker}
</button>
)}
</div>
)}

<div className="rounded-xl border border-slate-800 bg-[#0d1526] p-4 flex flex-wrap items-center justify-between gap-3">
<div>
<span className="inline-block rounded-full bg-sky-500/15 px-3 py-0.5 text-xs font-semibold text-sky-400 mb-1.5">
COIL-TO-COIL MOMENTUM CO-PILOT
</span>
<h1 className="text-xl md:text-2xl font-bold text-white">
Speedy Early-Ignition Engine
</h1>
<p className="text-xs md:text-sm text-slate-400 mt-1">
Lock your active coil pop—the scanner warns you when momentum stalls or a +12 pt coil overtakes it.
</p>
{lockedStock && (
<p className="text-xs text-emerald-400 mt-1.5">
Locked: <strong>{lockedStock.ticker}</strong> (Score {lockedStock.score} · {lockedStock.setup})
</p>
)}
</div>

<div className="flex items-center gap-3">
<span className="text-xs text-slate-400">
Auto-Sync (30s): {lastSync || '--:--:--'}
</span>
<button
type="button"
onClick={fetchSetups}
disabled={loading}
className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
>
{loading ? 'SYNCING...' : 'REFRESH'}
</button>
</div>
</div>

<input
type="text"
value={filterText}
onChange={(e) => setFilterText(e.target.value)}
placeholder="Filter by ticker, company, or COIL POP..."
className="w-full rounded-xl border border-slate-800 bg-[#0d1526] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
/>

<div className="rounded-xl border border-slate-800 bg-[#0d1526] overflow-x-auto">
<table className="w-full text-left border-collapse text-xs md:text-sm">
<thead>
<tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
<th className="py-2.5 px-3">TICKER</th>
<th className="py-2.5 px-3">PRICE / CHG</th>
<th className="py-2.5 px-3">REL VOL</th>
<th className="py-2.5 px-3">SCORE</th>
<th className="py-2.5 px-3">SETUP</th>
<th className="py-2.5 px-3">SIGNAL</th>
<th className="py-2.5 px-3 text-right">ACTION</th>
</tr>
</thead>
<tbody>
{error ? (
<tr>
<td colSpan={7} className="py-8 px-4 text-center text-rose-400">
{error}
</td>
</tr>
) : visibleStocks.length === 0 ? (
<tr>
<td colSpan={7} className="py-8 px-4 text-center text-slate-400">
{loading
? 'Scanning for coil pops...'
: 'No active setups matching your filter criteria.'}
</td>
</tr>
) : (
visibleStocks.map((stock) => {
const isLocked = lockedTicker === stock.ticker;
const canRotate =
lockedStock &&
!isLocked &&
stock.score - lockedStock.score >= 12;

return (
<tr
key={stock.ticker}
className={`border-b border-slate-800/60 hover:bg-slate-800/30 ${
stock.setup === 'COIL POP' ? 'bg-amber-500/5' : ''
}`}
>
<td className="py-2.5 px-3 font-bold text-white">
{stock.ticker}
</td>
<td className="py-2.5 px-3">
<span className="font-semibold text-white">
${Number(stock.price).toFixed(2)}
</span>{' '}
<span
className={
stock.changePercent >= 0
? 'text-emerald-400 text-xs'
: 'text-rose-400 text-xs'
}
>
({stock.changePercent >= 0 ? '+' : ''}
{Number(stock.changePercent).toFixed(2)}%)
</span>
</td>
<td className="py-2.5 px-3 text-slate-200">
{Number(stock.relVol).toFixed(2)}x
</td>
<td className="py-2.5 px-3 font-semibold text-sky-300">
{stock.score}
</td>
<td className="py-2.5 px-3 text-xs font-bold">
<span
className={
stock.setup === 'COIL POP'
? 'rounded bg-amber-500/20 px-2 py-0.5 text-amber-300 border border-amber-400/40'
: 'text-slate-300'
}
>
{stock.setup}
</span>
</td>
<td className="py-2.5 px-3 text-xs">
<span className="rounded bg-slate-800 px-2 py-0.5 text-slate-200">
{stock.signal}
</span>
</td>
<td className="py-2.5 px-3 text-right">
<button
type="button"
onClick={() =>
setLockedTicker(isLocked ? null : stock.ticker)
}
className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
isLocked
? 'bg-emerald-600 text-white'
: canRotate
? 'bg-amber-400 text-slate-950 font-extrabold'
: 'bg-slate-700 hover:bg-slate-600 text-white'
}`}
>
{isLocked
? 'LOCKED'
: canRotate
? 'SWITCH (+12)'
: 'Lock Position'}
</button>
</td>
</tr>
);
})
)}
</tbody>
</table>
</div>
</div>
</main>
);
}
