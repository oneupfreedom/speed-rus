'use client';

import { useState, useEffect } from 'react';

interface StockSqueezeItem {
ticker: string;
name?: string;
price?: number;
change?: number;
shortInterest?: number;
float?: string;
dtb?: number;
rvol?: number;
squeezeScore?: number;
}

export default function Home() {
const [data, setData] = useState<StockSqueezeItem[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
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

return (
<main style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
<h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Speedy Short-Squeeze Engine</h1>
<p style={{ color: '#94a3b8', marginBottom: '24px' }}>Real-time tracking of high short interest, borrow fees, and float velocity for stocks.</p>

<div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
<button
onClick={fetchData}
style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
>
Refresh Feed
</button>
<span style={{ alignSelf: 'center', color: '#94a3b8', fontSize: '14px' }}>Last sync: {lastSync}</span>
</div>

{error && (
<div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
Error: {error}
</div>
)}

<div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px', border: '1px solid #334155' }}>
<div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>Live Market Scanner</div>
{loading ? (
<p style={{ color: '#94a3b8' }}>Loading live market data...</p>
) : data.length === 0 ? (
<p style={{ color: '#94a3b8' }}>No active setups matching criteria.</p>
) : (
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
<thead>
<tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8', fontSize: '14px' }}>
<th style={{ padding: '8px' }}>Ticker</th>
<th style={{ padding: '8px' }}>Price</th>
<th style={{ padding: '8px' }}>Change</th>
<th style={{ padding: '8px' }}>Short Interest</th>
</tr>
</thead>
<tbody>
{data.map((item, idx) => (
<tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
<td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{item.ticker}</td>
<td style={{ padding: '12px 8px' }}>${item.price ? item.price.toFixed(2) : 'N/A'}</td>
<td style={{ padding: '12px 8px', color: (item.change || 0) >= 0 ? '#10b981' : '#ef4444' }}>
{item.change ? `${item.change > 0 ? '+' : ''}${item.change}%` : 'N/A'}
</td>
<td style={{ padding: '12px 8px' }}>{item.shortInterest ? `${item.shortInterest}%` : 'N/A'}</td>
</tr>
))}
</tbody>
</table>
)}
</div>
</div>
</main>
);
}
