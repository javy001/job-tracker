import React from 'react';

interface Props {
  children: React.ReactNode;
}

export function Card({ children }: Props) {
  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'white',
      }}
    >
      {children}
    </div>
  );
}
