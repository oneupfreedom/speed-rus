'use client'
import { useState, useEffect } from 'react';

// Define the stock data type for clarity
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
// State for data, loading status, and filtering
const [data, setData] = useState<Stock[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [search, setSearch] = useState<string>('');
const [lastSync, setLastSync] = useState<string>('');

// Function to fetch and process data from our new API route
const fetchScannerData = async () => {
try {
setLoading(true);
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
const interval = setInterval(fetchScannerData, 60000); // 1 minute
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
