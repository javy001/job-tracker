import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { JobApplication } from '../types';

// 2. Strongly type the fetcher function to return an array of JobApplications
export const fetchApplications = async (): Promise<JobApplication[]> => {
  const res = await fetch('/api/applications');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

// Page-wide company search. Every consumer of useApplications gets results
// filtered by this term.
export const CompanySearchContext = React.createContext('');

// 3. Pass the type to useQuery
export const useApplications = () => {
  const search = React.useContext(CompanySearchContext).trim().toLowerCase();
  const select = React.useCallback(
    (apps: JobApplication[]) =>
      search ? apps.filter((a) => (a.name ?? '').toLowerCase().includes(search)) : apps,
    [search],
  );
  return useQuery<JobApplication[], Error>({
    queryKey: ['applications'],
    queryFn: fetchApplications,
    select,
  });
};
