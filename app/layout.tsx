import type { Metadata } from 'next';

export const metadata: Metadata = {
title: 'Speedy Early-Ignition Engine',
description: 'Real-time momentum stock scanner and pilot advisory feed',
};

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<html lang="en" className="dark">
<head>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body className="bg-slate-950 text-slate-100 antialiased">
{children}
</body>
</html>
);
}
