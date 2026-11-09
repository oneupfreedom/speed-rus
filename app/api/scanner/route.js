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

useEffect(() => {
fetch('/api/scanner')
.then((res) => {
if (!res.ok) throw new Error('Failed to fetch stock scanner data');
return res.json();
})
.then((jsonResponse) => {
// Correctly extract the data array from the API response object
const items = Array.isArray(jsonResponse)
? jsonResponse
: jsonResponse.data || jsonResponse.results || [];

setData(items);
setLoading(false);
})
.catch((err) => {
setError(err.message);
setLoading(false);
});
}, []);

return (
<main style={{ padding: '2rem', fontFamily: 'sans-serif', background: '#121212', color: '#fff', minHeight: '100vh' }}>
<h1>Speed-Rus Penny Stock Squeeze Scanner</h1>
<p style={{ color: '#888' }}>Live tracking: Low float, high short interest, and momentum spikes.</p>

{loading && <p>Scanning market data...</p>}
{error && <p style={{ color: '#ff5555' }}>Error: {error}</p>}

{!loading && !error && (
<div style={{ marginTop: '2rem', overflowX: 'auto' }}>
{data.length === 0 ? (
<p>No active penny stock squeeze setups matching criteria.</p>
) : (
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
<thead>
<tr style={{ borderBottom: '1px solid #333', color: '#aaa' }}>
<th style={{ padding: '10px' }}>Ticker</th>
<th style={{ padding: '10px' }}>Price</th>
<th style={{ padding: '10px' }}>Change</th>
<th style={{ padding: '10px' }}>Short Int %</th>
<th style={{ padding: '10px' }}>Float</th>
<th style={{ padding: '10px' }}>CTB %</th>
<th style={{ padding: '10px' }}>RVOL</th>
</tr>
</thead>
<tbody>
{data.map((item, index) => (
<tr key={index} style={{ borderBottom: '1px solid #222' }}>
<td style={{ padding: '10px', fontWeight: 'bold', color: '#00bcd4' }}>{item.ticker}</td>
<td style={{ padding: '10px' }}>${item.price?.toFixed(2) ?? 'N/A'}</td>
<td style={{ padding: '10px', color: (item.change ?? 0) >= 0 ? '#4caf50' : '#f44336' }}>
{item.change ? `${item.change}%` : 'N/A'}
</td>
<td style={{ padding: '10px', fontWeight: 'bold', color: '#ff9800' }}>
{item.shortInterest ? `${item.shortInterest}%` : 'N/A'}
</td>
<td style={{ padding: '10px' }}>{item.float ?? 'N/A'}</td>
<td style={{ padding: '10px' }}>{item.ctb ? `${item.ctb}%` : 'N/A'}</td>
<td style={{ padding: '10px' }}>{item.rvol ? `${item.rvol}x` : 'N/A'}</td>
</tr>
))}
</tbody>
</table>
)}
</div>
)}
</main>
);
}
