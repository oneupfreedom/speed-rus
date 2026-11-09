import { NextResponse } from 'next/server';

export async function GET() {
const apiKey = process.env.STOCK_API_KEY;

if (!apiKey) {
return NextResponse.json({ error: 'API key not configured in environment variables' }, { status: 500 });
}

try {
const res = await fetch(
`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=${apiKey}`
);

if (!res.ok) {
throw new Error(`Polygon API error: ${res.statusText}`);
}

const data = await res.json();
return NextResponse.json(data);
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
