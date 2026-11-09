'use client';

import { useState, useEffect } from 'react';

interface StockSqueezeItem {
ticker: string;
name?: string;
price?: number;
change?: number;
shortInterest?: number;
float?: string;
ctb?: number;
rvol?: number;
squeezeScore?: number;
}

export default function Home() {
const [data, setData] = useState<StockSqueezeItem[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [searchTerm, setSearchTerm] = useState<string>('');
const [lastSync, setLastSync] = useState<string>('');

const fetchData = async () => {
setLoading(true);
try {
const res = await fetch('/api/scanner');
if (!res.ok) throw new Error('Failed to fetch stock scanner data');
const jsonResponse = await res.json();

const items = Array.isArray(jsonResponse)
? jsonResponse
: jsonResponse.data || jsonResponse.results || [];

setData(items);
setLastSync(new Date().toLocaleTimeString());
setError(null);
} catch (err: any) {
setError(err.message);
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchData();
}, []);

const filteredData = data.filter((item) =>
item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
(item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()))
);

return (
<main style={{ minHeight: '100vh', background: '#0b0f19', color: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '16px' }}>
<div style={{ maxWidth: '600px', margin: '0 auto' }}>

{/* Header Card */}
<div style={{ background: '#131b2e', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
<span>⚡</span> Live Market Scanner
</div>
<h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Speedy Short-Squeeze Engine</h1>
<p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.4' }}>
Real-time tracking of high short interest, borrow fees, and float velocity for stocks.
</p>

<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
<span style={{ color: '#64748b', fontSize: '12px' }}>Last sync: {lastSync || 'Connecting...'}</span>
<button
onClick={fetchData}
style={{ background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
>
🔄 Refresh Feed
</button>
</div>
</div>

{/* Search Bar */}
<div style={{ marginBottom: '16px' }}>
<input
type="text"
placeholder="Search ticker or company name..."
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
style={{ width: '100%', background: '#131b2e', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 16px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
/>
</div>

{/* Watchlist Pill */}
<div style={{ marginBottom: '20px', display: 'inline-block', background: '#131b2e', border: '1px solid #1e293b', borderRadius: '20px', padding: '8px 14px', fontSize: '12px', color: '#fbbf24' }}>
🛡️ High Short Interest / High Reward Watchlist
</div>

{/* Status Messages */}
{loading && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Scanning market data...</p>}
{error && <p style={{ textAlign: 'center', color: '#f87171', padding: '20px' }}>Error: {error}</p>}

{/* Data List / Table View */}
{!loading && !error && (
<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
{filteredData.length === 0 ? (
<p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No active penny stock squeeze setups matching criteria.</p>
) : (
filteredData.map((item, index) => (
<div key={index} style={{ background: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', alignItems: 'center', gap: '8px' }}>

{/* Ticker / Company */}
<div>
<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
<span style={{ fontWeight: 'bold', fontSize: '16px', color: '#ffffff' }}>{item.ticker}</span>
<span style={{ background: '#1e293b', color: '#94a3b8', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>US</span>
</div>
<div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
{item.name || 'Penny Stock'}
</div>
</div>

{/* Price / Change */}
<div>
<div style={{ fontWeight: 'bold', fontSize: '15px', color: '#ffffff' }}>
${item.price?.toFixed(2) ?? '0.00'}
</div>
<div style={{ fontSize: '12px', fontWeight: 'bold', color: (item.change ?? 0) >= 0 ? '#10b981' : '#f87171', marginTop: '2px' }}>
{(item.change ?? 0) >= 0 ? '+' : ''}{item.change}%
</div>
</div>

{/* Short Interest */}
<div>
<div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Short Int</div>
<div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fbbf24', marginTop: '2px' }}>
{item.shortInterest ? `${item.shortInterest}%` : 'N/A'}
</div>
</div>

{/* Squeeze Score / CTB */}
<div style={{ textAlign: 'right' }}>
<div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Score</div>
<div style={{ fontWeight: 'bold', fontSize: '14px', color: '#38bdf8', marginTop: '2px' }}>
{item.squeezeScore ? `${item.squeezeScore}` : 'N/A'}
</div>
</div>

</div>
))
)}
</div>
)}

</div>
</main>
);
}
