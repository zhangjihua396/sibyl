import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Graph',
  description: 'Explore and visualize your knowledge graph',
};

export default function GraphLayout({ children }: { children: React.ReactNode }) {
  return children;
}
