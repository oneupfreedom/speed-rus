'use client';

import { useState, useEffect } from 'react';

export default function Home() {
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [lastSync, setLastSync] = useState('');
const [searchTerm, setSearchTerm] = useState('');

const fetchLiveData = async () => {
setLoading(true);
try {
const res = await fetch('/api/scanner');
const json = await res.json();
if (json.success && json.data) {
setData(json.data);
setLastSync(new Date().toLocaleTimeString());
}
} catch (err) {
console.error('Failed to load scanner data:', err);
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchLiveData();
}, []);

const filteredData = data.filter((item: any) =>
item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
item.company.toLowerCase().includes(searchTerm.toLowerCase())
);

return (
<main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
<div className="max-w-4xl mx-auto space-y-6">
{/* Header */}
<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
<div>
<span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">⚡ Live Market Scanner</span>
<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Speedy Short-Squeeze Engine</h1>
<p className="text-slate-400 text-sm mt-1">Real-time tracking of market momentum and live stock performance.</p>
</div>
<button
onClick={fetchLiveData}
disabled={loading}
className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
>
{loading ? 'Refreshing...' : '🔄 Refresh Feed'}
</button>
</div>
<div className="text-xs text-slate-400">Last sync: {lastSync || 'Connecting...'}</div>
</div>

{/* Search */}
<div className="relative">
<input
type="text"
placeholder="Search ticker or company name..."
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
/>
</div>

{/* Results List */}
<div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
<div className="grid grid-cols-4 p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
<div>Ticker / Company</div>
<div>Price / Change</div>
<div>Short Interest</div>
<div>Float Vol</div>
</div>

{loading && data.length === 0 ? (
<div className="p-8 text-center text-slate-400">Loading live data from Polygon...</div>
) : filteredData.length === 0 ? (
<div className="p-8 text-center text-slate-400">No matching tickers found.</div>
) : (
filteredData.map((item: any, idx: number) => (
<div key={idx} className="grid grid-cols-4 p-4 items-center border-b border-slate-800/50 hover:bg-slate-800/30 transition">
<div>
<div className="font-bold text-white">{item.ticker}</div>
<div className="text-xs text-slate-400">{item.company}</div>
</div>
<div>
<div className="font-semibold text-white">${item.price}</div>
<div className={`text-xs font-medium ${item.change.toString().startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
{item.change}%
</div>
</div>
<div className="text-sm font-medium text-slate-200">{item.shortInterest}</div>
<div className="text-sm font-medium text-slate-200">{item.floatVol}</div>
</div>
))
)}
</div>
</div>
</main>
);
}
