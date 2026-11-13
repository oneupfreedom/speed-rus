
import { NextResponse } from 'next/server';

export async function GET() {
const apiKey = process.env.FMP_API_KEY;

if (!apiKey) {
return NextResponse.json({ success: false, error: 'API Key missing on Vercel' }, { status: 200 });
}

try {
// Using the active v3 stock market gainers endpoint
const res = await fetch(`https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${apiKey}`);
const gainers = await res.json();

if (!Array.isArray(gainers)) {
const errorMsg = gainers["Error Message"] || gainers.message || "Invalid API response from FMP";
return NextResponse.json({ success: false, error: errorMsg }, { status: 200 });
}

const processed = gainers.map((stock) => {
const price = stock.price || 0;
const change = stock.changesPercentage || stock.changePercentage || 0;
const volume = stock.volume || 0;
const avgVolume = stock.avgVolume || volume || 1;

const relVolume = avgVolume > 0 ? (volume / avgVolume) : 1;

let score = 50;
if (change >= -50 && change <= 100) score += 25;
if (price > 0.01 && price < 1000) score += 25;

let classification = "BUILDING BASE";
if (score >= 80) classification = "EARLY IGNITION";
else if (score >= 65) classification = "BREAKOUT RUN";

return {
symbol: stock.symbol || 'UNKNOWN',
name: stock.name || stock.symbol || 'Unknown Company',
price: price,
