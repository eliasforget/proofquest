import { metrics as demoMetrics } from "@/data/mock-profile";
import { metricLabel, type Locale } from "@/lib/i18n";

export function MetricList({ metrics = demoMetrics, locale = "fr" }: { metrics?: Array<readonly [string, number]>; locale?: Locale }) {
  return (
    <div className="metric-list">
      {metrics.map(([label, value]) => (
        <div className="metric" key={label}>
          <div className="metric-head"><span>{metricLabel(label, locale)}</span><span>{value}</span></div>
          <div className="metric-track"><span style={{ width: `${value}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
