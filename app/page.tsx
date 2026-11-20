
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
source?: 'live' | 'fallback' | string;
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
row.setup.toUpperCase().includes(q) ||
(row.source || '').toUpperCase().includes(q)
);
});
}, [rows, filterText, coilPopOnly, primeBandOnly]);

const liveCount = useMemo(
() => rows.filter((r) => r.source === 'live').length,
[rows]
);

const fallbackCount = useMemo(
() => rows.filter((r) => r.source !== 'live').length,
[rows]
);

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
<main className="min-h-screen bg-[#0713
