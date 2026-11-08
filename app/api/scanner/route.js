import { NextResponse } from 'next/server';

export async function GET() {
const apiKey = process.env.STOCK_API_KEY;

if (!apiKey) {
return NextResponse.json({ error: 'API key not configured in environment variables' }, { status: 500 });
}

try {
const response = await fetch(
`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=${apiKey}`
);

if (!response.ok) {
throw new Error(`Polygon API error: ${response.statusText}`);
}

const data = await response.json();

const candidates = (data.tickers || []).map((item) => ({
ticker: item.ticker,
name: item.details?.name || item.ticker,
price: Number(item.price?.toFixed(2)),
change: Number(item.change?.toFixed(2)),
volume: item.day?.v || 0,
}));

return NextResponse.json({ success: true, count: candidates.length, data: candidates });
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
