import { NextResponse } from 'next/server';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

export async function GET() {
try {
// Pull from both Day Gainers and Most Actives so early-market movers always populate
const urls = [
'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=day_gainers&count=25',
'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=most_actives&count=25'
];

const responses = await Promise.all(
urls.map((url) =>
fetch(url, {
headers: { 'User-Agent': 'Mozilla/5.0' },
cache: 'no-store'
}).then((r) => (r.ok ? r.json() : null))
)
);

// Combine and deduplicate tickers
const seen = new Set();
const rawQuotes = [];
for (const data of responses) {
const quotes = data?.finance?.result?.[0]?.quotes || [];
for (const q of quotes) {
if (q?.symbol && !seen.has(q.symbol)) {
seen.add(q.symbol);
rawQuotes.push(q);
}
}
}

// Filter for small/mid-cap momentum ($1 - $35, MCAP < $1B, Volume > 50K for early bell)
const candidates = rawQuotes
.filter(
(q) =>
q.regularMarketPrice >= 1 &&
q.regularMarketPrice <= 35 &&
(q.marketCap || 0) > 5_000_000 &&
(q.marketCap || 0) < 1_000_000_000 &&
(q.regularMarketVolume || 0) > 50_000 &&
(q.regularMarketChangePercent || 0) >= 3
)
.slice(0, 12);

// Audit via Finnhub & map to UI
const results = await Promise.all(
candidates.map(async (stock) => {
const symbol = stock.symbol;
let floatShares = stock.sharesOutstanding || null;
let dilutionWarning = false;

if (FINNHUB_KEY) {
try {
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
} catch {
// Non-blocking fallback if Finnhub rate-limits
}
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
.sort((a, b) => b.change - a.change);

return NextResponse.json({ results: cleanResults });
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
