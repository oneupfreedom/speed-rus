
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
}

export default function Home() {
const [data, setData] = useState<Stock[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [search, setSearch] = useState<string>('');
const [lastSync, setLastSync] = useState<string>('');

const fetchScannerData = async () => {
try {
const res = await fetch('/api/scanner');
const json = await res.json();

if (json.success) {
setData(json.data);
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

const filteredData = data.filter(
(item) =>
item.symbol.toLowerCase().includes(search.toLowerCase()) ||
item.name.toLowerCase().includes(search.toLowerCase())
);

return (
<main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500 selection:text-black">
<div className="max-w-7xl mx-auto space-y-6">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl shadow-2xl gap-4">
<div>
<div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
<span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
Live Momentum Feed
</div>
<h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
Speedy Early-Ignition Engine
</h1>
<p className="text-slate-400 text-sm mt-1">
Real-time tracking of explosive market gainers and breakout setups.
</p>
</div>
<div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
{lastSync && <span className="text-xs text-slate-400 font-mono">Sync: {lastSync}</span>}
<button
onClick={fetchScannerData}
className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-xs tracking-wide uppercase transition shadow-lg shadow-cyan-900/20 active:scale-95"
>
Refresh Feed
</button>
</div>
</div>

<div className="relative">
<input
type="text"
placeholder="Filter by ticker or company name..."
value={search}
onChange={(e) => setSearch(e.target.value)}
className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner transition"
/>
</div>

{error && (
<div className="bg-red-950/60 border border-red-800 text-red-200 p-4 rounded-xl text-sm flex items-center gap-3">
<span className="font-bold">Notice:</span> {error}
</div>
)}

<div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60 font-semibold">
<th className="p-4">Ticker / Company</th>
<th className="p-4 text-right">Price / Change</th>
<th className="p-4 text-right">Volume</th>
<th className="p-4 text-right">Rel Vol</th>
<th className="p-4 text-right">Momentum Score</th>
<th className="p-4 text-right">Classification</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-800/60 text-sm">
{loading && data.length === 0 ? (
<tr>
<td colSpan={6} className="p-12 text-center text-slate-500 font-mono animate-pulse">
Scanning live market nodes...
</td>
</tr>
) : filteredData.length === 0 ? (
<tr>
<td colSpan={6} className="p-12 text-center text-slate-500">
No active setups matching your filter criteria right now.
</td>
</tr>
) : (
filteredData.map((stock) => (
<tr key={stock.symbol} className="hover:bg-slate-800/40 transition group">
<td className="p-4">
<div className="font-extrabold text-white text-base tracking-wide group-hover:text-cyan-400 transition">
{stock.symbol}
</div>
<div className="text-xs text-slate-400 truncate max-w-xs">{stock.name}</div>
</td>
<td className="p-4 text-right">
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
<td className="p-4 text-right font-mono text-slate-300 text-xs">
{stock.volume.toLocaleString()}
</td>
<td className="p-4 text-right font-mono text-cyan-300 text-xs font-semibold">
{stock.relVolume}x
</td>
<td className="p-4 text-right font-mono font-black text-amber-400 text-base">
{stock.score}{' '}
<span className="text-xs text-slate-500 font-normal">/ 100</span>
</td>
<td className="p-4 text-right">
<span
className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase shadow-sm ${
stock.classification === 'EARLY IGNITION'
? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-amber-500/10'
: stock.classification === 'BREAKOUT RUN'
? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-emerald-500/10'
: 'bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-blue-500/10'
}`}
>
{stock.classification}
</span>
</td>
</tr>
))
)}
</tbody>
</table>
</div>
</div>
</div>
</main>
);
}
