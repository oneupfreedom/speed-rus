
import { NextResponse } from 'next/server';

const DEFAULT_TICKERS = [
'NVDA', 'TSLA', 'AMD', 'SMCI', 'MARA', 'RIOT', 'COIN', 'MSTR', 'PLTR', 'SOFI',
'IONQ', 'RGTI', 'QUBT', 'D-WAVE', 'QBTS', 'OKLO', 'SMR', 'CCJ', 'UEC', 'DNN',
'LUNR', 'RKLB', 'ASTS', 'ACHR', 'JOBY', 'HIMS', 'AFRM', 'UPST', 'HOOD', 'RIVN',
'LCID', 'NIO', 'XPEV', 'BABA', 'BIDU', 'PDD', 'JD', 'ARM', 'MRVL', 'AVGO',
'MU', 'INTC', 'QCOM', 'TXN', 'AMAT', 'LRCX', 'KLAC', 'ASML', 'SNOW', 'NET',
'DDOG', 'MDB', 'PANW', 'CRWD', 'ZS', 'OKTA', 'SHOP.TO', 'CSU.TO', 'DFN.TO', 'HNU.TO',
'HOU.TO', 'HQU.TO', 'HQD.TO', 'BITX', 'IBIT', 'FBTC', 'ETHA', 'TQQQ', 'SQQQ', 'SOXL',
'SOXS', 'SPXL', 'SPXS', 'LABU', 'LABD', 'FAS', 'FAZ', 'NUGT', 'DUST', 'GDXJ',
'SILJ', 'URA', 'URNM', 'NLR', 'XLE', 'XOP', 'OIH', 'XBI', 'ARKK', 'ARKG',
'KWEB', 'FXI', 'EWZ', 'INDA', 'GLD', 'SLV', 'USO', 'UNG', 'TLT', 'TMF',
'TMV', 'UVXY', 'VXX', 'CVNA', 'CARV', 'CHWY', 'ROKU', 'TTD', 'SNAP', 'PINS',
'UBER', 'LYFT', 'DASH', 'ABNB', 'DKNG', 'PENN', 'MGM', 'WYNN', 'CCL', 'RCL',
'NCLH', 'AAL', 'UAL', 'DAL', 'JBLU', 'BA', 'GE', 'CAT', 'DE', 'URI',
'FCX', 'MP', 'ALB', 'LAC', 'ENPH', 'FSLR', 'RUN', 'SEDG', 'PLUG', 'BE',
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
'ABEV.TO', 'TD.TO', 'RY.TO', 'ENB.TO', 'CNQ.TO', 'SU.TO', 'CVE.TO', 'ARX.TO', 'TOU.TO', 'IMO.TO',
'BNS.TO', 'BMO.TO', 'CM.TO', 'MFC.TO', 'SLF.TO', 'GWO.TO', 'POW.TO', 'BAM.TO', 'BN.TO', 'ATD.TO',
'DOL.TO', 'WSP.TO', 'QSR.TO', 'TRI.TO', 'CP.TO', 'CNR.TO', 'T.TO', 'BCE.TO', 'RCI-B.TO', 'ENB',
'CNQ', 'SU', 'SHOP', 'RY', 'TD', 'BAM', 'BN', 'BHP', 'RIO', 'VALE',
'SQM', 'TECK-B.TO', 'FM.TO', 'CS.TO', 'HBM.TO', 'LUN.TO', 'IVN.TO', 'K.TO', 'AEM.TO', 'ABX.TO',
'GOLD', 'NEM', 'WPM', 'FNV', 'AGI.TO', 'ELD.TO', 'BTO.TO', 'OR.TO', 'PAAS', 'AG',
'HL', 'CDE', 'EXK', 'MAG', 'SVM', 'BTG', 'EGO', 'IAG.TO', 'NGD.TO', 'OGC.TO'
].slice(0, 280);

const CACHE_TTL_MS = 20_000;
const BATCH_SIZE = 50;

let scannerCache = {
timestamp: 0,
key: '',
data: null,
};

function getSessionPhase(now = new Date()) {
try {
const parts = new Intl.DateTimeFormat('en-US', {
timeZone: 'America/New_York',
weekday: 'short',
hour: '2-digit',
minute: '2-digit',
hour12: false,
}).formatToParts(now);

const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);

if (weekday === 'Sat' || weekday === 'Sun') {
return 'POST_CLOSE';
}
const mins = hh * 60 + mm;
if (mins < 570) return 'PRE_BELL';
if (mins >= 575 && mins <= 600) return 'BELL_935_WINDOW';
if (mins > 570 && mins <= 960) return 'DAY_SESSION';
return 'POST_CLOSE';
} catch {
return 'POST_CLOSE';
}
}

function isRegularDaytime(phase) {
return phase === 'BELL_935_WINDOW' || phase === 'DAY_SESSION';
}

function calcMultiDayRangePct(quotes5d30m = []) {
if (!Array.isArray(quotes5d30m) || quotes5d30m.length < 4) return null;
const valid = quotes5d30m.filter(
(q) =>
q &&
typeof q.high === 'number' &&
Number.isFinite(q.high) &&
typeof q.low === 'number' &&
Number.isFinite(q.low) &&
q.high > 0 &&
q.low > 0
);
if (valid.length < 4) return null;
const highest = Math.max(...valid.map((q) => q.high));
const lowest = Math.min(...valid.map((q) => q.low));
if (!lowest || lowest <= 0) return null;
return Number((((highest - lowest) / lowest) * 100).toFixed(2));
}

async function fetchSingleChart(symbol, sessionPhase) {
const daytimeActive = isRegularDaytime(sessionPhase);
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
symbol
)}?interval=30m&range=5d&includePrePost=false`;

try {
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5000);

const res = await fetch(url, {
headers: { 'User-Agent': 'Mozilla/5.0' },
cache: 'no-store',
signal: controller.signal,
}).finally(() => clearTimeout(timer));

if (!res.ok) {
return {
symbol,
isFallback: true,
setup: 'WATCH',
actionCall: 'SKIP / WATCH',
profitVerdict: 'NO DATA',
coilScore: 0,
setupGrade: '-',
};
}

const json = await res.json();
const result = json?.chart?.result?.[0];
const meta = result?.meta;
const quote = result?.indicators?.quote?.[0];

const rawCloses = Array.isArray(quote?.close) ? quote.close : [];
const rawHighs = Array.isArray(quote?.high) ? quote.high : [];
const rawLows = Array.isArray(quote?.low) ? quote.low : [];
const rawVols = Array.isArray(quote?.volume) ? quote.volume : [];

if (!meta || rawCloses.length === 0) {
return {
symbol,
isFallback: true,
setup: 'WATCH',
actionCall: 'SKIP / WATCH',
profitVerdict: 'NO DATA',
coilScore: 0,
setupGrade: '-',
};
}

const closes = rawCloses.filter((v) => typeof v === 'number' && Number.isFinite(v) && v > 0);
const highs = rawHighs.filter((v) => typeof v === 'number' && Number.isFinite(v) && v > 0);
const lows = rawLows.filter((v) => typeof v === 'number' && Number.isFinite(v) && v > 0);
const vols = rawVols.filter((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0);

const rawPrice =
typeof meta.regularMarketPrice === 'number' &&
Number.isFinite(meta.regularMarketPrice) &&
meta.regularMarketPrice > 0
? meta.regularMarketPrice
: closes[closes.length - 1] || 0;

const prevClose =
typeof meta.previousClose === 'number' &&
Number.isFinite(meta.previousClose) &&
meta.previousClose > 0
? meta.previousClose
: typeof meta.chartPreviousClose === 'number' &&
Number.isFinite(meta.chartPreviousClose) &&
meta.chartPreviousClose > 0
? meta.chartPreviousClose
: rawPrice;

if (!rawPrice || rawPrice <= 0) {
return {
symbol,
isFallback: true,
setup: 'WATCH',
actionCall: 'SKIP / WATCH',
profitVerdict: 'NO DATA',
coilScore: 0,
setupGrade: '-',
};
}

const changePercent =
prevClose > 0 ? Number((((rawPrice - prevClose) / prevClose) * 100).toFixed(2)) : 0;

const recentSliceLen = Math.min(6, closes.length);
const recentHighs = highs.slice(-recentSliceLen);
const recentLows = lows.slice(-recentSliceLen);
const recentHigh = recentHighs.length ? Math.max(...recentHighs) : rawPrice;
const recentLow = recentLows.length ? Math.min(...recentLows) : rawPrice * 0.99;

const rangePct =
recentLow > 0 ? Number((((recentHigh - recentLow) / recentLow) * 100).toFixed(2)) : 0;

const avgVol =
vols.length > 1
? vols.slice(0, -1).reduce((acc, v) => acc + v, 0) / Math.max(1, vols.length - 1)
: 0;
const lastVol = vols.length ? vols[vols.length - 1] : 0;
const relVol = avgVol > 0 ? Number((lastVol / avgVol).toFixed(2)) : 1.0;

const maxLen = Math.max(rawHighs.length, rawLows.length);
const bars5d = [];
for (let i = 0; i < maxLen; i += 1) {
bars5d.push({ high: rawHighs[i], low: rawLows[i] });
}
const multiDayRangePct = calcMultiDayRangePct(bars5d);

const isFallback = false;
const withinActiveCap = changePercent >= 0 && changePercent <= 3.0;

const standardCoilPop =
!isFallback &&
daytimeActive &&
withinActiveCap &&
changePercent >= 1.0 &&
changePercent <= 2.75 &&
rangePct <= 1.05 &&
relVol >= 1.3;

const isMultiCoil =
!isFallback &&
daytimeActive &&
withinActiveCap &&
typeof multiDayRangePct === 'number' &&
multiDayRangePct <= 3.2 &&
changePercent >= 1.0 &&
changePercent <= 3.25 &&
relVol >= 1.15;

const isCoilPop = standardCoilPop || isMultiCoil;
const isCoiling = !isFallback && withinActiveCap && rangePct <= 1.05;

const setup = isMultiCoil
? 'MULTI-COIL'
: isCoilPop
? 'COIL POP'
: isCoiling
? 'COILING'
: 'WATCH';

const stopCandidate = recentLow > 0 ? recentLow * 0.994 : rawPrice * 0.985;
const maxRiskFloor = rawPrice * 0.982;
const stopPrice = Number(Math.max(stopCandidate, maxRiskFloor).toFixed(2));
const trimPrice = Number((rawPrice * 1.0325).toFixed(2));
const target5Pct = Number((rawPrice * 1.05).toFixed(2));

const downsideRiskPct =
rawPrice > 0 && stopPrice < rawPrice
? Number((((rawPrice - stopPrice) / rawPrice) * 100).toFixed(2))
: 1.5;

const upsideTo5Pct =
rawPrice > 0 && target5Pct > rawPrice
? Number((((target5Pct - rawPrice) / rawPrice) * 100).toFixed(2))
: 5.0;

const rrRatio =
downsideRiskPct > 0 ? Number((upsideTo5Pct / downsideRiskPct).toFixed(2)) : 1.0;

const rawRisk =
25 +
Math.min(25, Math.max(0, rangePct * 18)) +
(typeof multiDayRangePct === 'number' ? Math.min(15, multiDayRangePct * 4) : 6) +
(relVol < 1.15 ? 14 : relVol < 1.3 ? 6 : 0) +
Math.min(20, Math.max(0, Math.abs(changePercent) * 4.5));

const riskScore = Number(Math.min(99, Math.max(10, rawRisk)).toFixed(0));
const riskLevel = riskScore >= 70 ? 'HIGH RISK' : riskScore >= 45 ? 'MOD RISK' : 'LOW RISK';

let coilScore = 0;
if (isMultiCoil) {
const baseRange = typeof multiDayRangePct === 'number' ? multiDayRangePct : rangePct;
const multiTightnessPts = Math.max(0, Math.min(35, (3.2 - baseRange) * 14));
const multiVolumePts = Math.max(0, Math.min(35, (relVol - 1.0) * 26));
const popPts = changePercent >= 1.0 && changePercent <= 3.25 ? 18 : 8;
const rrPts = Math.max(0, Math.min(12, rrRatio * 4));
coilScore = Math.round(multiTightnessPts + multiVolumePts + popPts + rrPts);
} else if (standardCoilPop) {
const tightnessPts = Math.max(0, Math.min(35, (1.05 - rangePct) * 45));
const volumePts = Math.max(0, Math.min(35, (relVol - 1.0) * 28));
const sweetSpotPts =
changePercent >= 1.2 && changePercent <= 2.4 ? 18 : changePercent > 0 ? 10 : 0;
const rrPts = Math.max(0, Math.min(12, rrRatio * 4));
coilScore = Math.round(tightnessPts + volumePts + sweetSpotPts + rrPts);
}

const setupGrade =
coilScore >= 75 ? 'A+' : coilScore >= 55 ? 'A' : coilScore > 0 ? 'B' : '-';

const actionCall = !daytimeActive
? 'WAIT (DAYTIME ONLY)'
: isCoilPop
? 'BUY / ENTER'
: isCoiling
? 'WATCH COIL'
: 'SKIP / WATCH';

const profitVerdict = !daytimeActive
? 'WAIT FOR DAYTIME'
: isCoilPop && rrRatio >= 2.0 && riskScore < 75
? 'FAVORABLE BUY'
: isCoilPop && riskScore >= 75
? 'HIGH-RISK BUY'
: changePercent >= 4.5
? 'TAKE / TRAIL PROFIT'
: changePercent >= 3.0
? 'TRIM / WATCH EXIT'
: 'HOLD / WAIT';

return {
symbol,
price: Number(rawPrice.toFixed(2)),
changePercent,
rangePct,
multiDayRangePct,
relVol,
isFallback,
isCoilPop,
isMultiCoil,
isCoiling,
setup,
entryPrice: Number(rawPrice.toFixed(2)),
stopPrice,
trimPrice,
target5Pct,
downsideRiskPct,
upsideTo5Pct,
rrRatio,
riskScore,
riskLevel,
coilScore,
setupGrade,
actionCall,
profitVerdict,
market: symbol.endsWith('.TO') ? 'CA (.TO)' : 'US (USD)',
};
} catch {
return {
symbol,
isFallback: true,
setup: 'WATCH',
actionCall: 'SKIP / WATCH',
profitVerdict: 'ERROR',
coilScore: 0,
setupGrade: '-',
};
}
}

export async function GET(request) {
try {
const { searchParams } = new URL(request.url);
const customParam = searchParams.get('symbols');
const tickers = customParam
? customParam
.split(',')
.map((s) => s.trim().toUpperCase())
.filter(Boolean)
.slice(0, 280)
: DEFAULT_TICKERS;

const sessionPhase = getSessionPhase();
const cacheKey = `${sessionPhase}:${tickers.join(',')}`;
const now = Date.now();

if (
scannerCache.data &&
scannerCache.key === cacheKey &&
now - scannerCache.timestamp < CACHE_TTL_MS
) {
return NextResponse.json(scannerCache.data);
}

const rows = [];
for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
const chunk = tickers.slice(i, i + BATCH_SIZE);
const chunkResults = await Promise.all(
chunk.map((sym) => fetchSingleChart(sym, sessionPhase))
);
rows.push(...chunkResults);
}

const validRows = rows.filter((r) => !r.isFallback);

const rankedRows = [...validRows].sort((a, b) => {
if (a.isCoilPop !== b.isCoilPop) return a.isCoilPop ? -1 : 1;
if (b.coilScore !== a.coilScore) return b.coilScore - a.coilScore;
return b.rrRatio - a.rrRatio;
});

const payload = {
sessionPhase,
daytimeActive: isRegularDaytime(sessionPhase),
totalScanned: tickers.length,
activeCount: validRows.length,
topCoilSetups: rankedRows.filter((r) => r.isCoilPop).slice(0, 10),
rows: rankedRows,
updatedAt: new Date().toISOString(),
};

scannerCache = {
timestamp: now,
key: cacheKey,
data: payload,
};

return NextResponse.json(payload);
} catch (err) {
return NextResponse.json(
{
error: err instanceof Error ? err.message : 'Scanner route failed',
rows: [],
topCoilSetups: [],
},
{ status: 500 }
);
}
}
