
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
const rawPrice = meta.regularMarketPrice ?? latestBar.close;
const rawPrevClose = meta.chartPreviousClose ?? meta.previousClose ?? validBars[0].open;
if (!rawPrice || !rawPrevClose) return null;

const rawChangePct = ((rawPrice - rawPrevClose) / rawPrevClose) * 100;
if (Math.abs(rawChangePct) > 250) return null;

const price = Number(rawPrice.toFixed(rawPrice < 1 ? 4 : 2));
const changePercent = Number(rawChangePct.toFixed(2));
const absChangePercent = Number(Math.abs(changePercent).toFixed(2));
const pctToFiveTarget = Number((5.0 - changePercent).toFixed(2));
const isStretched = changePercent > 5.0;

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

// How close price is to breaking above the recent coil ceiling
const distToCoilHighPct =
coilHigh > 0 ? Number((((coilHigh - rawPrice) / coilHigh) * 100).toFixed(2)) : 99;
const pressingCoilTop = distToCoilHighPct <= 0.45 && changePercent >= -0.25 && changePercent <= 3.5;

const multiBars = validBars.slice(-12, -1);
const multiHigh = multiBars.length ? Math.max(...multiBars.map((b) => b.high)) : coilHigh;
const multiLow = multiBars.length ? Math.min(...multiBars.map((b) => b.low)) : coilLow;
const multiDayRangePct =
multiLow > 0
? Number((((multiHigh - multiLow) / multiLow) * 100).toFixed(2))
: null;

const relVol = computeRelVol(validBars, meta);

const isTightCoil = rangePct <= 1.35;
const isMultiTight = multiDayRangePct !== null && multiDayRangePct <= 3.6;
const inEarlyPopBand = changePercent >= 0.4 && changePercent <= 3.25;

const isCoilPop =
daytimeActive && isTightCoil && inEarlyPopBand && relVol >= 0.85;
const isMultiCoil =
daytimeActive && !isCoilPop && isMultiTight && inEarlyPopBand && relVol >= 0.8;
const isPreJump =
(isTightCoil || isMultiTight) &&
pressingCoilTop &&
relVol >= 0.65;
const isCoiling = (isTightCoil || isMultiTight) && changePercent > -0.5 && changePercent < 1.0;

// Ready Up: early move or coil ceiling press with volume & runway toward +5%
const isReadyUp =
!isStretched &&
changePercent >= -0.25 &&
changePercent <= 3.5 &&
relVol >= 0.75 &&
(isCoilPop || isMultiCoil || isPreJump || (changePercent >= 0.25 && isTightCoil));

let setup = 'WATCH';
if (isReadyUp && (isCoilPop || isMultiCoil)) setup = 'READY UP • IGNITE';
else if (isReadyUp && isPreJump) setup = 'READY UP • COIL TOP';
else if (isReadyUp) setup = 'READY UP';
else if (isPreJump) setup = 'PRE-JUMP';
else if (isCoiling) setup = 'COILING';
else if (isStretched) setup = 'STRETCHED';

const decimals = rawPrice < 1 ? 4 : 2;
const rawStop = Math.min(coilLow * 0.994, rawPrice * 0.985);
const floorStop = rawPrice * 0.982;
const stopPrice = Number(Math.max(rawStop, floorStop).toFixed(decimals));
const trimPrice = Number((rawPrice * 1.0325).toFixed(decimals));
const target5Price = Number((rawPrice * 1.05).toFixed(decimals));

const downsideRiskPct = Number(
Math.max(((rawPrice - stopPrice) / rawPrice) * 100, 0.4).toFixed(2)
);
const upsideTo5Pct = 5.0;
const rrRatio = Number((upsideTo5Pct / downsideRiskPct).toFixed(2));

const volatilityPenalty = Math.min(45, Math.round(rangePct * 14));
const pricePenalty = rawPrice < 3 ? 25 : rawPrice < 10 ? 10 : 0;
const riskScore = Math.min(99, Math.max(25, 35 + volatilityPenalty + pricePenalty));

let coilScore = 0;
let setupGrade = '-';
if (isReadyUp || isPreJump || isCoiling) {
const compressionPts = Math.min(35, Math.round(Math.max(0, 1.5 - Math.min(rangePct, 1.5)) * 24));
const volPts = Math.min(35, Math.round(relVol * 16));
const ceilingPts = pressingCoilTop ? 18 : 8;
const runwayPts = Math.min(12, Math.round(Math.max(0, pctToFiveTarget) * 2.5));
coilScore = Math.min(99, compressionPts + volPts + ceilingPts + runwayPts);
setupGrade =
coilScore >= 85 ? 'A+' : coilScore >= 72 ? 'A' : coilScore >= 60 ? 'B' : 'C';
}

let profitVerdict = 'HOLD / WAIT';
if (!daytimeActive) {
profitVerdict = 'WAIT FOR DAYTIME';
} else if (isStretched) {
profitVerdict = 'SKIP CHASE (>5%)';
} else if (isReadyUp) {
profitVerdict = 'EARLY +5% WATCH';
} else if (changePercent < 0) {
profitVerdict = 'RED / AVOID';
}

return {
symbol: symbol.toUpperCase(),
market: symbol.toUpperCase().endsWith('.TO') ? 'CA' : 'US',
currency: symbol.toUpperCase().endsWith('.TO') ? 'CAD' : 'USD',
price,
changePercent,
absChangePercent,
pctToFiveTarget,
distToCoilHighPct,
pressingCoilTop,
isStretched,
isPreJump,
isReadyUp,
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
const aRank = a.isReadyUp ? 4 : a.isPreJump ? 3 : a.changePercent > 0 && !a.isStretched ? 2 : a.isStretched ? 0 : 1;
const bRank = b.isReadyUp ? 4 : b.isPreJump ? 3 : b.changePercent > 0 && !b.isStretched ? 2 : b.isStretched ? 0 : 1;
if (bRank !== aRank) return bRank - aRank;
if (b.coilScore !== a.coilScore) return b.coilScore - a.coilScore;
if (b.relVol !== a.relVol) return b.relVol - a.relVol;
return b.changePercent - a.changePercent;
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
