import { NextResponse } from 'next/server';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

export async function GET() {
try {
// 1. Pull live top US gainers from Yahoo Finance
const yfRes = await fetch(
'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=day_gainers&count=25',
{ headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 30 } }
);
const yfData = await yfRes.json();
const rawQuotes = yfData?.finance?.result?.[0]?.quotes || [];

// 2. Filter for small-cap momentum candidates ($1 - $25, MCAP < $250M)
const candidates = rawQuotes
.filter(
(q) =>
q.regularMarketPrice >= 1 &&
q.regularMarketPrice <= 25 &&
(q.marketCap || 0) > 5_000_000 &&
(q.marketCap || 0) < 250_000_000 &&
q.regularMarketVolume > 300_000
)
.slice(0, 10);

// 3. Audit via Finnhub & map directly to your StockSqueezeItem interface
const results = await Promise.all(
candidates.map(async (stock) => {
const symbol = stock.symbol;
let floatShares = stock.sharesOutstanding || null;
let dilutionWarning = false;

if (FINNHUB_KEY) {
const [profRes, filRes] = await Promise.all([
fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`),
fetch(`https://finnhub.io/api/v1/stock/filings?symbol=${symbol}&token=${FINNHUB_KEY}`)
]);
const profile = await profRes.json();
const filings = await filRes.json();

if (profile?.shareOutstanding) {
floatShares = Math.round(profile.shareOutstanding * 1_000_000);
}

const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
const toxicForms = ['S-1', 'S-3', '424B5', 'F-1', 'F-3'];
dilutionWarning =
Array.isArray(filings) &&
filings.some(
(f) =>
new Date(f.filedDate).getTime() >= cutoff && toxicForms.includes(f.form)
);
}

const rvol = stock.averageDailyVolume3Month
? +(stock.regularMarketVolume / stock.averageDailyVolume3Month).toFixed(2)
: 1.0;

const changePct = +(stock.regularMarketChangePercent || 0).toFixed(2);
const floatStr = floatShares ? `${(floatShares / 1_000_000).toFixed(1)}M` : 'N/A';

return {
ticker: symbol,
name: stock.shortName || symbol,
price: +(stock.regularMarketPrice || 0).toFixed(2),
change: changePct,
shortInterest: 0,
float: floatStr,
ctb: 0,
rvol,
squeezeScore: Math.min(99, Math.round(rvol * 12 + changePct)),
dilutionSafe: !dilutionWarning
};
})
);

const cleanResults = results
.filter((item) => item.dilutionSafe)
.sort((a, b) => b.rvol - a.rvol);

return NextResponse.json({ results: cleanResults });
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
