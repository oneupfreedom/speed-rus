'use client';

import { useState, useEffect } from 'react';

interface Stock {
symbol: string;
name: string;
price: number;
change: number;
volume: number;
relVolume: number;
score: number;
classification: string;
actionAdvice: string;
}

export default function Home() {
const [data, setData] = useState<Stock[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [search, setSearch] = useState<string>('');
const [lastSync, setLastSync] = useState<string>('');
const [activeHolding, setActiveHolding] = useState<string | null>(null);

const fetchScannerData = async () => {
try {
const res = await fetch('/api/scanner');
const json = await res.json();

if (json.success) {
const currentHour = new Date().getHours();
const isAfternoon = currentHour >= 12;

const enhancedData = (json.data || []).map((stock: any, index: number) => {
let actionAdvice = 'MONITOR';
if (index === 0) {
actionAdvice = 'TOP LEADER';
} else if (index === 1 || index === 2) {
actionAdvice = 'CHALLENGER';
} else if (isAfternoon && stock.change > 8) {
actionAdvice = 'PM RUNNER';
}

return {
...stock,
actionAdvice,
};
});

setData(enhancedData);
setLastSync(new Date().toLocaleTimeString());
setError(null);
} else {
setError(json.error || 'Failed to fetch scanner data');
}
} catch (err) {
const message = err instanceof Error ? err.message : 'An unexpected error occurred';
setError(message);
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchScannerData();
const interval = setInterval(fetchScannerData, 60000);
return () => clearInterval(interval);
}, []);

// Rolling Decision Logic: Compare locked-in stock against the #1 market leader
const heldStock = data.find((s) => s.symbol === activeHolding);
const topStock = data.length > 0 ? data[0] : null;
const scoreGap = heldStock && topStock ? topStock.score - heldStock.score : 0;

// Require at least a 12-point lead and positive momentum before advising a switch
const shouldRotate =
heldStock &&
topStock &&
topStock.symbol !== heldStock.symbol &&
scoreGap >= 12 &&
topStock.change > 2;

const filteredData = data.filter(
(item) =>
item.symbol.toLowerCase().includes(search.toLowerCase()) ||
item.name.toLowerCase().includes(search.toLowerCase())
);

return (
<main className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6 font-sans selection:bg-cyan-500 selection:text-black">
<div className="max-w-7xl mx-auto space-y-5">

{/* Header Section */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl shadow-2xl gap-4">
<div>
<div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
<span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
Rolling Momentum Co-Pilot
</div>
<h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
Speedy Early-Ignition Engine
</h1>
<p className="text-slate-400 text-xs md:text-sm mt-1">
Click &quot;Lock Position&quot; on the stock you buy to track live hold vs. rotation signals.
</p>
</div>
<div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
{lastSync && <span className="text-xs text-slate-400 font-mono">Sync: {lastSync}</span>}
<button
onClick={fetchScannerData}
className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold px-3.5 py-2 rounded-lg text-xs tracking-wide uppercase transition shadow-lg shadow-cyan-900/20 active:scale-95"
>
Refresh
</button>
</div>
</div>

{/* Live Rolling Decision Banner */}
{heldStock ? (
shouldRotate && topStock ? (
<div className="bg-gradient-to-r from-amber-950/90 via-orange-950/80 to-slate-900 border-2 border-amber-500 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
<div>
<div className="text-xs font-black uppercase tracking-widest text-amber-400 mb-1">
⚡ ROTATION SIGNAL TRIGGERED (+{scoreGap} PT MOMENTUM ADVANTAGE)
</div>
<div className="text-lg md:text-xl font-extrabold text-white">
SWITCH &amp; BUY <span className="text-cyan-400">{topStock.symbol}</span> NOW (${topStock.price.toFixed(2)} | {topStock.change >= 0 ? '+' : ''}{topStock.change.toFixed(2)}%)
</div>
<p className="text-xs text-amber-200/80 mt-0.5">
{topStock.symbol} (Score {topStock.score}) has overtaken your {heldStock.symbol} position (Score {heldStock.score}).
</p>
</div>
<div className="flex items-center gap-2">
<button
onClick={() => setActiveHolding(topStock.symbol)}
className="bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition"
>
Roll Into {topStock.symbol}
</button>
<button
onClick={() => setActiveHolding(null)}
className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-lg text-xs"
>
Exit
</button>
</div>
</div>
) : (
<div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/60 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
<div>
<div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">
✅ POSITION STATUS: HOLDING STRONG
</div>
<div className="text-lg font-extrabold text-white">
STICK WITH <span className="text-emerald-400">{heldStock.symbol}</span> (${heldStock.price.toFixed(2)} | {heldStock.change >= 0 ? '+' : ''}{heldStock.change.toFixed(2)}% | Score: {heldStock.score})
</div>
<p className="text-xs text-emerald-200/70 mt-0.5">
No challenger has cleared the +12 point rotation buffer yet. Stay with your leader.
</p>
</div>
<button
onClick={() => setActiveHolding(null)}
className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider"
>
Clear Position
</button>
</div>
)
) : topStock ? (
<div className="bg-slate-900/90 border border-cyan-500/40 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
<div className="text-xs md:text-sm text-slate-300">
<span className="font-bold text-cyan-400 uppercase tracking-wider mr-2">Morning Pick Ready:</span>
<span className="font-extrabold text-white">{topStock.symbol}</span> is currently #1 (Score <span className="text-amber-400 font-bold">{topStock.score}</span>). Click <span className="text-white font-semibold">&quot;Lock Position&quot;</span> once you buy in.
</div>
</div>
) : null}

{/* Search Bar */}
<div>
<input
type="text"
placeholder="Filter by ticker or company name..."
value={search}
onChange={(e) => setSearch(e.target.value)}
className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
/>
</div>

{/* Error Display */}
{error && (
<div className="bg-red-950/60 border border-red-800 text-red-200 p-4 rounded-xl text-sm">
<span className="font-bold">Notice:</span> {error}
</div>
)}

{/* Data Table Container */}
<div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 bg-slate-950/60 font-semibold">
<th className="px-3 py-3">Ticker</th>
<th className="px-2.5 py-3 text-right">Price / Chg</th>
<th className="px-2.5 py-3 text-right">Rel Vol</th>
<th className="px-2.5 py-3 text-right">Score</th>
<th className="px-2.5 py-3 text-center">Setup</th>
<th className="px-2.5 py-3 text-center">Signal</th>
<th className="px-3 py-3 text-right">Pilot Action</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-800/60 text-xs md:text-sm">
{loading && data.length === 0 ? (
<tr>
<td colSpan={7} className="p-10 text-center text-slate-500 font-mono animate-pulse">
Scanning market-wide gainers &amp; watchlist...
</td>
</tr>
) : filteredData.length === 0 ? (
<tr>
<td colSpan={7} className="p-10 text-center text-slate-500">
No active setups matching your filter criteria.
</td>
</tr>
) : (
filteredData.map((stock) => {
const isLocked = activeHolding === stock.symbol;
return (
<tr
key={stock.symbol}
className={`transition group ${
isLocked ? 'bg-emerald-950/30 hover:bg-emerald-950/40' : 'hover:bg-slate-800/40'
}`}
>
<td className="px-3 py-3">
<div className="font-extrabold text-white text-sm md:text-base tracking-wide group-hover:text-cyan-400 transition">
{stock.symbol}
</div>
<div className="text-[11px] text-slate-400 truncate max-w-[120px] md:max-w-[180px]">
{stock.name}
</div>
</td>
<td className="px-2.5 py-3 text-right">
<div className="font-bold text-slate-200">${stock.price.toFixed(2)}</div>
<div
className={`text-xs font-bold ${
stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
}`}
>
{stock.change >= 0 ? '+' : ''}
{stock.change.toFixed(2)}%
</div>
</td>
<td className="px-2.5 py-3 text-right font-mono text-cyan-300 text-xs font-semibold">
{stock.relVolume}x
</td>
<td className="px-2.5 py-3 text-right font-mono font-black text-amber-400 text-sm md:text-base">
{stock.score}
</td>
<td className="px-2.5 py-3 text-center">
<span
className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
stock.classification === 'EARLY IGNITION'
? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
: stock.classification === 'BREAKOUT RUN'
? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
: 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
}`}
>
{stock.classification}
</span>
</td>
<td className="px-2.5 py-3 text-center">
<span
className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
stock.actionAdvice === 'TOP LEADER'
? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
: stock.actionAdvice === 'CHALLENGER'
? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
: 'bg-slate-800 text-slate-400 border border-slate-700'
}`}
>
{stock.actionAdvice}
</span>
</td>
<td className="px-3 py-3 text-right">
{isLocked ? (
<span className="inline-block bg-emerald-500 text-black font-black px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider">
Holding
</span>
) : (
<button
onClick={() => setActiveHolding(stock.symbol)}
className="bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider transition"
>
Lock Position
</button>
)}
</td>
</tr>
);
})
)}
</tbody>
</table>
</div>
</div>
</div>
</main>
);
}
