
import { NextResponse } from "next/server";

const ASIAN_TICKERS = new Set([
"INDA",
"KWEB",
"FXI",
"MCHI",
"BABA",
"PDD",
"JD",
"BIDU",
"NIO",
"XPEV",
"LI",
"TSM",
]);

function getRegion(symbol = "") {
return ASIAN_TICKERS.has(String(symbol).trim().toUpperCase())
? "ASIAN"
: "AMERICAN";
}

// Helper you attach to each scanned row object in your existing scanner logic:
// row.region = getRegion(row.symbol);

async function handleScan(request) {
try {
// Extract custom tickers from ?tickers=... (GET) or JSON body { tickers } (POST)
const { searchParams } = new URL(request.url);
let customTickers = [];

if (request.method === "POST") {
const body = await request.json().catch(() => ({}));
if (Array.isArray(body.tickers)) {
customTickers = body.tickers;
} else if (typeof body.tickers === "string") {
customTickers = body.tickers.split(",");
}
} else {
const qTickers = searchParams.get("tickers");
if (qTickers) customTickers = qTickers.split(",");
}

// Replace this call with your existing batch scanner function that returns `rows`
// and attach `region: getRegion(item.symbol)` to every row.
const rows = [];

return NextResponse.json({
ok: true,
customTickers,
rows: rows.map((item) => ({
...item,
region: getRegion(item.symbol),
})),
});
} catch (err) {
return NextResponse.json(
{ ok: false, error: err?.message || "Scanner error" },
{ status: 500 }
);
}
}

export async function GET(request) {
return handleScan(request);
}

export async function POST(request) {
return handleScan(request);
}
