import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '任务',
  description: 'Manage your tasks with kanban boards and status tracking',
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
