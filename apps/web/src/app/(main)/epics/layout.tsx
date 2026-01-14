import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '史诗',
  description: 'Organize work with epics and track progress',
};

export default function EpicsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
