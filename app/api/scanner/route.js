
import { NextResponse } from 'next/server';

const DEFAULT_WATCHLIST = [
'AAPL', 'MSFT', 'NVDA', 'AMD', 'TSLA', 'META', 'AMZN', 'GOOGL',
'PLTR', 'SMCI', 'COIN', 'SOFI', 'HOOD', 'RKLB', 'IONQ', 'MARA',
'RIOT', 'UPST', 'AFRM', 'DKNG', 'RIVN', 'LCID', 'F', 'GM',
'AAP', 'TGT', 'COST', 'HD', 'LOW', 'SBUX', 'NKE', 'DIS',
'NFLX', 'CRM', 'NOW', 'SNOW', 'PANW', 'CRWD', 'MU', 'INTC',
'AVGO', 'QCOM', 'ARM', 'XOM', 'CVX', 'OXY', 'JPM', 'BAC',
];

async function fetchSingleChart(symbol) {
const encoded = encodeURIComponent(symbol);
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1mo`;

const response = await fetch(url, {
headers: {
'User-Agent':
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
Accept: 'application/json,text/plain,*/*',
},
cache: 'no-store',
});

if (!response.ok) {
throw new Error(`Chart status ${response.status} for ${symbol}`);
}

const data = await response.json();
const result = data?.chart?.result?.[0];
const meta = result?.meta;
if (!meta) return null;

const volumes = Array.isArray(result?.indicators?.quote?.[0]?.volume)
? result.indicators.quote[0].volume.filter((v) => typeof v === 'number' && v > 0)
: [];

const latestBarVol = volumes.length > 0 ? volumes[volumes.length - 1] : 0;
const priorBars = volumes.length > 1 ? volumes.slice(0, -1) : volumes;
const computedAvgVol =
priorBars.length > 0
? priorBars.reduce((sum, v) => sum + v, 0) / priorBars.length
: 0;

const price = Number(meta.regularMarketPrice ?? meta.previousClose ?? 0);
const prevClose = Number(
meta.chartPreviousClose ?? meta.previousClose ?? price
);
const volume = Number(meta.regularMarketVolume ?? latestBarVol ?? 0);
const avgVol = Number(
meta.averageDailyVolume3Month ??
meta.averageDailyVolume10Day ??
computedAvgVol ??
0
);
const marketCap = Number(meta.marketCap ?? 0);

if (!price || price <= 0) return null;

const changePercent =
prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
const relVol = avgVol > 0 && volume > 0 ? volume / avgVol : 1;

return {
symbol: meta.symbol || symbol,
name: meta.shortName || meta.longName || symbol,
price,
prevClose,
changePercent,
relVol,
marketCap,
};
}

async function fetchQuotes(symbols) {
const results = await Promise.allSettled(
symbols.map((sym) => fetchSingleChart(sym))
);

const quotes = results
.filter((r) => r.status === 'fulfilled' && r.value)
.map((r) => r.value);

if (quotes.length === 0) {
throw new Error('Quote provider returned status 401 or blocked requests');
}

return quotes;
}

function evaluateRow(q) {
const passPctBand = q.changePercent >= 1.5 && q.changePercent <= 2.35;
const passTorqueCap =
q.price >= 5 &&
q.price <= 85 &&
(q.marketCap === 0 || (q.marketCap >= 5e8 && q.marketCap <= 3.5e10));
const passRelVol = q.relVol >= 1.5;

const passedCount =
(passPctBand ? 1 : 0) + (passTorqueCap ? 1 : 0) + (passRelVol ? 1 : 0);

const isPrimeEarlyCoil = passPctBand && passTorqueCap && passRelVol;

let setup = 'WATCH';
let signal = 'WAIT';

if (isPrimeEarlyCoil) {
setup = 'COIL POP';
signal = 'PRIME ENTRY';
} else if (q.changePercent >= 1.2 && q.changePercent <= 3.0 && q.relVol >= 1.2) {
setup = 'COIL POP';
signal = 'WATCH IGNITION';
} else if (q.changePercent > 3.0) {
setup = 'EXTENDED';
signal = 'NO CHASE';
} else if (q.changePercent < -1.0) {
setup = 'PULLBACK';
signal = 'CAUTION';
}

let score = 40;
score += Math.max(-15, Math.min(25, q.changePercent * 8));
score += Math.max(0, Math.min(20, (q.relVol - 1) * 12));
if (passPctBand) score += 10;
if (passTorqueCap) score += 5;
if (isPrimeEarlyCoil) score += 10;

return {
symbol: q.symbol,
name: q.name,
price: q.price,
changePercent: q.changePercent,
relVol: q.relVol,
score: Math.round(score),
setup,
signal,
isPrimeEarlyCoil,
threePoint: {
passedCount,
passPctBand,
passTorqueCap,
passRelVol,
},
};
}

export async function GET() {
try {
const quotes = await fetchQuotes(DEFAULT_WATCHLIST);
const rows = quotes
.map(evaluateRow)
.sort((a, b) => b.score - a.score);

return NextResponse.json({
ok: true,
updatedAt: new Date().toISOString(),
rows,
});
} catch (err) {
const message =
err instanceof Error ? err.message : 'Unable to fetch market data';
return NextResponse.json({ error: message, rows: [] }, { status: 500 });
}
}
