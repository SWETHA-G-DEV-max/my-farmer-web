import React, { useMemo, useState } from 'react';
import {
  ADVISORY_MARKETS,
  AdvisoryCropDataset,
  NearbyMarketId,
} from '../data/marketHistoryData';
import { computeSMA } from '../logic/marketAdvisory';

interface MarketTrendChartProps {
  crop: AdvisoryCropDataset;
  focusMarketId: NearbyMarketId;
}

export const MarketTrendChart: React.FC<MarketTrendChartProps> = ({
  crop,
  focusMarketId,
}) => {
  const [windowDays, setWindowDays] = useState<7 | 14 | 30>(30);
  const [visibleMarkets, setVisibleMarkets] = useState<Record<NearbyMarketId, boolean>>({
    'salem-uzhavar': true,
    'attur-regulated': true,
    'erode-mandi': true,
    'namakkal-yard': true,
  });
  const [showSma, setShowSma] = useState<boolean>(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const slicePoints = useMemo(
    () => crop.history.slice(-windowDays),
    [crop.history, windowDays]
  );

  const activeMarkets = useMemo(
    () => ADVISORY_MARKETS.filter((m) => visibleMarkets[m.id]),
    [visibleMarkets]
  );

  const toggleMarket = (id: NearbyMarketId) => {
    setVisibleMarkets((prev) => {
      const enabledCount = Object.values(prev).filter(Boolean).length;
      if (prev[id] && enabledCount <= 1) return prev; // keep at least 1 market visible
      return { ...prev, [id]: !prev[id] };
    });
  };

  // Compute 7-day rolling SMA series for the focus market
  const smaSeries = useMemo(() => {
    const fullSeries = crop.history.map((pt) => pt.pricesByMarket[focusMarketId]);
    const offset = crop.history.length - slicePoints.length;
    return slicePoints.map((_, idx) => {
      const fullIdx = offset + idx;
      const start = Math.max(0, fullIdx - 6);
      return computeSMA(fullSeries.slice(start, fullIdx + 1));
    });
  }, [crop.history, slicePoints, focusMarketId]);

  const { minVal, maxVal } = useMemo(() => {
    const allNums: number[] = [];
    for (const pt of slicePoints) {
      for (const m of activeMarkets) {
        allNums.push(pt.pricesByMarket[m.id]);
      }
    }
    if (showSma) {
      allNums.push(...smaSeries);
    }
    const rawMin = Math.min(...allNums);
    const rawMax = Math.max(...allNums);
    const pad = Math.max(40, Math.round((rawMax - rawMin) * 0.14));
    return {
      minVal: Math.max(0, Math.floor((rawMin - pad) / 10) * 10),
      maxVal: Math.ceil((rawMax + pad) / 10) * 10,
    };
  }, [slicePoints, activeMarkets, showSma, smaSeries]);

  const width = 760;
  const height = 290;
  const padLeft = 64;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => {
    if (slicePoints.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (slicePoints.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const span = Math.max(1, maxVal - minVal);
    return padTop + plotH - ((val - minVal) / span) * plotH;
  };

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      ticks.push(Math.round(minVal + ((maxVal - minVal) * i) / steps));
    }
    return ticks;
  }, [minVal, maxVal]);

  const xTickIndices = useMemo(() => {
    const len = slicePoints.length;
    if (len <= 7) return slicePoints.map((_, i) => i);
    const step = len <= 14 ? 3 : 6;
    const indices: number[] = [];
    for (let i = 0; i < len; i += step) indices.push(i);
    if (indices[indices.length - 1] !== len - 1) indices.push(len - 1);
    return indices;
  }, [slicePoints]);

  const activeHoverIdx =
    hoverIdx !== null && hoverIdx >= 0 && hoverIdx < slicePoints.length
      ? hoverIdx
      : slicePoints.length - 1;
  const hoveredPoint = slicePoints[activeHoverIdx];

  return (
    <div className="space-y-4">
      {/* Chart Controls: Range + Market Toggles + SMA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {ADVISORY_MARKETS.map((m) => {
            const active = visibleMarkets[m.id];
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMarket(m.id)}
                className={`inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: active ? m.color : '#cbd5e1' }}
                />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSma((v) => !v)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap ${
              showSma
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            7-Day Avg Line
          </button>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200">
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setWindowDays(d);
                  setHoverIdx(null);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  windowDays === d
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Day Inspector Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="font-semibold text-slate-800">
          {hoverIdx !== null ? 'Selected Day:' : 'Latest Day:'}{' '}
          <span className="font-mono tabular-nums text-emerald-800">
            {hoveredPoint.dayLabel} ({hoveredPoint.date})
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {activeMarkets.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <span className="text-slate-600">{m.district}:</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                ₹{hoveredPoint.pricesByMarket[m.id].toLocaleString('en-IN')}/qtl
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive SVG Line Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[540px] h-auto select-none"
          role="img"
          aria-label={`Price trend chart for ${crop.name} over last ${windowDays} days`}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Horizontal gridlines + Y labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  ₹{tick.toLocaleString('en-IN')}
                </text>
              </g>
            );
          })}

          {/* X-axis date labels */}
          {xTickIndices.map((idx) => {
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-500 text-[11px] font-mono"
              >
                {slicePoints[idx].dayLabel}
              </text>
            );
          })}

          {/* Hover vertical guide line */}
          <line
            x1={getX(activeHoverIdx)}
            y1={padTop}
            x2={getX(activeHoverIdx)}
            y2={padTop + plotH}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 3"
          />

          {/* 7-day Moving Average dashed overlay */}
          {showSma && smaSeries.length > 1 && (
            <polyline
              fill="none"
              stroke="#0f172a"
              strokeWidth={1.75}
              strokeDasharray="5 4"
              points={smaSeries.map((val, i) => `${getX(i)},${getY(val)}`).join(' ')}
            />
          )}

          {/* Market lines */}
          {activeMarkets.map((m) => {
            const pts = slicePoints
              .map((pt, i) => `${getX(i)},${getY(pt.pricesByMarket[m.id])}`)
              .join(' ');
            const hy = getY(hoveredPoint.pricesByMarket[m.id]);
            const hx = getX(activeHoverIdx);
            return (
              <g key={m.id}>
                <polyline
                  fill="none"
                  stroke={m.color}
                  strokeWidth={2.25}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={pts}
                />
                <circle
                  cx={hx}
                  cy={hy}
                  r={4.5}
                  fill="#ffffff"
                  stroke={m.color}
                  strokeWidth={2.5}
                />
              </g>
            );
          })}

          {/* Invisible vertical hit columns for smooth pointer interaction */}
          {slicePoints.map((pt, idx) => {
            const colW = plotW / Math.max(1, slicePoints.length);
            const cx = getX(idx) - colW / 2;
            return (
              <rect
                key={pt.date}
                x={Math.max(padLeft, cx)}
                y={padTop}
                width={colW}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(idx)}
                onClick={() => setHoverIdx(idx)}
                style={{ cursor: 'crosshair' }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
