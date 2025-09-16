'use client';

import dynamic from 'next/dynamic';
import { NotificationProvider } from '../workflow-builder/components/notification-dialog';

// Dynamically import with no SSR to avoid build errors
const WorkflowBuilder = dynamic(
  () => import('../workflow-builder/app/page').catch(() => {
    return { default: () => <div>Error loading workflow builder. Please check import paths.</div> };
  }),
  { 
    ssr: false,
    loading: () => <div>Loading workflow builder...</div>
  }
);

export default function WorkflowWrapper() {
  return (
    <div id="workflow-builder-container">
      <NotificationProvider>
        <WorkflowBuilder />
      </NotificationProvider>
    </div>
  );
}