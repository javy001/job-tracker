import { useApplications } from '../hooks/useApplications';

interface MetricCardProps {
  label: string;
  value: number;
  detail?: string;
}

function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-value">{value}</div>
      {detail && <div className="metric-card-detail">{detail}</div>}
    </div>
  );
}

// e.g. "38% of 29 applications"
const responseRate = (responses: number, total: number) =>
  total > 0
    ? `${Math.round((responses / total) * 100)}% of ${total} applications`
    : undefined;

export function MetricCards() {
  const { data = [] } = useApplications();
  const companies = new Set(data.map((d) => d.name));
  // An application counts as a response once it has any event
  const responses = data.filter((d) => d.events.length > 0);
  const inbound = data.filter((d) => d.source === 'inbound');
  const outbound = data.filter((d) => d.source === 'outbound');
  const inboundResponses = inbound.filter((d) => d.events.length > 0);
  const outboundResponses = outbound.filter((d) => d.events.length > 0);

  return (
    <div className="metric-cards">
      <MetricCard label="Applications" value={data.length} />
      <MetricCard label="Companies" value={companies.size} />
      <MetricCard
        label="Responses"
        value={responses.length}
        detail={responseRate(responses.length, data.length)}
      />
      <MetricCard
        label="Inbound Responses"
        value={inboundResponses.length}
        detail={responseRate(inboundResponses.length, inbound.length)}
      />
      <MetricCard
        label="Outbound Responses"
        value={outboundResponses.length}
        detail={responseRate(outboundResponses.length, outbound.length)}
      />
    </div>
  );
}
