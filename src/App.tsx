import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { AddApplicationModal } from './components/AddApplicationModal';
import { JobsTable } from './components/JobsTable';
// import { SalaryRangeChart } from './components/SalaryRangeChart';
import { MetricCards } from './components/MetricCards';
import { PipelineTimeline } from './components/PipelineTimeline';
import { WeekCalendar } from './components/WeekCalendar';
import { PendingFollowUps } from './components/PendingFollowUps';
import { Flashcards } from './components/Flashcards';

function App() {
  const [showModal, setShowModal] = React.useState(false);
  const [showFlashcards, setShowFlashcards] = React.useState(false);

  return (
    <>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button size="small" variant="outlined" onClick={() => setShowModal(true)}>
          Add Application
        </Button>
        <Button size="small" variant="outlined" onClick={() => setShowFlashcards(true)}>
          Study Flashcards
        </Button>
      </div>
      <div style={{ marginTop: '10px' }}>
        <WeekCalendar />
      </div>
      <div style={{ marginTop: '10px' }}>
        <PendingFollowUps />
      </div>
      <div style={{ marginTop: '10px' }}>
        <MetricCards />
      </div>
      <AddApplicationModal open={showModal} onClose={() => setShowModal(false)} />
      <Dialog
        open={showFlashcards}
        onClose={() => setShowFlashcards(false)}
        maxWidth="lg"
        fullWidth
      >
        <Flashcards onClose={() => setShowFlashcards(false)} />
      </Dialog>
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
