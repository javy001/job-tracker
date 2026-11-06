import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import { CompanySearchContext } from './hooks/useApplications';
import { AddApplicationModal } from './components/AddApplicationModal';
import { JobsTable } from './components/JobsTable';
// import { SalaryRangeChart } from './components/SalaryRangeChart';
import { MetricCards } from './components/MetricCards';
import { metricFilters, type MetricFilter } from './metricFilters';
import { PipelineTimeline } from './components/PipelineTimeline';
import { WeekCalendar } from './components/WeekCalendar';
import { PendingFollowUps } from './components/PendingFollowUps';
import { Flashcards } from './components/Flashcards';

function App() {
  const [showModal, setShowModal] = React.useState(false);
  const [showFlashcards, setShowFlashcards] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [metricFilter, setMetricFilter] = React.useState<MetricFilter | null>(null);

  return (
    <CompanySearchContext.Provider value={search}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          padding: '8px 0',
          background: '#fff',
        }}
      >
        <Button size="small" variant="outlined" onClick={() => setShowModal(true)}>
          Add Application
        </Button>
        <Button size="small" variant="outlined" onClick={() => setShowFlashcards(true)}>
          Study Flashcards
        </Button>
        <TextField
          size="small"
          placeholder="Search by company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <WeekCalendar />
      </div>
      <div style={{ marginTop: '10px' }}>
        <PendingFollowUps />
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
        <PipelineTimeline />
        <MetricCards filter={metricFilter} onFilterChange={setMetricFilter} />
        <JobsTable filter={metricFilter ? metricFilters[metricFilter] : undefined} />
        {/* <SalaryRangeChart /> */}
      </div>
    </CompanySearchContext.Provider>
  );
}

export default App;
