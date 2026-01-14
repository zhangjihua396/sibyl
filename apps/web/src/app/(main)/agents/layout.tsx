import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '智能代理',
  description: 'Manage and monitor AI agents working on your tasks',
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
