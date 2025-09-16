
"use client"

import { useNotification } from '@/components/shared/notification-dialog'

export function useToast() {
  const { showNotification } = useNotification()

  const toast = (params: {
    title?: string
    description?: string
    variant?: "default" | "destructive" | "success" | "warning"
  }) => {
    const type = params.variant === "destructive" ? "error" : 
                params.variant === "success" ? "success" : 
                params.variant === "warning" ? "warning" : "info"

    showNotification({
      title: params.title || 'Notification',
      description: params.description,
      type,
      autoClose: true,
      duration: 4000
    })
  }

  // Legacy compatibility
  const addToast = toast

  return {
    toast,
    addToast,
    removeToast: () => {}, // Not needed for dialogs
    ToastContainer: () => null // Not needed for dialogs
  }
}
