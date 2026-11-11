'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '@/engine/calculator';
import { TrendingUp, ArrowUpRight, Calendar, BarChart2 } from 'lucide-react';

interface RevenueChartProps {
  invoices: any[];
  currency?: string;
}

type Timeframe = '30d' | '6m' | '1y';

interface DataPoint {
  label: string;
  invoicedCents: number;
  collectedCents: number;
}

export function RevenueChart({ invoices = [], currency = 'USD' }: RevenueChartProps) {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('6m');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dataPoints = useMemo<DataPoint[]>(() => {
    const now = new Date();
    const points: DataPoint[] = [];

    if (timeframe === '30d') {
      // 4 weekly buckets
      for (let i = 3; i >= 0; i--) {
        const start = new Date(now.getTime() - (i + 1) * 7 * 86400000);
        const end = new Date(now.getTime() - i * 7 * 86400000);
        const label = `Week ${4 - i}`;

        let invoiced = 0;
        let collected = 0;

        for (const inv of invoices) {
          if (inv.status === 'void') continue;
          const invDate = new Date(inv.createdAt || inv.issueDate || now);
          if (invDate >= start && invDate <= end) {
            invoiced += inv.grandTotalCents || 0;
            collected += inv.paidCents || 0;
          }
        }

        points.push({ label, invoicedCents: invoiced, collectedCents: collected });
      }
    } else if (timeframe === '6m') {
      // 6 monthly buckets
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const monthName = d.toLocaleString('default', { month: 'short' });

        let invoiced = 0;
        let collected = 0;

        for (const inv of invoices) {
          if (inv.status === 'void') continue;
          const invDate = new Date(inv.createdAt || inv.issueDate || now);
          if (invDate >= d && invDate <= monthEnd) {
            invoiced += inv.grandTotalCents || 0;
            collected += inv.paidCents || 0;
          }
        }

        points.push({ label: monthName, invoicedCents: invoiced, collectedCents: collected });
      }
    } else {
      // 12 monthly buckets
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const monthName = d.toLocaleString('default', { month: 'short' });

        let invoiced = 0;
        let collected = 0;

        for (const inv of invoices) {
          if (inv.status === 'void') continue;
          const invDate = new Date(inv.createdAt || inv.issueDate || now);
          if (invDate >= d && invDate <= monthEnd) {
            invoiced += inv.grandTotalCents || 0;
            collected += inv.paidCents || 0;
          }
        }

        points.push({ label: monthName, invoicedCents: invoiced, collectedCents: collected });
      }
    }

    return points;
  }, [invoices, timeframe]);

  // Aggregate totals
  const totalInvoiced = dataPoints.reduce((acc, p) => acc + p.invoicedCents, 0);
  const totalCollected = dataPoints.reduce((acc, p) => acc + p.collectedCents, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // Max value for scaling
  const maxVal = Math.max(
    ...dataPoints.map((p) => Math.max(p.invoicedCents, p.collectedCents)),
    10000 // default minimum scale ($100)
  );

  // SVG dimensions
  const svgWidth = 700;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 24;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Calculate points
  const stepX = dataPoints.length > 1 ? graphWidth / (dataPoints.length - 1) : graphWidth;

  const invoicedCoords = dataPoints.map((p, i) => {
    const x = paddingX + i * stepX;
    const y = paddingY + graphHeight - (p.invoicedCents / maxVal) * graphHeight;
    return { x, y, data: p };
  });

  const collectedCoords = dataPoints.map((p, i) => {
    const x = paddingX + i * stepX;
    const y = paddingY + graphHeight - (p.collectedCents / maxVal) * graphHeight;
    return { x, y, data: p };
  });

  const buildPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

    return coords.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');
  };

  const invoicedLine = buildPath(invoicedCoords);
  const collectedLine = buildPath(collectedCoords);

  const invoicedArea =
    invoicedCoords.length > 0
      ? `${invoicedLine} L ${invoicedCoords[invoicedCoords.length - 1].x} ${
          paddingY + graphHeight
        } L ${invoicedCoords[0].x} ${paddingY + graphHeight} Z`
      : '';

  const collectedArea =
    collectedCoords.length > 0
      ? `${collectedLine} L ${collectedCoords[collectedCoords.length - 1].x} ${
          paddingY + graphHeight
        } L ${collectedCoords[0].x} ${paddingY + graphHeight} Z`
      : '';

  if (!mounted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 h-64 flex items-center justify-center">
        <div className="text-xs text-slate-400 font-medium">Loading financial charts...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>Revenue & Cashflow Velocity</span>
            </h3>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              {collectionRate}% Collection Rate
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time comparison of issued receivables vs cleared client payments
          </p>
        </div>

        {/* Controls & Legend */}
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600 font-medium">Invoiced</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Collected</span>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === '30d' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeframe('6m')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === '6m' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              6M
            </button>
            <button
              onClick={() => setTimeframe('1y')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === '1y' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              1Y
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative pt-4 overflow-hidden">
        {totalInvoiced === 0 && totalCollected === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">No transactions recorded for this timeframe</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Create an invoice to view live revenue and cashflow velocity curves.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingY + graphHeight * ratio;
                return (
                  <line
                    key={idx}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Area Fills */}
              <path d={invoicedArea} fill="url(#invoicedGrad)" />
              <path d={collectedArea} fill="url(#collectedGrad)" />

              {/* Invoiced Stroke */}
              <path
                d={invoicedLine}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Collected Stroke */}
              <path
                d={collectedLine}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {invoicedCoords.map((pt, i) => (
                <g key={`inv-${i}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === i ? '5' : '3.5'}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              ))}

              {collectedCoords.map((pt, i) => (
                <g key={`col-${i}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === i ? '5' : '3.5'}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-6 pt-2 text-[10px] text-slate-400 font-medium border-t border-slate-100">
              {dataPoints.map((p, i) => (
                <div
                  key={i}
                  className={`text-center cursor-pointer transition-colors ${
                    hoveredIndex === i ? 'text-blue-600 font-bold' : ''
                  }`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {p.label}
                </div>
              ))}
            </div>

            {/* Hover Tooltip Box */}
            {hoveredIndex !== null && dataPoints[hoveredIndex] && (
              <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-xs">
                <span className="font-semibold text-slate-700">
                  {dataPoints[hoveredIndex].label} Summary:
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-blue-700 font-medium">
                    Invoiced: {formatCurrency(dataPoints[hoveredIndex].invoicedCents, currency)}
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    Collected: {formatCurrency(dataPoints[hoveredIndex].collectedCents, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

