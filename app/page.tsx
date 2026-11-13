
'use client'
import { useState, useEffect } from 'react';

// Define the stock data type
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
// State for data, loading, error, and filtering
const [data, setData] = useState<Stock[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [search, setSearch] = useState<string>('');
const [lastSync, setLastSync] = useState<string>('');

// Function to fetch data from our backend
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
} catch (err: any) {
setError(err.message || 'An unexpected error occurred');
} finally {
setLoading(false);
}
};

// Run on mount and set up polling every 60 seconds
useEffect(() => {
fetchScannerData();
const interval = setInterval(fetchScannerData, 60000);
return () => clearInterval(interval);
}, []);

// Filter data based on search input
const filteredData = data.filter(item =>
item.symbol.toLowerCase().includes(search.toLowerCase()) ||
item.name.toLowerCase().includes(search.toLowerCase())
);

return (
<main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
<div className="max-w-7xl mx-auto space-y-6">
{/* Header Section */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg gap-4">
<div>
<div className="inline-block bg-blue-600 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
Live Market Scanner
</div>
<h1 className="text-3xl font-extrabold tracking-tight text-white">Speedy Early-Ignition Engine</h1>
<p className="text-slate-400 text-sm mt-1">Real-time tracking of momentum gainers and early breakout setups.</p>
</div>
<div className="flex items-center gap-4">
{lastSync && <span className="text-xs text-slate-400">Last sync: {lastSync}</span>}
<button
onClick={fetchScannerData}
className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow"
>
Refresh Feed
</button>
</div>
</div>

{/* Search Bar */}
<div className="relative">
<input
type="text"
placeholder="Search ticker or company name..."
value={search}
onChange={(e) => setSearch(e.target.value)}
className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
/>
</div>

{/* Error Display */}
{error && (
<div className="bg-red-950/50 border border-red-800 text-red-200 p-4 rounded-xl text-sm">
<strong>Scanner Error:</strong> {error}. Make sure FMP_API_KEY is set in Vercel.
</div>
)}

{/* Data Table */}
<div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-slate-800 text-xs uppercase text-slate-400 bg-slate-950/50">
<th className="p-4">Ticker / Company</th>
<th className="p-4 text-right">Price / Change</th>
<th className="p-4 text-right">Volume</th>
<th className="p-4 text-right">Rel Vol</th>
<th className="p-4 text-right">Momentum Score</th>
<th className="p-4 text-right">Classification</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-800 text-sm">
{loading && data.length === 0 ? (
<tr>
<td colSpan={6} className="p-8 text-center text-slate-500">Scanning market feeds...</td>
</tr>
) : filteredData.length === 0 ? (
<tr>
<td colSpan={6} className="p-8 text-center text-slate-500">No active setups matching criteria right now.</td>
</tr>
) : (
filteredData.map((stock) => (
<tr key={stock.symbol} className="hover:bg-slate-800/50 transition">
<td className="p-4">
<div className="font-bold text-white">{stock.symbol}</div>
<div className="text-xs text-slate-400 truncate max-w-xs">{stock.name}</div>
</td>
<td className="p-4 text-right">
<div className="font-semibold">${stock.price.toFixed(2)}</div>
<div className={`text-xs font-medium ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
</div>
</td>
<td className="p-4 text-right font-mono text-slate-300">
{stock.volume.toLocaleString()}
</td>
<td className="p-4 text-right font-mono text-slate-300">
{stock.relVolume}x
</td>
<td className="p-4 text-right font-mono font-bold text-blue-400">
{stock.score} / 100
</td>
<td className="p-4 text-right">
<span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
stock.classification === 'EARLY IGNITION' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
stock.classification === 'BREAKOUT RUN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
'bg-blue-500/10 text-blue-400 border border-blue-500/20'
}`}>
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
