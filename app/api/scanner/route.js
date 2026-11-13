
import { NextResponse } from 'next/server';

export async function GET() {
const apiKey = process.env.FMP_API_KEY;

if (!apiKey) {
return NextResponse.json({ success: false, error: 'API Key missing on Vercel' }, { status: 200 });
}

try {
// Using the current active FMP stable endpoint
const res = await fetch(`https://financialmodelingprep.com/stable/biggest-gainers?apikey=${apiKey}`);
const gainers = await res.json();

if (!Array.isArray(gainers)) {
const errorMsg = gainers["Error Message"] || gainers.message || "Invalid API response from FMP";
return NextResponse.json({ success: false, error: errorMsg }, { status: 200 });
}

const processed = gainers.map((stock) => {
const price = stock.price || 0;
const change = stock.changesPercentage || stock.changePercentage || stock.change || 0;
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
change: change,
volume: volume,
avgVolume: avgVolume,
relVolume: Number(relVolume.toFixed(2)),
score: score,
classification: classification
};
})
.filter((stock) => stock.price > 0.01)
.sort((a, b) => b.score - a.score)
.slice(0, 25);

return NextResponse.json({
success: true,
data: processed,
count: processed.length,
timestamp: new Date().toISOString()
});

} catch (err) {
return NextResponse.json({ success: false, error: err.message }, { status: 200 });
}
}
