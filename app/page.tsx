'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export default function HomePage() {
const [stocks, setStocks] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [lastSync, setLastSync] = useState('');
const [filterText, setFilterText] = useState('');
const [lockedTicker, setLockedTicker] = useState(null);

const fetchSetups = useCallback(async () => {
setLoading(true);
setError('');
try {
const res = await fetch('/api/scanner', { cache: 'no-store' });
const data = await res.json();

if (!res.ok || data.success === false) {
throw new Error(data.error || 'Scanner API returned an error');
}

const list = Array.isArray(data.stocks) ? data.stocks : [];
setStocks(list);

setLastSync(
new Date().toLocaleTimeString('en-US', {
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
})
);
} catch (err) {
setError(err.message || 'Could not load scanner setups');
setStocks([]);
} finally {
setLoading(false);
}
}, []);

useEffect(() => {
fetchSetups();
}, [fetchSetups]);

const lockedStock = useMemo(
() => stocks.find((s) => s.ticker === lockedTicker) || null,
[stocks, lockedTicker]
);

const visibleStocks = useMemo(() => {
const term = filterText.trim().toLowerCase();
if (!term) return stocks;
return stocks.filter(
(s) =>
String(s.ticker || '').toLowerCase().includes(term) ||
String(s.name || '').toLowerCase().includes(term)
);
}, [stocks, filterText]);

return (
<main className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-6">
<div className="max-w-5xl mx-auto space-y-4">
<div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5 flex flex-wrap items-center justify-between gap-4">
<div>
<span className="inline-block rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-400 mb-2">
ROLLING MOMENTUM CO-PILOT
</span>
<h1 className="text-2xl font-bold text-white">
Speedy Early-Ignition Engine
</h1>
<p className="text-sm text-slate-400 mt-1">
Click &quot;Lock Position&quot; on the stock you buy to track live hold vs. rotation signals.
</p>
{lockedStock && (
<p className="text-xs text-emerald-400 mt-2">
Locked: <strong>{lockedStock.ticker}</strong> (Score {lockedStock.score}) — Rotate when a challenger leads by 12+ pts.
</p>
)}
</div>

<div className="flex items-center gap-3">
<span className="text-xs text-slate-400">
Sync: {lastSync || '--:--:--'}
</span>
<button
type="button"
onClick={fetchSetups}
disabled={loading}
className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white cursor-pointer"
>
{loading ? 'SYNCING...' : 'REFRESH'}
</button>
</div>
</div>

<input
type="text"
value={filterText}
onChange={(e) => setFilterText(e.target.value)}
placeholder="Filter by ticker or company name..."
className="w-full rounded-xl border border-slate-800 bg-[#0d1526] px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
/>

<div className="rounded-xl border border-slate-800 bg-[#0d1526] overflow-x-auto">
<table className="w-full text-left border-collapse text-sm">
<thead>
<tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
<th className="py-3 px-4">TICKER</th>
<th className="py-3 px-4">PRICE / CHG</th>
<th className="py-3 px-4">REL VOL</th>
<th className="py-3 px-4">SCORE</th>
<th className="py-3 px-4">SETUP</th>
<th className="py-3 px-4">SIGNAL</th>
<th className="py-3 px-4 text-right">PILOT ACTION</th>
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
? 'Loading intraday setups...'
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
className="border-b border-slate-800/60 hover:bg-slate-800/30"
>
<td className="py-3 px-4 font-bold text-white">
{stock.ticker}
</td>
<td className="py-3 px-4">
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
<td className="py-3 px-4 text-slate-200">
{Number(stock.relVol).toFixed(2)}x
</td>
<td className="py-3 px-4 font-semibold text-sky-300">
{stock.score}
</td>
<td className="py-3 px-4 text-xs font-medium text-amber-300">
{stock.setup}
</td>
<td className="py-3 px-4 text-xs">
<span className="rounded bg-slate-800 px-2 py-1 text-slate-200">
{stock.signal}
</span>
</td>
<td className="py-3 px-4 text-right">
<button
type="button"
onClick={() =>
setLockedTicker(isLocked ? null : stock.ticker)
}
className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
isLocked
? 'bg-emerald-600 text-white'
: canRotate
? 'bg-amber-500 text-slate-950'
: 'bg-slate-700 hover:bg-slate-600 text-white'
}`}
>
{isLocked
? 'LOCKED'
: canRotate
? 'ROTATE (+12)'
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
