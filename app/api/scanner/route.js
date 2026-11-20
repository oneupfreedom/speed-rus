// 1. True live % off yesterday's close (prevents lagging screener % mismatches)
const truePct =
previousClose && previousClose > 0
? ((price - previousClose) / previousClose) * 100
: changePercent;

// 2. Evaluate the 3-Point Check for +5% Runway
const passPctBand = truePct >= 1.5 && truePct <= 2.35;
const passTorqueCap =
price >= 5 &&
price <= 85 &&
(!marketCap || (marketCap >= 500_000_000 && marketCap <= 35_000_000_000));
const passRelVol = relVol >= 1.5;

const threePointPassedCount = [passPctBand, passTorqueCap, passRelVol].filter(Boolean).length;
const isPrimeEarlyCoil =
setup === 'COIL POP' && passPctBand && passTorqueCap && passRelVol;

return {
symbol,
name,
price,
changePercent: Number(truePct.toFixed(2)), // Uses true live % off previousClose
relVol,
score,
setup,
signal,
isPrimeEarlyCoil,
threePoint: {
passedCount: threePointPassedCount, // 0 to 3
passPctBand, // Rule 1: 1.5% - 2.35% true live %
passTorqueCap, // Rule 2: $5-$85 & mid-cap torque ($500M-$35B)
passRelVol, // Rule 3: Rel Vol >= 1.5x
},
};
