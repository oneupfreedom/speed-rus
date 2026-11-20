
import { NextResponse } from 'next/server';

const DEFAULT_SYMBOLS = [
'GAP',
'GIS',
'HDB',
'AAP',
'SYY',
'BILL',
'AXON',
'MKC',
'FND',
'BSP',
'WMT',
'T',
'CTSH',
'ACN',
'KVYO',
'CAG',
'CPB',
'BRO',
];

function toNumber(val, fallback = 0) {
const num = typeof val === 'number' ? val : Number(val);
return Number.isFinite(num) ? num : fallback;
}

function classifySetup(changePercent, relVol) {
if (relVol >= 8 && Math.abs(changePercent) >= 8) {
return 'PULLBACK / DIP';
}
if (changePercent >= 1.5 && changePercent <= 9.5 && relVol >= 1.15) {
return 'COIL POP';
}
return 'BREAKOUT RUN';
}

function classifySignal(score) {
if (score >= 75) return 'TOP LEADER';
if (score >= 62) return 'CHALLENGER';
return 'MONITOR';
}

function computeScore(price, changePercent, relVol) {
const absMove = Math.abs(changePercent);
const volPoints = Math.min(40, Math.round(relVol * 14));
const movePoints = Math.min(30, Math.round(absMove * 4.5));
const coilBonus = changePercent >= 1.5 && changePercent <= 9.5 && relVol >= 1.15 ? 12 : 0;
const priceBonus = price >= 5 && price <= 150 ? 6 : 2;
return Math.max(35, Math.min(99, volPoints + movePoints + coilBonus + priceBonus));
}

async function fetchQuotes(symbols) {
const query = encodeURIComponent(symbols.join(','));
const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`;

const response = await fetch(url, {
headers: {
'User-Agent': 'Mozilla/5.0',
Accept: 'application/json',
},
cache: 'no-store',
});

if (!response.ok) {
throw new Error(`Quote provider returned status ${response.status}`);
}

const data = await response.json();
return data?.quoteResponse?.result ?? [];
}

export async function GET(request) {
try {
const { searchParams } = new URL(request.url);
const symbolsParam = searchParams.get('symbols');
const symbols = symbolsParam
? symbolsParam
.split(',')
.map((s) => s.trim().toUpperCase())
.filter(Boolean)
: DEFAULT_SYMBOLS;

const quotes = await fetchQuotes(symbols);

const rows = quotes.map((q) => {
const symbol = q.symbol || '';
const name = q.shortName || q.longName || symbol;
const price = toNumber(q.regularMarketPrice ?? q.postMarketPrice ?? q.preMarketPrice, 0);

const prevCloseVal = toNumber(
q.regularMarketPreviousClose ?? q.previousClose ?? q.chartPreviousClose,
0
);

const rawChangePct = toNumber(q.regularMarketChangePercent, 0);
const truePct =
prevCloseVal > 0 && price > 0
? ((price - prevCloseVal) / prevCloseVal) * 100
: rawChangePct;

const volume = toNumber(q.regularMarketVolume, 0);
const avgVolume = toNumber(
q.averageDailyVolume3Month ?? q.averageDailyVolume10Day,
0
);
const relVol =
volume > 0 && avgVolume > 0
? Number((volume / avgVolume).toFixed(2))
: 0;

const mktCapVal = toNumber(q.marketCap, 0);
const changePercent = Number(truePct.toFixed(2));
const score = computeScore(price, changePercent, relVol);
const setup = classifySetup(changePercent, relVol);
const signal = classifySignal(score);

const passPctBand = changePercent >= 1.5 && changePercent <= 2.35;
const passTorqueCap =
price >= 5 &&
price <= 85 &&
(!mktCapVal || (mktCapVal >= 500_000_000 && mktCapVal <= 35_000_000_000));
const passRelVol = relVol >= 1.5;

const threePointPassedCount = [passPctBand, passTorqueCap, passRelVol].filter(
Boolean
).length;
const isPrimeEarlyCoil =
setup === 'COIL POP' && passPctBand && passTorqueCap && passRelVol;

return {
symbol,
name,
price: Number(price.toFixed(2)),
changePercent,
relVol,
score,
setup,
signal,
isPrimeEarlyCoil,
threePoint: {
passedCount: threePointPassedCount,
passPctBand,
passTorqueCap,
passRelVol,
},
};
});

rows.sort((a, b) => b.score - a.score);

return NextResponse.json({
updatedAt: new Date().toISOString(),
rows,
});
} catch (error) {
return NextResponse.json(
{ error: error?.message || 'Scanner route failed', rows: [] },
{ status: 500 }
);
}
}
