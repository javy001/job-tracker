import React from 'react';
import Button from '@mui/material/Button';
import { AddApplicationModal } from './components/AddApplicationModal';
import { JobsTable } from './components/JobsTable';
// import { SalaryRangeChart } from './components/SalaryRangeChart';
import { MetricCards } from './components/MetricCards';
import { PipelineTimeline } from './components/PipelineTimeline';
import { WeekCalendar } from './components/WeekCalendar';

function App() {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <div>
        <Button size="small" variant="outlined" onClick={() => setShowModal(true)}>
          Add Application
        </Button>
      </div>
      <div style={{ marginTop: '10px' }}>
        <WeekCalendar />
      </div>
      <div style={{ marginTop: '10px' }}>
        <MetricCards />
      </div>
      <AddApplicationModal open={showModal} onClose={() => setShowModal(false)} />
      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <JobsTable />
        <PipelineTimeline />
        {/* <SalaryRangeChart /> */}
      </div>
    </>
  );
}

export default App;
