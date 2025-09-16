"use client"

import React from 'react'
import { AuthGuard } from '@/components/shared/auth-guard'
import WorkflowWrapper from '../workflow-wrapper/page'

export default function App() {
  return (
    <AuthGuard>
      <WorkflowWrapper />
    </AuthGuard>
  )
}