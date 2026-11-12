import { NextResponse } from 'next/server';

export async function GET() {
try {
const data = [
{
ticker: "GME",
name: "GameStop Corp.",
price: 24.50,
change: 14.8,
shortInterest: "22.4%",
float: "285.4M",
ctb: "12.5%",
rvol: "4.2x",
squeezeScore: 92,
dilutionSafe: true
},
{
ticker: "AMC",
name: "AMC Entertainment",
price: 5.12,
change: 8.4,
shortInterest: "19.1%",
float: "260.1M",
ctb: "9.8%",
rvol: "3.5x",
squeezeScore: 85,
dilutionSafe: true
},
{
ticker: "PLTR",
name: "Palantir Technologies",
price: 38.90,
change: 6.2,
shortInterest: "11.2%",
float: "2.1B",
ctb: "4.1%",
rvol: "2.8x",
squeezeScore: 78,
dilutionSafe: true
},
{
ticker: "SOUN",
name: "SoundHound AI",
price: 7.45,
change: 18.9,
shortInterest: "24.5%",
float: "145.2M",
ctb: "28.4%",
rvol: "6.1x",
squeezeScore: 96,
dilutionSafe: true
}
];

return NextResponse.json(data, { status: 200 });
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
