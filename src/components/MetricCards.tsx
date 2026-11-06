import { useApplications } from '../hooks/useApplications';
import { metricFilters, type MetricFilter } from '../metricFilters';

interface MetricCardProps {
  label: string;
  value: number;
  detail?: string;
  selected?: boolean;
  onClick?: () => void;
}

function MetricCard({ label, value, detail, selected, onClick }: MetricCardProps) {
  const content = (
    <>
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-value">{value}</div>
      {detail && <div className="metric-card-detail">{detail}</div>}
    </>
  );
  if (!onClick) return <div className="metric-card">{content}</div>;
  return (
    <button
      type="button"
      className={`metric-card metric-card-clickable${selected ? ' selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

// e.g. "38% of 29 applications"
const responseRate = (responses: number, total: number) =>
  total > 0
    ? `${Math.round((responses / total) * 100)}% of ${total} applications`
    : undefined;

interface MetricCardsProps {
  filter: MetricFilter | null;
  onFilterChange: (filter: MetricFilter | null) => void;
}

export function MetricCards({ filter, onFilterChange }: MetricCardsProps) {
  const { data = [] } = useApplications();
  const companies = new Set(data.map((d) => d.name));
  const inbound = data.filter((d) => d.source === 'inbound');
  const outbound = data.filter((d) => d.source === 'outbound');
  const count = (f: MetricFilter) => data.filter(metricFilters[f]).length;

  // Clicking the active card again clears the filter
  const toggle = (f: MetricFilter) => () => onFilterChange(filter === f ? null : f);

  return (
    <div className="metric-cards">
      <MetricCard
        label="Applications"
        value={data.length}
        selected={filter === null}
        onClick={() => onFilterChange(null)}
      />
      <MetricCard label="Companies" value={companies.size} />
      <MetricCard
        label="Responses"
        value={count('responses')}
        detail={responseRate(count('responses'), data.length)}
        selected={filter === 'responses'}
        onClick={toggle('responses')}
      />
      <MetricCard
        label="Inbound Responses"
        value={count('inboundResponses')}
        detail={responseRate(count('inboundResponses'), inbound.length)}
        selected={filter === 'inboundResponses'}
        onClick={toggle('inboundResponses')}
      />
      <MetricCard
        label="Outbound Responses"
        value={count('outboundResponses')}
        detail={responseRate(count('outboundResponses'), outbound.length)}
        selected={filter === 'outboundResponses'}
        onClick={toggle('outboundResponses')}
      />
      <MetricCard
        label="Rejected"
        value={count('rejected')}
        detail={responseRate(count('rejected'), data.length)}
        selected={filter === 'rejected'}
        onClick={toggle('rejected')}
      />
    </div>
  );
}
