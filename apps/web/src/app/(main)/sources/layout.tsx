import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '数据源',
  description: 'Manage knowledge sources and document crawling',
};

export default function SourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
