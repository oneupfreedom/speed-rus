'use client';

import { useState, useEffect } from 'react';

export default function ScannerDashboard() {
const [marketMode, setMarketMode] = useState('LIVE MARKET');
const [setups, setSetups] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [loading, setLoading] = useState(false);
const [lastSync, setLastSync] = useState('');

const fetchScannerData = async () => {
setLoading(true);
try {
const res = await fetch('/api/scanner');
const json = await res.json();
if (json.success && Array.isArray(json.data)) {
setSetups(json.data);
setMarketMode(json.marketMode || 'LIVE MARKET');
setLastSync(new Date().toLocaleTimeString());
}
} catch (error) {
console.error('Failed to fetch scanner data:', error);
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchScannerData();
const interval = setInterval(fetchScannerData, 30000);
return () => clearInterval(interval);
}, []);

const filteredSetups = setups.filter(
(item) =>
item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
item.company.toLowerCase().includes(searchQuery.toLowerCase())
);

return (
<main style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
<div style={{ maxWidth: '1200px', margin: '0 auto' }}>

{/* Header */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
<div>
<span style={{ backgroundColor: '#1e3a8a', color: '#60a5fa', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
{marketMode} SCANNER
</span>
<h1 style={{ fontSize: '28px', margin: '8px 0 4px 0', fontWeight: 'bold' }}>Speedy Early-Ignition Engine</h1>
<p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Real-time tracking of momentum gainers and early breakout setups.</p>
</div>
<div style={{ textAlign: 'right' }}>
<button
onClick={fetchScannerData}
disabled={loading}
style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
>
{loading ? 'Scanning...' : 'Refresh Feed'}
</button>
{lastSync && <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>Last sync: {lastSync}</div>}
</div>
</div>

{/* Search Bar */}
<div style={{ marginBottom: '20px' }}>
<input
type="text"
placeholder="Search ticker or company name..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
style={{ width: '100%', maxWidth: '350px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff' }}
/>
</div>

{/* Results Table */}
<div style={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
<thead>
<tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '12px' }}>
<th style={{ padding: '12px 16px' }}>TICKER / COMPANY</th>
<th style={{ padding: '12px 16px' }}>PRICE / CHANGE</th>
<th style={{ padding: '12px 16px' }}>VOLUME</th>
<th style={{ padding: '12px 16px' }}>MOMENTUM SCORE</th>
<th style={{ padding: '12px 16px' }}>VERDICT</th>
</tr>
</thead>
<tbody>
{filteredSetups.length > 0 ? (
filteredSetups.map((stock, index) => (
<tr key={index} style={{ borderBottom: '1px solid #334155' }}>
<td style={{ padding: '14px 16px' }}>
<div style={{ fontWeight: 'bold', color: '#38bdf8' }}>{stock.ticker}</div>
<div style={{ fontSize: '12px', color: '#94a3b8' }}>{stock.company}</div>
</td>
<td style={{ padding: '14px 16px' }}>
<div style={{ fontWeight: 'bold' }}>${stock.price.toFixed(2)}</div>
<div style={{ color: '#4ade80', fontSize: '12px' }}>+{stock.change.toFixed(2)}%</div>
</td>
<td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
{stock.volume ? stock.volume.toLocaleString() : 'N/A'}
</td>
<td style={{ padding: '14px 16px', fontWeight: 'bold' }}>
{stock.score} / 100
</td>
<td style={{ padding: '14px 16px' }}>
<span style={{ backgroundColor: stock.change >= 4.0 ? '#065f46' : '#1e3a8a', color: stock.change >= 4.0 ? '#34d399' : '#60a5fa', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
{stock.verdict}
</span>
</td>
</tr>
))
) : (
<tr>
<td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
{loading ? 'Fetching active live setups...' : 'No active setups matching criteria right now.'}
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
