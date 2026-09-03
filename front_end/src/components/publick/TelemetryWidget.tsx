"use client";

import { useEffect, useState } from "react";

import { useSiteContent } from "./SiteContentProvider";

export default function TelemetryWidget() {
  const content = useSiteContent().home.telemetry;
  const [ping, setPing] = useState(16);
  const [packetsCount, setPacketsCount] = useState(1042);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      // Simulate live telemetry jittering latency
      setPing(Math.floor(14 + Math.random() * 9));
      setPacketsCount((prev) => prev + Math.floor(1 + Math.random() * 3));
    }, 1800);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="telemetry-widget" aria-label="System & IoT Telemetry Live Status">
      <div className="telemetry-widget__header">
        <div className="telemetry-widget__title-wrap">
          <span className="telemetry-pulse-dot" data-active={isLive} aria-hidden="true" />
          <span className="telemetry-widget__title">{content.title}</span>
        </div>
        <button
          type="button"
          className="telemetry-toggle-btn"
          onClick={() => setIsLive((prev) => !prev)}
          title={isLive ? "Jeda simulasi telemetri" : "Lanjutkan telemetri"}
        >
          {isLive ? content.pause_label : content.live_label}
        </button>
      </div>

      <div className="telemetry-widget__grid">
        <div className="telemetry-item">
          <span className="telemetry-item__label">{content.node_status_label}</span>
          <strong className="telemetry-item__val telemetry-item__val--success">
            {content.node_status_value}
          </strong>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-item__label">{content.latency_label}</span>
          <strong className="telemetry-item__val">{ping} ms</strong>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-item__label">{content.protocol_label}</span>
          <strong className="telemetry-item__val">{content.protocol_value}</strong>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-item__label">{content.packets_label}</span>
          <strong className="telemetry-item__val">{packetsCount.toLocaleString()}</strong>
        </div>
      </div>

      <div className="telemetry-widget__footer">
        <span className="telemetry-meta" title="ESP32-S3 IoT Hardware, FastAPI backend node, PostgreSQL database telemetry stream">
          {content.nodes_value}
        </span>
        <div className="telemetry-signal-bars" aria-hidden="true" title={isLive ? "Sinyal Telemetri Aktif" : "Sinyal Dijeda"}>
          <span className="telemetry-signal-bar" style={{ height: isLive ? 4 : 2 }} />
          <span className="telemetry-signal-bar" style={{ height: isLive ? 8 : 2 }} />
          <span className="telemetry-signal-bar" style={{ height: isLive ? 12 : 2 }} />
          <span className="telemetry-signal-bar" style={{ height: isLive ? 9 : 2 }} />
        </div>
      </div>
    </div>
  );
}
