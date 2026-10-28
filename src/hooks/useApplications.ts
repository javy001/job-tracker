import { useQuery } from '@tanstack/react-query';
import type { JobApplication } from '../types';

// 2. Strongly type the fetcher function to return an array of JobApplications
const fetchApplications = async (): Promise<JobApplication[]> => {
  const res = await fetch('/api/applications');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

// 3. Pass the type to useQuery
export const useApplications = () => {
  return useQuery<JobApplication[], Error>({
    queryKey: ['applications'],
    queryFn: fetchApplications,
  });
};
