import { Card } from './Card';
import { useApplications } from '../hooks/useApplications';

export function MetricCards() {
  const { data } = useApplications();
  const companies = new Set(data?.map((d) => d.name));

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <Card>
        <div style={{ fontSize: '12px', marginBottom: '10px' }}>Applications</div>
        <div style={{ fontSize: '36px' }}>{data?.length}</div>
      </Card>
      <Card>
        <div style={{ fontSize: '12px', marginBottom: '10px' }}>Companies </div>
        <div style={{ fontSize: '36px' }}>{companies?.size}</div>
      </Card>
    </div>
  );
}
