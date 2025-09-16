
"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface NotificationData {
  id: string
  title: string
  description?: string
  type: "success" | "error" | "warning" | "info"
  autoClose?: boolean
  duration?: number
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null)

  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newNotification = { ...notification, id }
    
    // If there's already a notification showing, queue this one
    if (currentNotification) {
      setNotifications(prev => [...prev, newNotification])
    } else {
      setCurrentNotification(newNotification)
      
      // Auto close if specified
      if (notification.autoClose !== false) {
        const duration = notification.duration || 2000
        setTimeout(() => {
          setCurrentNotification(null)
          
          // Show next notification if any are queued
          setTimeout(() => {
            setNotifications(prev => {
              if (prev.length > 0) {
                const [next, ...rest] = prev
                setCurrentNotification(next)
                
                // Auto close the next notification
                if (next.autoClose !== false) {
                  const nextDuration = next.duration || 2000
                  setTimeout(() => {
                    setCurrentNotification(null)
                  }, nextDuration)
                }
                
                return rest
              }
              return prev
            })
          }, 100)
        }, duration)
      }
    }
  }

  const handleClose = () => {
    setCurrentNotification(null)
    
    // Show next notification if any are queued
    setTimeout(() => {
      setNotifications(prev => {
        if (prev.length > 0) {
          const [next, ...rest] = prev
          setCurrentNotification(next)
          
          // Auto close the next notification
          if (next.autoClose !== false) {
            const duration = next.duration || 2000
            setTimeout(() => {
              setCurrentNotification(null)
            }, duration)
          }
          
          return rest
        }
        return prev
      })
    }, 100)
  }

  const getIcon = (type: NotificationData['type']) => {
    const iconProps = { className: "w-6 h-6" }
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-6 h-6 text-green-500" />
      case 'error':
        return <XCircle {...iconProps} className="w-6 h-6 text-red-500" />
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-6 h-6 text-yellow-500" />
      case 'info':
        return <Info {...iconProps} className="w-6 h-6 text-blue-500" />
    }
  }

  const getColors = (type: NotificationData['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
    }
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      <Dialog open={!!currentNotification} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className={`sm:max-w-md ${currentNotification ? getColors(currentNotification.type) : ''}`}>
          {currentNotification && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {getIcon(currentNotification.type)}
                  {currentNotification.title}
                </DialogTitle>
                {currentNotification.description && (
                  <DialogDescription className="text-base">
                    {currentNotification.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="flex justify-end pt-4">
                <Button onClick={handleClose} variant="outline">
                  OK
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
