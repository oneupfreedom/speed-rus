
import { NextResponse } from 'next/server';

const DEFAULT_SYMBOLS = [
'SQ', 'CNQ.TO', 'RBLX', 'TD.TO', 'UNH', 'MRK', 'RY.TO', 'SHOP.TO', 'ENB.TO',
'NVDA', 'AMD', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'SOFI', 'PLTR',
'IONQ', 'RKLB', 'SMCI', 'COIN', 'MARA', 'RIOT', 'HOOD', 'INTC', 'MU', 'AVGO'
];

function getSessionPhase(now = new Date()) {
const etString = now.toLocaleString('en-US', {
timeZone: 'America/New_York',
hour12: false,
hour: '2-digit',
minute: '2-digit'
});
const [hh, mm] = etString.split(':').map(Number);
const mins = hh * 60 + mm;

if (mins < 9 * 60 + 35) return 'PRE_BELL';
if (mins <= 9 * 60 + 50) return 'BELL_935_WINDOW';
if (mins < 16 * 60) return 'DAY_SESSION';
return 'POST_CLOSE';
}

function buildFallbackRow(symbol, index) {
const basePrice = 25 + ((index * 19) % 180) + 0.35;
const isFirst = index === 0;
const changePercent = isFirst ? 1.95 : Number((((index % 7) - 3) * 0.42).toFixed(2));
const relVol = isFirst ? 1.43 : Number((0.85 + ((index * 17) % 90) / 100).toFixed(2));
const score = isFirst ? 91.8 : Number((28 + ((index * 11) % 45)).toFixed(1));

return {
symbol,
name: symbol,
price: Number(basePrice.toFixed(2)),
changePercent,
relVol,
score,
setup: 'WATCH',
signal: 'MONITOR',
isCoilPop: false,
isCoiling: false,
source: 'fallback'
};
}

async function fetchSingleChart(symbol, index) {
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 3500);

try {
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
symbol
)}?interval=5m&range=1d`;
const res = await fetch(url, {
signal: controller.signal,
headers: { 'User-Agent': 'Mozilla/5.0' },
cache: 'no-store'
});

if (!res.ok) {
return buildFallbackRow(symbol, index);
}

const json = await res.json();
const result = json?.chart?.result?.[0];
const meta = result?.meta;
const quote = result?.indicators?.quote?.[0];

const rawPrice =
typeof meta?.regularMarketPrice === 'number'
? meta.regularMarketPrice
: Array.isArray(quote?.close)
? [...quote.close].reverse().find((v) => typeof v === 'number')
: null;

const prevClose =
typeof meta?.chartPreviousClose === 'number'
? meta.chartPreviousClose
: typeof meta?.previousClose === 'number'
? meta.previousClose
: null;

if (typeof rawPrice !== 'number' || !Number.isFinite(rawPrice) || rawPrice <= 0) {
return buildFallbackRow(symbol, index);
}

const changePercent =
typeof prevClose === 'number' && prevClose > 0
? Number((((rawPrice - prevClose) / prevClose) * 100).toFixed(2))
: 0;

const highs = Array.isArray(quote?.high) ? quote.high.filter((n) => typeof n === 'number') : [];
const lows = Array.isArray(quote?.low) ? quote.low.filter((n) => typeof n === 'number') : [];
const vols = Array.isArray(quote?.volume) ? quote.volume.filter((n) => typeof n === 'number') : [];

const recentHigh = highs.length ? Math.max(...highs.slice(-6)) : rawPrice;
const recentLow = lows.length ? Math.min(...lows.slice(-6)) : rawPrice;
const rangePct = rawPrice > 0 ? ((recentHigh - recentLow) / rawPrice) * 100 : 1;

const avgVol =
vols.length > 1
? vols.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, vols.length - 1)
: 1;
const lastVol = vols.length ? vols[vols.length - 1] : avgVol;
const relVol = avgVol > 0 ? Number(Math.max(0.2, Math.min(8, lastVol / avgVol)).toFixed(2)) : 1;

const isCoiling = rangePct > 0 && rangePct <= 1.25;
const inPopBand = changePercent >= 1.0 && changePercent <= 2.35;
const isCoilPop = inPopBand && relVol >= 1.1;

const rawScore =
(isCoilPop ? 65 : inPopBand ? 45 : 20) +
Math.min(20, Math.max(0, relVol * 8)) +
(isCoiling ? 12 : 0);

return {
symbol,
name: meta?.shortName || meta?.longName || symbol,
price: Number(rawPrice.toFixed(2)),
changePercent,
relVol,
score: Number(Math.min(99.9, rawScore).toFixed(1)),
setup: isCoilPop ? 'COIL POP' : isCoiling ? 'COILING' : 'WATCH',
signal: isCoilPop ? 'EARLY POP' : 'MONITOR',
isCoilPop,
isCoiling,
source: 'live'
};
} catch {
return buildFallbackRow(symbol, index);
} finally {
clearTimeout(timer);
}
}

export async function GET(request) {
try {
const { searchParams } = new URL(request.url);
const extraParam = search
