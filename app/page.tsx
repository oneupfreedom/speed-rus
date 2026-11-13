'use client';

import { useState, useEffect } from 'react';

export default function ScannerDashboard() {
const [marketMode, setMarketMode] = useState('LOADING...');
const [topContender, setTopContender] = useState<any>(null);
const [allSetups, setAllSetups] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [loading, setLoading] = useState(true);
const [lastSync, setLastSync] = useState('');

const fetchScannerData = async () => {
setLoading(true);
try {
const res = await fetch('/api/scanner');
const data = await res.json();
if (data && data.allSetups) {
setMarketMode(data.marketMode);
setTopContender(data.topContender);
setAllSetups(data.allSetups);
setLastSync(new Date().toLocaleTimeString());
}
} catch (error) {
console.error('Failed to fetch scanner data', error);
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchScannerData();
const interval = setInterval(fetchScannerData, 30000); // Auto-refresh every 30s
return () => clearInterval(interval);
}, []);

const filteredSetups = allSetups.filter((item: any) =>
item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
item.name.toLowerCase().includes(searchTerm.toLowerCase())
);

return (
<main className="min-h-screen bg-[#0b0f19] text-white p-6 font-sans">
{/* Header */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-800">
<div>
<div className="flex items-center gap-3">
<span className="bg-blue-600 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">
{marketMode}
</span>
<h1 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
Speedy Short-Squeeze Engine
</h1>
</div>
<p className="text-sm text-gray-400 mt-1">
Real-time tracking of live market gap movers & squeeze setups.
</p>
</div>
<div className="flex items-center gap-4 mt-4 md:mt-0">
<span className="text-xs text-gray-400">Last sync: {lastSync}</span>
<button
onClick={fetchScannerData}
disabled={loading}
className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
>
{loading ? 'Scanning...' : '↻ Refresh Feed'}
</button>
</div>
</div>

{/* #1 Top Contender Banner */}
{topContender && (
<div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-[#121826] border border-blue-500/50 rounded-xl p-5 mb-6 shadow-xl relative overflow-hidden">
<div className="absolute top-0 right-0 bg-blue-500 text-black text-xs font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">
#1 Top Contender
</div>
<div className="flex flex-wrap items-center justify-between gap-4">
<div>
<span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">Target Focus</span>
<h2 className="text-3xl font-black text-white flex items-center gap-2 mt-1">
{topContender.symbol}
<span className="text-sm font-normal text-gray-400">({topContender.name})</span>
</h2>
</div>
<div className="flex items-center gap-6 text-sm">
<div>
<span className="text-gray-400 block text-xs">Price</span>
<span className="text-lg font-bold">${topContender.price}</span>
</div>
<div>
<span className="text-gray-400 block text-xs">Gap / Momentum</span>
<span className="text-lg font-bold text-green-400">+{topContender.gapPercent}%</span>
</div>
<div>
<span className="text-gray-400 block text-xs">Squeeze Score</span>
<span className="text-lg font-bold text-cyan-400">{topContender.squeezeScore}/100</span>
</div>
<div>
<span className="text-gray-400 block text-xs">Verdict</span>
<span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
{topContender.verdict}
</span>
</div>
</div>
</div>
</div>
)}

{/* Search Filter */}
<div className="mb-6">
<input
type="text"
placeholder="Search ticker or company name..."
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
className="w-full md:w-80 bg-[#121826] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
/>
</div>

{/* Table Feed */}
<div className="bg-[#121826] rounded-xl border border-gray-800 overflow-hidden shadow-lg">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider bg-[#1a2234]">
<th className="p-4">Ticker / Company</th>
<th className="p-4">Price / Gap</th>
<th className="p-4">Range Position</th>
<th className="p-4">Squeeze Score</th>
<th className="p-4">Verdict</th>
</tr>
</thead>
<tbody className="divide-y divide-gray-800/60 text-sm">
{filteredSetups.length > 0 ? (
filteredSetups.map((item: any, index) => (
<tr key={index} className="hover:bg-[#1a2234]/50 transition">
<td className="p-4 font-bold text-white">
<div className="flex items-center gap-2">
<span>{item.symbol}</span>
{item.topContender && (
<span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded font-bold">#1</span>
)}
</div>
<span className="text-xs font-normal text-gray-400">{item.name}</span>
</td>
<td className="p-4">
<div className="font-semibold">${item.price}</div>
<div className="text-xs text-green-400">+{item.gapPercent}%</div>
</td>
<td className="p-4">
<div className="flex items-center gap-2">
<div className="w-24 bg-gray-800 h-2 rounded-full overflow-hidden">
<div
className="bg-cyan-400 h-full rounded-full"
style={{ width: `${Math.min(item.rangePosition, 100)}%` }}
/>
</div>
<span className="text-xs text-gray-300">{item.rangePosition}%</span>
</div>
</td>
<td className="p-4 font-bold text-cyan-400">{item.squeezeScore}/100</td>
<td className="p-4">
<span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/20">
{item.verdict}
</span>
</td>
</tr>
))
) : (
<tr>
<td colSpan={5} className="p-8 text-center text-gray-500">
{loading ? 'Loading live market setups...' : 'No active setups matching criteria right now.'}
</td>
</tr>
)}
</tbody>
</table>
</div>
</div>
</main>
);
}
