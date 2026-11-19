import React from 'react';
import { BookOpen, BriefcaseBusiness, Moon, Plus, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/lib/theme';
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
import { CompanySearch } from './components/CompanySearch';

function App() {
  const [showModal, setShowModal] = React.useState(false);
  const [showFlashcards, setShowFlashcards] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [metricFilter, setMetricFilter] = React.useState<MetricFilter | null>(null);
  const { theme, toggleTheme } = useTheme();

  return (
    <CompanySearchContext.Provider value={search}>
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-2 px-4">
          <div className="flex items-center gap-2 pr-2 font-semibold">
            <span className="inline-flex size-5 items-center justify-center rounded-[5px] bg-primary text-primary-foreground">
              <BriefcaseBusiness className="size-3" />
            </span>
            <span className="hidden sm:inline">Job Tracker</span>
          </div>
          <CompanySearch value={search} onChange={setSearch} />
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" onClick={() => setShowFlashcards(true)}>
              <BookOpen />
              <span className="hidden sm:inline">Study flashcards</span>
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus />
              <span className="hidden sm:inline">Add application</span>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun /> : <Moon />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4">
        <WeekCalendar />
        <PendingFollowUps />
        <PipelineTimeline />
        <MetricCards filter={metricFilter} onFilterChange={setMetricFilter} />
        <JobsTable filter={metricFilter ? metricFilters[metricFilter] : undefined} />
        {/* <SalaryRangeChart /> */}
      </main>
      <AddApplicationModal open={showModal} onClose={() => setShowModal(false)} />
      <Dialog open={showFlashcards} onOpenChange={setShowFlashcards}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-6xl"
        >
          <DialogTitle className="sr-only">Study flashcards</DialogTitle>
          <Flashcards onClose={() => setShowFlashcards(false)} />
        </DialogContent>
      </Dialog>
    </CompanySearchContext.Provider>
  );
}

export default App;
