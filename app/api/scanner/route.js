Rudranth McDowall <oneupfreedom@gmail.com>
1:01 PM (0 minutes ago)
to me

import { NextResponse } from 'next/server';

const DEFAULT_TICKERS = [
'NVDA', 'TSLA', 'AMD', 'SMCI', 'MARA', 'RIOT', 'COIN', 'MSTR', 'PLTR', 'SOFI',
'IONQ', 'RGTI', 'QUBT', 'D-WAVE', 'QBTS', 'OKLO', 'SMR', 'CCJ', 'UEC', 'DNN',
'LUNR', 'RKLB', 'ASTS', 'ACHR', 'JOBY', 'HIMS', 'AFRM', 'UPST', 'HOOD', 'RIVN',
'LCID', 'NIO', 'XPEV', 'BABA', 'BIDU', 'PDD', 'JD', 'ARM', 'MRVL', 'AVGO',
'MU', 'INTC', 'QCOM', 'TXN', 'AMAT', 'LRCX', 'KLAC', 'ASML', 'SNOW', 'NET',
'DDOG', 'MDB', 'PANW', 'CRWD', 'ZS', 'OKTA', 'SHOP.TO', 'CSU.TO', 'NVEI.TO', 'KXS.TO',
'HOU.TO', 'HQU.TO', 'HQD.TO', 'BITX', 'IBIT', 'FBTC', 'ETHA', 'TQQQ', 'SQQQ', 'SOXL',
'SOXS', 'SPXL', 'SPXS', 'LABU', 'LABD', 'FAS', 'FAZ', 'NUGT', 'DUST', 'GDX',
'SILJ', 'URA', 'URNM', 'NLR', 'XLE', 'XOP', 'OIH', 'XBI', 'ARKK', 'FXI',
'KWEB', 'FXI', 'EWZ', 'INDA', 'GLD', 'SLV', 'USO', 'UNG', 'TLT', 'TMF',
'TMV', 'UVXY', 'VXX', 'CVNA', 'CARV', 'CHWY', 'ROKU', 'TTD', 'SNAP', 'PINS',
'UBER', 'LYFT', 'DASH', 'ABNB', 'DKNG', 'PENN', 'MGM', 'WYNN', 'CCL', 'RCL',
'NCLH', 'AAL', 'UAL', 'DAL', 'JBLU', 'BA', 'GE', 'CAT', 'DE', 'URI',
'FCX', 'MP', 'ALB', 'LAC', 'ENPH', 'FSLR', 'RUN', 'SEDG', 'PLUG', 'BLDP',
'CHPT', 'QS', 'MVST', 'STEM', 'BBAI', 'SOUN', 'AI', 'PATH', 'U', 'RBLX',
'TTWO', 'EA', 'MSFT', 'AAPL', 'GOOGL', 'META', 'AMZN', 'NFLX', 'CRM', 'NOW',
'ADBE', 'ORCL', 'IBM', 'CSCO', 'PYPL', 'V', 'MA', 'JPM', 'BAC', 'GS',
'MS', 'C', 'WFC', 'SCHW', 'BX', 'KKR', 'APO', 'DIS', 'CMCSA', 'WBD',
'PARA', 'SPOT', 'LYV', 'MTCH', 'BMBL', 'Z', 'ZG', 'OPEN', 'EXPI', 'RDFN',
'DOCU', 'ZM', 'TWLO', 'BILL', 'HUBS', 'TOST', 'CAVA', 'BROS', 'CMG', 'MCD',
'SBUX', 'WING', 'DPZ', 'KO', 'PEP', 'WMT', 'COST', 'TGT', 'HD', 'LOW',
'LULU', 'NKE', 'ONON', 'DECK', 'CROX', 'GPS', 'ANF', 'AEO', 'RL', 'TPR',
'VFC', 'M', 'KSS', 'JWN', 'BBY', 'GME', 'AMC', 'KOSS', 'CLOV', 'TLRY',
'CGC', 'ACB', 'SNDL', 'VRTX', 'REGN', 'MRNA', 'BNTX', 'LLY', 'NVO', 'PFE',
'JNJ', 'UNH', 'ELV', 'HUM', 'CVS', 'CI', 'ALGN', 'ISRG', 'DXCM', 'PODD',
'AXON', 'TTMI', 'VRT', 'MOD', 'PWR', 'ETN', 'VST', 'CEG', 'NRG', 'TLN',
'ABEV.TO', 'TD.TO', 'RY.TO', 'ENB.TO', 'CNQ.TO', 'SU.TO', 'CVE.TO', 'ARX.TO', 'TOU.TO', 'PPL.TO',
'BNS.TO', 'BMO.TO', 'CM.TO', 'MFC.TO', 'SLF.TO', 'GWO.TO', 'POW.TO', 'BAM.TO', 'BN.TO', 'ATD.TO',
'DOL.TO', 'WSP.TO', 'QSR.TO', 'TRI.TO', 'CP.TO', 'CNR.TO', 'T.TO', 'BCE.TO', 'RCI-B.TO', 'HNU.TO'
];

function getSessionPhase(now = new Date()) {
const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
const et = new Date(etString);
const day = et.getDay();
const minutes = et.getHours() * 60 + et.getMinutes();

if (day === 0 || day === 6) {
return { phase: 'POST_CLOSE', daytimeActive: false };
}
if (minutes >= 575 && minutes < 615) {
return { phase: 'BELL_935_WINDOW', daytimeActive: true };
}
if (minutes >= 615 && minutes < 960) {
return { phase: 'DAY_SESSION', daytimeActive: true };
}
if (minutes >= 240 && minutes < 575) {
return { phase: 'PRE_BELL', daytimeActive: false };
}
return { phase: 'POST_CLOSE', daytimeActive: false };
}

function computeRelVol(validBars, meta) {
const nonZeroVols = validBars
.map((b) => b.volume)
.filter((v) => typeof v === 'number' && v > 0);

if (nonZeroVols.length >= 4) {
const latestVol = nonZeroVols[nonZeroVols.length - 1];
const baselineSlice = nonZeroVols.slice(-16, -1);
const avgBaseline =
baselineSlice.reduce((sum, v) => sum + v, 0) / baselineSlice.length;
if (avgBaseline > 0) {
return Number((latestVol / avgBaseline).toFixed(2));
}
}

const regVol = Number(meta?.regularMarketVolume || 0);
const avgDailyVol = Number(
meta?.averageDailyVolume10Day || meta?.averageDailyVolume3Month || 0
);
if (regVol > 0 && avgDailyVol > 0) {
return Number((regVol / avgDailyVol).toFixed(2));
}

return 0;
}

async function fetchSingleChart(symbol, daytimeActive) {
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
symbol
)}?interval=30m&range=5d&includePrePost=false`;

try {
const res = await fetch(url, {
headers: {
'User-Agent': 'Mozilla/5.0'
},
cache: 'no-store'
});
if (!res.ok) return null;

const json = await res.json();
const result = json?.chart?.result?.[0];
if (!result) return null;

const meta = result.meta || {};
const quote = result.indicators?.quote?.[0] || {};
const timestamps = result.timestamp || [];

const validBars = [];
for (let i = 0; i < timestamps.length; i++) {
const c = quote.close?.[i];
const h = quote.high?.[i];
const l = quote.low?.[i];
const o = quote.open?.[i];
const v = quote.volume?.[i];
if (typeof c === 'number' && typeof h === 'number' && typeof l === 'number') {
validBars.push({
open: typeof o === 'number' ? o : c,
high: h,
low: l,
close: c,
volume: typeof v === 'number' ? v : 0
});
}
}

if (validBars.length < 3) return null;

const latestBar = validBars[validBars.length - 1];
const price = Number((meta.regularMarketPrice ?? latestBar.close).toFixed(2));
const prevClose = Number(
(meta.chartPreviousClose ?? meta.previousClose ?? validBars[0].open).toFixed(2)
);
if (!price || !prevClose) return null;

const changePercent = Number((((price - prevClose) / prevClose) * 100).toFixed(2));
const dailyVolume = Number(
meta.regularMarketVolume ||
validBars.slice(-13).reduce((sum, b) => sum + (b.volume || 0), 0)
);

const recent3 = validBars.slice(-4, -1);
const coilSource = recent3.length >= 2 ? recent3 : validBars.slice(-3);
const coilHigh = Math.max(...coilSource.map((b) => b.high));
const coilLow = Math.min(...coilSource.map((b) => b.low));
const rangePct =
coilLow > 0 ? Number((((coilHigh - coilLow) / coilLow) * 100).toFixed(2)) : 99;

const multiBars = validBars.slice(-12, -1);
const multiHigh = multiBars.length ? Math.max(...multiBars.map((b) => b.high)) : coilHigh;
const multiLow = multiBars.length ? Math.min(...multiBars.map((b) => b.low)) : coilLow;
const multiDayRangePct =
multiLow > 0
? Number((((multiHigh - multiLow) / multiLow) * 100).toFixed(2))
: null;

const relVol = computeRelVol(validBars, meta);

const isTightCoil = rangePct <= 1.15;
const isMultiTight = multiDayRangePct !== null && multiDayRangePct <= 3.4;
const inStandardPopBand = changePercent >= 1.0 && changePercent <= 2.75;
const inMultiPopBand = changePercent >= 1.0 && changePercent <= 3.25;

const isCoilPop =
daytimeActive && isTightCoil && inStandardPopBand && relVol >= 1.25;
const isMultiCoil =
daytimeActive && !isCoilPop && isMultiTight && inMultiPopBand && relVol >= 1.15;
const isCoiling = (isTightCoil || isMultiTight) && changePercent > -0.5 && changePercent < 1.0;

let setup = 'WATCH';
if (isCoilPop) setup = 'COIL POP';
else if (isMultiCoil) setup = 'MULTI-COIL';
else if (isCoiling) setup = 'COILING';

const rawStop = Math.min(coilLow * 0.994, price * 0.985);
const floorStop = price * 0.982;
const stopPrice = Number(Math.max(rawStop, floorStop).toFixed(2));
const trimPrice = Number((price * 1.0325).toFixed(2));
const target5Price = Number((price * 1.05).toFixed(2));

const downsideRiskPct = Number(
Math.max(((price - stopPrice) / price) * 100, 0.4).toFixed(2)
);
const upsideTo5Pct = 5.0;
const rrRatio = Number((upsideTo5Pct / downsideRiskPct).toFixed(2));

const volatilityPenalty = Math.min(45, Math.round(rangePct * 14));
const pricePenalty = price < 3 ? 25 : price < 10 ? 10 : 0;
const riskScore = Math.min(99, Math.max(25, 35 + volatilityPenalty + pricePenalty));

let coilScore = 0;
let setupGrade = '-';
if (isCoilPop || isMultiCoil) {
const volPts = Math.min(40, Math.round(relVol * 18));
const tightPts = Math.max(10, Math.round((1.5 - Math.min(rangePct, 1.5)) * 25));
const rrPts = Math.min(25, Math.round(rrRatio * 3));
coilScore = Math.min(99, volPts + tightPts + rrPts);
setupGrade =
coilScore >= 85 ? 'A+' : coilScore >= 72 ? 'A' : coilScore >= 60 ? 'B' : 'C';
}

let profitVerdict = 'HOLD / WAIT';
if (!daytimeActive) {
profitVerdict = 'WAIT FOR DAYTIME';
} else if (changePercent > 3.25) {
profitVerdict = 'TRIM / WATCH EXIT';
} else if (isCoilPop || isMultiCoil) {
profitVerdict = 'ACTIVE ENTRY';
}

return {
symbol: symbol.toUpperCase(),
market: symbol.toUpperCase().endsWith('.TO') ? 'CA' : 'US',
currency: symbol.toUpperCase().endsWith('.TO') ? 'CAD' : 'USD',
price,
changePercent,
dailyVolume,
rangePct,
multiDayRangePct,
relVol,
isCoilPop,
isMultiCoil,
isCoiling,
setup,
entryPrice: price,
stopPrice,
trimPrice,
target5Price,
downsideRiskPct,
upsideTo5Pct,
rrRatio,
riskScore,
coilScore,
setupGrade,
profitVerdict
};
} catch {
return null;
}
}

export async function GET(request) {
const { searchParams } = new URL(request.url);
const customParam = searchParams.get('tickers') || '';
const customTickers = customParam
.split(',')
.map((t) => t.trim().toUpperCase())
.filter(Boolean);

const uniqueSymbols = Array.from(new Set([...customTickers, ...DEFAULT_TICKERS]));
const session = getSessionPhase();

const batchSize = 25;
const rows = [];
for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
const batch = uniqueSymbols.slice(i, i + batchSize);
const results = await Promise.all(
batch.map((sym) => fetchSingleChart(sym, session.daytimeActive))
);
rows.push(...results.filter(Boolean));
}

rows.sort((a, b) => {
const aActive = a.isCoilPop || a.isMultiCoil ? 1 : 0;
const bActive = b.isCoilPop || b.isMultiCoil ? 1 : 0;
if (bActive !== aActive) return bActive - aActive;
if (b.coilScore !== a.coilScore) return b.coilScore - a.coilScore;
if (b.rrRatio !== a.rrRatio) return b.rrRatio - a.rrRatio;
return b.relVol - a.relVol;
});

return NextResponse.json({
sessionPhase: session.phase,
daytimeActive: session.daytimeActive,
totalScanned: uniqueSymbols.length,
totalReturned: rows.length,
updatedAt: new Date().toISOString(),
rows
});
}
