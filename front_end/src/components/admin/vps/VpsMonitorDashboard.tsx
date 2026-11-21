"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { getApiErrorMessage } from "@/services/api";
import { getVpsMetrics } from "@/services/vps";
import { VpsMetrics } from "@/types";

interface TrendPoint {
  collectedAt: string;
  label: string;
  cpuPct: number;
  ramPct: number;
  swapPct: number;
}

type ContainerFilter = "all" | "running" | "stopped";
type ContainerSort = "mem" | "cpu" | "name";

const MAX_TREND_POINTS = 20;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[exponent]}`;
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}h`);
  if (hours > 0 || days > 0) parts.push(`${hours}j`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

function formatTimestamp(isoString: string): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getToneClasses(pct: number) {
  if (pct >= 85) {
    return {
      bar: "bg-editorial-danger",
      text: "text-editorial-danger",
      badge: "border-editorial-danger/35 bg-editorial-danger/10 text-editorial-danger",
    };
  }
  if (pct >= 65) {
    return {
      bar: "bg-editorial-accent",
      text: "text-editorial-accent-strong",
      badge: "border-editorial-accent/35 bg-editorial-accent/10 text-editorial-accent-strong",
    };
  }
  return {
    bar: "bg-editorial-technical",
    text: "text-editorial-technical",
    badge: "border-editorial-success/35 bg-editorial-success/10 text-editorial-success",
  };
}

function getHealthBadge(status: VpsMetrics["health"]["status"]) {
  if (status === "critical") {
    return {
      label: "CRITICAL",
      dotClass: "bg-editorial-danger",
      wrapClass: "border-editorial-danger/40 bg-editorial-danger/10 text-editorial-danger",
    };
  }
  if (status === "warning") {
    return {
      label: "WARNING",
      dotClass: "bg-editorial-accent",
      wrapClass: "border-editorial-accent/40 bg-editorial-accent/10 text-editorial-accent-strong",
    };
  }
  return {
    label: "HEALTHY",
    dotClass: "bg-editorial-success",
    wrapClass: "border-editorial-success/40 bg-editorial-success/10 text-editorial-success",
  };
}

function SessionTrendChart({ points }: { points: TrendPoint[] }) {
  const width = 480;
  const height = 160;
  const padX = 28;
  const padY = 16;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const buildPath = (extractor: (point: TrendPoint) => number) => {
    if (points.length === 0) return "";
    if (points.length === 1) {
      const y = padY + plotH - (Math.min(100, Math.max(0, extractor(points[0]))) / 100) * plotH;
      return `M ${padX} ${y.toFixed(1)} L ${padX + plotW} ${y.toFixed(1)}`;
    }
    return points
      .map((point, index) => {
        const x = padX + (index / (points.length - 1)) * plotW;
        const clamped = Math.min(100, Math.max(0, extractor(point)));
        const y = padY + plotH - (clamped / 100) * plotH;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const latest = points[points.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-mono text-editorial-ink">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--technical)" }} />
            CPU {latest ? `${latest.cpuPct.toFixed(1)}%` : "-"}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-editorial-ink">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
            RAM {latest ? `${latest.ramPct.toFixed(1)}%` : "-"}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-editorial-ink">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />
            Swap {latest ? `${latest.swapPct.toFixed(1)}%` : "-"}
          </span>
        </div>
        <span className="font-mono text-editorial-muted">{points.length}/{MAX_TREND_POINTS} sampel</span>
      </div>

      <div className="rounded-lg border border-editorial-line bg-editorial-paper-deep/60 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full overflow-visible" role="img" aria-label="Grafik tren penggunaan CPU, RAM, dan Swap">
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = padY + plotH - (tick / 100) * plotH;
            return (
              <g key={tick}>
                <line
                  x1={padX}
                  y1={y}
                  x2={padX + plotW}
                  y2={y}
                  stroke="var(--line)"
                  strokeDasharray={tick === 0 || tick === 100 ? undefined : "3 3"}
                  strokeWidth="1"
                />
                <text
                  x={padX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize="9"
                  fontFamily="var(--font-mono-editorial)"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {points.length > 0 && (
            <>
              <path d={buildPath((p) => p.swapPct)} fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={buildPath((p) => p.ramPct)} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
              <path d={buildPath((p) => p.cpuPct)} fill="none" stroke="var(--technical)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
        </svg>
        <div className="mt-1 flex items-center justify-between px-2 font-mono text-[11px] text-editorial-muted">
          <span>{points[0]?.label || "-"}</span>
          <span>{points.length > 1 ? `Terakhir ${latest?.label || "-"}` : "Menunggu sampel berikutnya"}</span>
        </div>
      </div>
    </div>
  );
}

export default function VpsMonitorDashboard() {
  const [refreshInterval, setRefreshInterval] = useState<number>(15000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<TrendPoint[]>([]);
  const [containerFilter, setContainerFilter] = useState<ContainerFilter>("all");
  const [containerSort, setContainerSort] = useState<ContainerSort>("mem");
  const [searchQuery, setSearchQuery] = useState("");

  const appendHistory = (metrics: VpsMetrics) => {
    setHistory((current) => {
      if (current.some((item) => item.collectedAt === metrics.collected_at)) {
        return current;
      }
      const nextPoint: TrendPoint = {
        collectedAt: metrics.collected_at,
        label: formatTimestamp(metrics.collected_at),
        cpuPct: metrics.cpu.usage_pct,
        ramPct: metrics.memory.used_pct,
        swapPct: metrics.swap.used_pct,
      };
      return [...current, nextPoint].slice(-MAX_TREND_POINTS);
    });
  };

  const { data, error, isLoading, mutate } = useSWR<VpsMetrics>(
    "/vps/metrics",
    () => getVpsMetrics(false),
    {
      refreshInterval,
      revalidateOnFocus: false,
      onSuccess: (metrics) => {
        appendHistory(metrics);
      },
    },
  );

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const freshMetrics = await getVpsMetrics(true);
      appendHistory(freshMetrics);
      await mutate(freshMetrics, { revalidate: false });
    } catch {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  };

  const resourceBars = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: `Disk (${data.disk.mount})`,
        detail: `${formatBytes(data.disk.used_bytes)} / ${formatBytes(data.disk.total_bytes)}`,
        pct: data.disk.used_pct,
      },
      {
        label: "RAM Fisik",
        detail: `${formatBytes(data.memory.used_bytes)} / ${formatBytes(data.memory.total_bytes)}`,
        pct: data.memory.used_pct,
      },
      {
        label: "Swap Memory",
        detail: data.swap.total_bytes > 0
          ? `${formatBytes(data.swap.used_bytes)} / ${formatBytes(data.swap.total_bytes)}`
          : "Swap tidak aktif",
        pct: data.swap.used_pct,
      },
      {
        label: "CPU Aktif",
        detail: `${data.cpu.cores} vCPU`,
        pct: data.cpu.usage_pct,
      },
      {
        label: "Load Avg 1m",
        detail: `${data.cpu.load_1m.toFixed(2)} / ${data.cpu.cores}.00`,
        pct: Math.min(100, data.cpu.load_1m_pct),
        rawPct: data.cpu.load_1m_pct,
      },
      {
        label: "Load Avg 5m",
        detail: `${data.cpu.load_5m.toFixed(2)} / ${data.cpu.cores}.00`,
        pct: Math.min(100, data.cpu.load_5m_pct),
        rawPct: data.cpu.load_5m_pct,
      },
      {
        label: "Load Avg 15m",
        detail: `${data.cpu.load_15m.toFixed(2)} / ${data.cpu.cores}.00`,
        pct: Math.min(100, data.cpu.load_15m_pct),
        rawPct: data.cpu.load_15m_pct,
      },
    ];
  }, [data]);

  const filteredContainers = useMemo(() => {
    const items = data?.docker.containers || [];
    const query = searchQuery.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const isRunning = item.state === "running";
      if (containerFilter === "running" && !isRunning) return false;
      if (containerFilter === "stopped" && isRunning) return false;
      if (!query) return true;
      return item.name.toLowerCase().includes(query) || item.image.toLowerCase().includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (containerSort === "cpu") return b.cpu_pct - a.cpu_pct || b.mem_used_bytes - a.mem_used_bytes;
      if (containerSort === "name") return a.name.localeCompare(b.name);
      return (a.state === "running" ? 0 : 1) - (b.state === "running" ? 0 : 1) || b.mem_used_bytes - a.mem_used_bytes;
    });
  }, [data?.docker.containers, containerFilter, containerSort, searchQuery]);

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl border border-editorial-line bg-editorial-surface" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-32 animate-pulse rounded-xl border border-editorial-line bg-editorial-surface" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl border border-editorial-line bg-editorial-surface" />
      </div>
    );
  }

  if (error && !data) {
    const errorMsg = getApiErrorMessage(error, "Tidak dapat mengambil metrik VPS dari agent.");
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-xl border border-editorial-danger/40 bg-editorial-surface p-6 shadow-[var(--shadow-editorial)]">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-danger">
            VPS MONITOR // AGENT OFFLINE
          </p>
          <h1 className="mt-1 text-2xl font-bold text-editorial-ink">Monitoring VPS Belum Terhubung</h1>
          <p className="mt-2 text-sm leading-relaxed text-editorial-muted">{errorMsg}</p>

          <div className="mt-5 rounded-lg border border-editorial-line bg-editorial-paper-deep p-4 text-xs leading-6 text-editorial-ink">
            <p className="font-semibold text-editorial-technical">Langkah Aktivasi Agent Read-Only di VPS:</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-editorial-muted">
              <li>
                Pasang service <code className="rounded bg-editorial-surface px-1.5 py-0.5 font-mono text-editorial-ink">deploy/vps-monitor/vps-monitor.service</code> dengan token acak di <code className="rounded bg-editorial-surface px-1.5 py-0.5 font-mono text-editorial-ink">/etc/vps-monitor.env</code>.
              </li>
              <li>
                Tambahkan <code className="rounded bg-editorial-surface px-1.5 py-0.5 font-mono text-editorial-ink">VPS_MONITOR_URL=http://host.docker.internal:9109/metrics</code> dan <code className="rounded bg-editorial-surface px-1.5 py-0.5 font-mono text-editorial-ink">VPS_MONITOR_TOKEN=...</code> ke file <code className="rounded bg-editorial-surface px-1.5 py-0.5 font-mono text-editorial-ink">.env</code> server.
              </li>
              <li>
                Rebuild container backend dengan <code className="rounded bg-editorial-surface px-1.5 py-0.5 font-mono text-editorial-ink">docker compose up --build -d backend</code>.
              </li>
            </ol>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="min-h-11 rounded-lg bg-editorial-action px-5 py-2 text-sm font-semibold text-editorial-on-action transition hover:bg-editorial-action-hover disabled:opacity-50"
            >
              {isRefreshing ? "Menghubungkan..." : "Coba Lagi"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const healthBadge = getHealthBadge(data.health.status);
  const cpuTone = getToneClasses(data.cpu.usage_pct);
  const memTone = getToneClasses(data.memory.used_pct);
  const swapTone = getToneClasses(data.swap.used_pct);
  const diskTone = getToneClasses(data.disk.used_pct);

  return (
    <div className="space-y-6">
      {/* Header Telemetry Bar */}
      <section className="rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-technical">
                VPS TELEMETRY // READ-ONLY AGENT
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${healthBadge.wrapClass}`}>
                <span className={`h-2 w-2 rounded-full ${healthBadge.dotClass}`} />
                {healthBadge.label}
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold text-editorial-ink sm:text-3xl">
              {data.host.hostname}
            </h1>
            <p className="mt-1 font-mono text-xs text-editorial-muted">
              {data.host.os} · Kernel {data.host.kernel} ({data.host.architecture}) · Uptime {formatUptime(data.host.uptime_seconds)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-editorial-line bg-editorial-paper-deep px-3 py-2 text-xs text-editorial-muted">
              <span>Auto-refresh</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                aria-label="Interval auto-refresh metrik VPS"
                className="bg-transparent font-mono font-semibold text-editorial-ink focus:outline-none"
              >
                <option value={0}>Mati</option>
                <option value={15000}>15 detik</option>
                <option value={30000}>30 detik</option>
                <option value={60000}>60 detik</option>
              </select>
            </label>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="min-h-10 rounded-lg bg-editorial-action px-4 py-2 text-sm font-semibold text-editorial-on-action transition hover:bg-editorial-action-hover disabled:opacity-50"
            >
              {isRefreshing ? "Memuat..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-editorial-line pt-3 font-mono text-xs text-editorial-muted">
          <span>CPU: {data.host.cpu_model} ({data.host.cpu_cores} vCPU)</span>
          <span>Terakhir diperbarui: {formatTimestamp(data.collected_at)}</span>
        </div>
      </section>

      {/* Active Health Alerts */}
      {data.health.alerts.length > 0 && (
        <section className="rounded-xl border border-editorial-accent/40 bg-editorial-accent/10 p-4 text-sm text-editorial-ink" role="status">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-editorial-accent-strong">
            Peringatan Sistem ({data.health.alerts.length})
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs leading-relaxed text-editorial-ink">
            {data.health.alerts.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 4 KPI Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-muted">CPU &amp; Load</span>
            <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${cpuTone.badge}`}>
              {data.cpu.usage_pct.toFixed(1)}%
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-editorial-ink">
            {data.cpu.load_1m.toFixed(2)}{" "}
            <span className="text-sm font-normal text-editorial-muted">/ {data.cpu.cores}.00</span>
          </p>
          <p className="mt-1 font-mono text-xs text-editorial-muted">
            5m: {data.cpu.load_5m.toFixed(2)} · 15m: {data.cpu.load_15m.toFixed(2)}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-editorial-paper-deep">
            <div className={`h-full rounded-full transition-all duration-500 ${cpuTone.bar}`} style={{ width: `${Math.min(100, data.cpu.usage_pct)}%` }} />
          </div>
        </article>

        <article className="rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-muted">RAM Fisik</span>
            <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${memTone.badge}`}>
              {data.memory.used_pct.toFixed(1)}%
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-editorial-ink">
            {formatBytes(data.memory.used_bytes)}{" "}
            <span className="text-sm font-normal text-editorial-muted">/ {formatBytes(data.memory.total_bytes)}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-editorial-muted">
            Tersedia: {formatBytes(data.memory.available_bytes)} · Cache: {formatBytes(data.memory.cached_bytes)}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-editorial-paper-deep">
            <div className={`h-full rounded-full transition-all duration-500 ${memTone.bar}`} style={{ width: `${Math.min(100, data.memory.used_pct)}%` }} />
          </div>
        </article>

        <article className="rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-muted">Swap Memory</span>
            <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${swapTone.badge}`}>
              {data.swap.used_pct.toFixed(1)}%
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-editorial-ink">
            {formatBytes(data.swap.used_bytes)}{" "}
            <span className="text-sm font-normal text-editorial-muted">/ {formatBytes(data.swap.total_bytes)}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-editorial-muted">
            Sisa: {formatBytes(data.swap.free_bytes)} · {data.swap.devices.length} file swap
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-editorial-paper-deep">
            <div className={`h-full rounded-full transition-all duration-500 ${swapTone.bar}`} style={{ width: `${Math.min(100, data.swap.used_pct)}%` }} />
          </div>
        </article>

        <article className="rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-muted">Disk ({data.disk.mount})</span>
            <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${diskTone.badge}`}>
              {data.disk.used_pct.toFixed(1)}%
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-editorial-ink">
            {formatBytes(data.disk.used_bytes)}{" "}
            <span className="text-sm font-normal text-editorial-muted">/ {formatBytes(data.disk.total_bytes)}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-editorial-muted">
            Sisa ruang kosong: {formatBytes(data.disk.free_bytes)}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-editorial-paper-deep">
            <div className={`h-full rounded-full transition-all duration-500 ${diskTone.bar}`} style={{ width: `${Math.min(100, data.disk.used_pct)}%` }} />
          </div>
        </article>
      </section>

      {/* Bar Chart & Live Session Trend Matrix */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-technical">RESOURCE BAR MATRIX</p>
              <h2 className="text-lg font-bold text-editorial-ink">Grafik Utilitas Sistem</h2>
            </div>
            <span className="font-mono text-xs text-editorial-muted">0% – 100%</span>
          </div>

          <div className="space-y-3.5">
            {resourceBars.map((item) => {
              const tone = getToneClasses(item.rawPct ?? item.pct);
              const displayPct = item.rawPct ?? item.pct;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-editorial-ink">{item.label}</span>
                    <span className="font-mono text-editorial-muted">
                      {item.detail} · <strong className={tone.text}>{displayPct.toFixed(1)}%</strong>
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-editorial-paper-deep">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
                      style={{ width: `${Math.max(2, Math.min(100, item.pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)] sm:p-6">
          <div>
            <div className="mb-3">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-technical">LIVE SESSION TELEMETRY</p>
              <h2 className="text-lg font-bold text-editorial-ink">Tren Sesi CPU, RAM &amp; Swap</h2>
            </div>
            <SessionTrendChart points={history} />
          </div>

          {/* Swap Devices Breakdown */}
          <div>
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-editorial-muted">
              Perangkat Swap Aktif
            </h3>
            {data.swap.devices.length === 0 ? (
              <p className="text-xs text-editorial-muted">Tidak ada perangkat swap aktif.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-editorial-line">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-editorial-paper-deep text-editorial-muted">
                    <tr>
                      <th className="px-3 py-2">Path</th>
                      <th className="px-3 py-2">Ukuran</th>
                      <th className="px-3 py-2">Terpakai</th>
                      <th className="px-3 py-2 text-right">Prio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.swap.devices.map((dev) => (
                      <tr key={dev.name} className="border-t border-editorial-line text-editorial-ink">
                        <td className="px-3 py-2">{dev.name}</td>
                        <td className="px-3 py-2">{formatBytes(dev.size_bytes)}</td>
                        <td className="px-3 py-2">{formatBytes(dev.used_bytes)}</td>
                        <td className="px-3 py-2 text-right">{dev.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Docker Container Matrix */}
      <section className="rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)] sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-technical">
              DOCKER RUNTIME MATRIX
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-editorial-ink">Daftar &amp; Konsumsi Container</h2>
              <span className="rounded-full border border-editorial-success/30 bg-editorial-success/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-editorial-success">
                {data.docker.running_count} Running
              </span>
              {data.docker.stopped_count > 0 && (
                <span className="rounded-full border border-editorial-line-strong bg-editorial-paper-deep px-2.5 py-0.5 font-mono text-xs font-semibold text-editorial-muted">
                  {data.docker.stopped_count} Stopped
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari container atau image..."
              aria-label="Cari container Docker"
              className="rounded-lg border border-editorial-line-strong bg-editorial-surface px-3 py-1.5 text-sm text-editorial-ink focus:border-editorial-technical focus:outline-none"
            />

            <div className="inline-flex rounded-lg border border-editorial-line bg-editorial-paper-deep p-0.5 text-xs">
              {([
                ["all", `Semua (${data.docker.total_count})`],
                ["running", `Running (${data.docker.running_count})`],
                ["stopped", `Stopped (${data.docker.stopped_count})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setContainerFilter(key)}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${
                    containerFilter === key
                      ? "bg-editorial-action text-editorial-on-action"
                      : "text-editorial-muted hover:text-editorial-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={containerSort}
              onChange={(e) => setContainerSort(e.target.value as ContainerSort)}
              aria-label="Urutkan container"
              className="rounded-lg border border-editorial-line-strong bg-editorial-surface px-3 py-1.5 text-xs font-semibold text-editorial-ink focus:border-editorial-technical focus:outline-none"
            >
              <option value="mem">Urutkan: RAM Terbesar</option>
              <option value="cpu">Urutkan: CPU Terbesar</option>
              <option value="name">Urutkan: Nama A–Z</option>
            </select>
          </div>
        </div>

        {!data.docker.available ? (
          <p className="text-sm text-editorial-muted">Data Docker tidak tersedia dari agent.</p>
        ) : filteredContainers.length === 0 ? (
          <p className="text-sm text-editorial-muted">Tidak ada container yang cocok dengan filter saat ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-editorial-ink">
              <thead className="bg-editorial-paper-deep font-mono text-xs uppercase text-editorial-muted">
                <tr>
                  <th className="px-4 py-3">Container &amp; Image</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">CPU %</th>
                  <th className="px-4 py-3">Memori</th>
                  <th className="px-4 py-3">Net / Block I/O</th>
                  <th className="px-4 py-3 text-right">PIDs</th>
                </tr>
              </thead>
              <tbody>
                {filteredContainers.map((container) => {
                  const isRunning = container.state === "running";
                  const memPctClamped = Math.min(100, Math.max(0, container.mem_pct * 4));
                  const cpuPctClamped = Math.min(100, Math.max(0, container.cpu_pct));
                  return (
                    <tr key={container.id || container.name} className="border-b border-editorial-line transition hover:bg-editorial-paper-deep/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-editorial-ink">{container.name}</div>
                        <div className="max-w-xs truncate font-mono text-xs text-editorial-muted" title={container.image}>
                          {container.image}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs font-semibold ${
                            isRunning
                              ? "border-editorial-success/35 bg-editorial-success/10 text-editorial-success"
                              : "border-editorial-line-strong bg-editorial-paper-deep text-editorial-muted"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? "bg-editorial-success" : "bg-editorial-muted"}`} />
                          {container.state}
                        </span>
                        <div className="mt-1 font-mono text-[11px] text-editorial-muted">{container.status}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <div>{container.cpu_pct.toFixed(2)}%</div>
                        <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-editorial-paper-deep">
                          <div className="h-full rounded-full bg-editorial-technical" style={{ width: `${cpuPctClamped}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <div className="font-semibold text-editorial-ink">
                          {container.mem_used_bytes > 0 ? formatBytes(container.mem_used_bytes) : "0 B"}{" "}
                          <span className="font-normal text-editorial-muted">({container.mem_pct.toFixed(2)}%)</span>
                        </div>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-editorial-paper-deep">
                          <div className="h-full rounded-full bg-editorial-accent" style={{ width: `${memPctClamped}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-editorial-muted">
                        <div>Net: {container.net_io}</div>
                        <div>Disk: {container.block_io}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-editorial-muted">
                        {container.pids}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Docker Disk Usage & Top Host Processes */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)] sm:p-6">
          <div className="mb-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-technical">DOCKER STORAGE SUMMARY</p>
            <h2 className="text-lg font-bold text-editorial-ink">Pemakaian Disk Docker</h2>
          </div>
          {data.docker.disk_usage.length === 0 ? (
            <p className="text-sm text-editorial-muted">Ringkasan disk Docker belum tersedia.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-editorial-ink">
                <thead className="bg-editorial-paper-deep uppercase text-editorial-muted">
                  <tr>
                    <th className="px-3 py-2.5">Tipe</th>
                    <th className="px-3 py-2.5">Total / Aktif</th>
                    <th className="px-3 py-2.5">Ukuran</th>
                    <th className="px-3 py-2.5 text-right">Reclaimable</th>
                  </tr>
                </thead>
                <tbody>
                  {data.docker.disk_usage.map((item) => (
                    <tr key={item.type} className="border-b border-editorial-line">
                      <td className="px-3 py-2.5 font-semibold">{item.type}</td>
                      <td className="px-3 py-2.5 text-editorial-muted">{item.total_count} / {item.active}</td>
                      <td className="px-3 py-2.5">{item.size}</td>
                      <td className="px-3 py-2.5 text-right text-editorial-technical">{item.reclaimable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-editorial-line bg-editorial-surface p-5 shadow-[var(--shadow-editorial)] sm:p-6">
          <div className="mb-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-editorial-technical">HOST PROCESSES // TOP 8</p>
            <h2 className="text-lg font-bold text-editorial-ink">Proses Memori Terbesar di Host</h2>
          </div>
          {data.top_processes.length === 0 ? (
            <p className="text-sm text-editorial-muted">Daftar proses tidak tersedia.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-editorial-ink">
                <thead className="bg-editorial-paper-deep uppercase text-editorial-muted">
                  <tr>
                    <th className="px-3 py-2.5">PID</th>
                    <th className="px-3 py-2.5">Proses</th>
                    <th className="px-3 py-2.5 text-right">CPU %</th>
                    <th className="px-3 py-2.5">RAM %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_processes.map((proc) => (
                    <tr key={`${proc.pid}-${proc.command}`} className="border-b border-editorial-line">
                      <td className="px-3 py-2.5 text-editorial-muted">{proc.pid}</td>
                      <td className="px-3 py-2.5 font-semibold">{proc.command}</td>
                      <td className="px-3 py-2.5 text-right text-editorial-muted">{proc.cpu_pct.toFixed(1)}%</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-editorial-paper-deep">
                            <div
                              className="h-full rounded-full bg-editorial-technical"
                              style={{ width: `${Math.min(100, proc.mem_pct * 8)}%` }}
                            />
                          </div>
                          <span>{proc.mem_pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
