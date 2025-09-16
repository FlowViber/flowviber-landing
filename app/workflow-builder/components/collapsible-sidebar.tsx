"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Settings, 
  Menu, 
  X,
  Bell,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Type
} from "lucide-react"

interface CollapsibleSidebarProps {
  className?: string
}

export default function CollapsibleSidebar({ className = "" }: CollapsibleSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [fontSize, setFontSize] = useState("medium")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const menuItems = [
    { icon: User, label: "Account", id: "account" },
    { icon: Settings, label: "Settings", id: "settings" },
    { icon: Bell, label: "Notifications", id: "notifications" },
    { icon: HelpCircle, label: "Help", id: "help" },
    { icon: LogOut, label: "Sign Out", id: "signout" },
  ]

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    // Apply theme changes to document
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    // Apply font size changes to document
    const root = document.documentElement
    root.classList.remove('text-small', 'text-medium', 'text-large')
    root.classList.add(`text-${fontSize}`)
  }, [fontSize])

  const handleItemClick = (id: string) => {
    console.log(`[v0] CollapsibleSidebar: ${id} clicked`)
    
    // If collapsed, open the sidebar first
    if (!isExpanded) {
      setIsExpanded(true)
    }

    // Handle settings dropdown
    if (id === 'settings') {
      setShowSettingsDropdown(!showSettingsDropdown)
      return
    }

    // Hide settings dropdown when clicking other items
    setShowSettingsDropdown(false)
    
    // TODO: Handle other menu item actions
  }

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode)
    console.log(`[v0] Theme changed to: ${!isDarkMode ? 'dark' : 'light'}`)
  }

  const handleFontSizeChange = (size: string) => {
    console.log(`[v0] 🔥 FONT SIZE HANDLER CALLED! From ${fontSize} to: ${size}`)
    console.log(`[v0] Event triggered, setting fontSize state...`)
    setFontSize(size)
    
    // Force immediate DOM update for testing
    const root = document.documentElement
    root.classList.remove('text-small', 'text-medium', 'text-large')
    root.classList.add(`text-${size}`)
    console.log(`[v0] ✅ Applied class: text-${size} to document root`)
    console.log(`[v0] Root classes now:`, root.className)
    console.log(`[v0] State should now be: ${size}`)
  }

  return (
    <div 
      className={`bg-slate-900 border-r border-slate-700 flex flex-col h-full transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-12'
      } ${className}`}
    >
      {/* Header with close button (only when expanded) */}
      {isExpanded && (
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <h2 className="font-medium text-white text-sm truncate">Settings</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-slate-700"
            onClick={handleToggle}
          >
            <X className="w-4 h-4 text-slate-300" />
          </Button>
        </div>
      )}

      {/* Menu items */}
      <div className={`flex-1 ${isExpanded ? 'py-3' : 'py-2'} relative`}>
        <nav className={isExpanded ? 'space-y-1' : 'space-y-2'}>
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <div key={item.id} className="relative">
                <Button
                  variant="ghost"
                  className={`w-full justify-start hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ${
                    isExpanded 
                      ? 'px-3 py-2 h-10 mx-0' 
                      : 'mx-auto w-8 h-8 px-0 py-0'
                  }`}
                  onClick={() => handleItemClick(item.id)}
                  title={!isExpanded ? item.label : undefined}
                >
                  <IconComponent className={`w-4 h-4 ${isExpanded ? 'mr-3' : ''}`} />
                  {isExpanded && (
                    <span className="text-sm truncate">{item.label}</span>
                  )}
                </Button>

                {/* Settings Dropdown - Inline under the settings button */}
                {item.id === 'settings' && showSettingsDropdown && isExpanded && (
                  <div 
                    ref={dropdownRef}
                    className="w-full mt-2 bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden"
                  >
                    <div className="p-3 space-y-3">
                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isDarkMode ? (
                            <Moon className="w-3 h-3 text-slate-400" />
                          ) : (
                            <Sun className="w-3 h-3 text-slate-400" />
                          )}
                          <Label className="text-xs text-slate-300">
                            {isDarkMode ? 'Dark' : 'Light'}
                          </Label>
                        </div>
                        <Switch
                          checked={isDarkMode}
                          onCheckedChange={handleThemeToggle}
                          className="data-[state=checked]:bg-blue-600 scale-75"
                        />
                      </div>

                      {/* Font Size */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Type className="w-3 h-3 text-slate-400" />
                          <Label className="text-xs text-slate-300">Font Size</Label>
                        </div>
                        <select 
                          value={fontSize} 
                          onChange={(e) => handleFontSizeChange(e.target.value)}
                          className="w-full bg-slate-600 border border-slate-500 text-slate-300 text-xs h-7 rounded px-2 cursor-pointer"
                        >
                          <option value="small" className="bg-slate-700 text-slate-300">Small</option>
                          <option value="medium" className="bg-slate-700 text-slate-300">Medium</option>
                          <option value="large" className="bg-slate-700 text-slate-300">Large</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Footer - User info when expanded */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">User</p>
              <p className="text-xs text-slate-400 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}