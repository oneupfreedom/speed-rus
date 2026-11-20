
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface ScannerRow {
symbol: string;
name?: string;
price: number;
changePercent: number;
relVol: number;
score: number;
setup: string;
signal: string;
isCoilPop?: boolean;
isCoiling?: boolean;
}

const PHASE_LABELS: Record<string, string> = {
PRE_BELL: 'PRE-BELL (< 9:35 AM ET)',
BELL_935_WINDOW: '9:35 AM ET BELL WINDOW',
DAY_SESSION: 'ACTIVE SESSION (9:35 AM - 4:00 PM ET)',
POST_CLOSE: 'POST-CLOSE'
};

export default function ScannerPage() {
const [rows, setRows] = useState<ScannerRow[]>([]);
const [sessionPhase, setSessionPhase] = useState<string>('BELL_935_WINDOW');
const [filterText, setFilterText] = useState<string>('');
const [customInput, setCustomInput] = useState<string>('');
const [customTickers, setCustomTickers] = useState<string[]>([]);
const [coilPopOnly, setCoilPopOnly] = useState<boolean>(false);
const [primeBandOnly, setPrimeBandOnly] = useState<boolean>(false);
const [lockedSymbol, setLockedSymbol] = useState<string | null>(null);
const [lastSync, setLastSync] = useState<string>('');
const [loading, setLoading] = useState<boolean>(false);

const fetchScanner = useCallback(async (extraList: string[]) => {
setLoading(true);
try {
const query =
extraList.length > 0
? `?symbols=${encodeURIComponent(extraList.join(','))}`
: '';
const res = await fetch(`/api/scanner${query}`, { cache: 'no-store' });
const data = await res.json();
if (data?.ok && Array.isArray(data.rows)) {
setRows(data.rows);
if (data.sessionPhase) setSessionPhase(data.sessionPhase);
const timeStr = new Date().toLocaleTimeString([], {
hour: '2-digit',
minute: '2-digit',
second: '2-digit'
});
setLastSync(timeStr);
}
} catch {
// Keep existing rows on transient network hiccup
} finally {
setLoading(false);
}
}, []);

useEffect(() => {
fetchScanner(customTickers);
const interval = setInterval(() => {
fetchScanner(customTickers);
}, 30000);
return () => clearInterval(interval);
}, [fetchScanner, customTickers]);

const handleAddTickers = (e: React.FormEvent) => {
e.preventDefault();
const parsed = customInput
.split(',')
.map((s) => s.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, ''))
.filter(Boolean);

if (parsed.length === 0) return;

const merged = [...new Set([...parsed, ...customTickers])].slice(0, 30);
setCustomTickers(merged);
setCustomInput('');
};

const filteredRows = useMemo(() => {
const q = filterText.trim().toUpperCase();
return rows.filter((row) => {
if (coilPopOnly && !row.isCoilPop) return false;
if (
primeBandOnly &&
(row.changePercent < 1.5 || row.changePercent > 2.35)
) {
return false;
}
if (!q) return true;
return (
row.symbol.toUpperCase().includes(q) ||
(row.name || '').toUpperCase().includes(q) ||
row.setup.toUpperCase().includes(q)
);
});
}, [rows, filterText, coilPopOnly, primeBandOnly]);

const spotlight = useMemo(() => {
return rows.find((r) => r.isCoilPop) || rows[0] || null;
}, [rows]);

const lockedRow = useMemo(() => {
if (!lockedSymbol) return null;
return rows.find((r) => r.symbol === lockedSymbol) || null;
}, [rows, lockedSymbol]);

const lockedStalled = useMemo(() => {
if (!lockedRow) return false;
return lockedRow.changePercent < 0.85 || lockedRow.relVol < 1.0;
}, [lockedRow]);

const overtakenByCoil = useMemo(() => {
if (!lockedRow) return null;
return (
rows.find(
(r) =>
r.symbol !== lockedRow.symbol &&
r.isCoilPop &&
r.changePercent >= lockedRow.changePercent + 1.2
) || null
);
}, [rows, lockedRow]);

return (
<main className="min-h-screen bg-[#07132b] text-white p-4 md:p-8 font-sans">
<div className="max-w-6xl mx-auto space-y-6">
{/* Header */}
<header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-blue-800/60 pb-5">
<div>
<p className="text-xs uppercase tracking-widest text-cyan-300 font-semibold">
COIL-TO-COIL MOMENTUM CO-PILOT • +5% UPSIDE TARGET
</p>
<h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
Coil Pop Early-Ignition Scanner
</h1>
<p className="text-sm text-blue-200/80 mt-1">
9:35 AM ET bell ignition • +1.0% to +2.35% pop band • Range coil + volume confirmation
</p>
</div>

<div className="flex flex-wrap items-center gap-3">
<span className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-900/80 border border-blue-600/50 text-cyan-200">
{PHASE_LABELS[sessionPhase] || sessionPhase}
</span>
<span className="text-xs text-blue-200/80">
Auto-Sync (30s): {lastSync || 'Syncing...'}
</span>
<button
type="button"
onClick={() => fetchScanner(customTickers)}
className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
>
{loading ? 'SYNCING...' : 'REFRESH'}
</button>
</div>
</header>

{/* Locked Position Alert Banner */}
{lockedRow && (
<div className="rounded-xl bg-slate-900/90 border border-cyan-500/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
<div>
<div className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">
LOCKED ACTIVE POSITION: {lockedRow.symbol} • +5% GOAL: $
{(lockedRow.price * 1.05).toFixed(2)}
</div>
<div className="text-sm mt-1">
Current: <strong>${lockedRow.price.toFixed(2)}</strong> (
{lockedRow.changePercent >= 0 ? '+' : ''}
