export type TabId = 'connection' | 'fileupload' | 'realtime' | 'settings'

export interface Tab {
  id: TabId
  label: string
  icon?: string
}

export const TABS: Tab[] = [
  { id: 'connection', label: 'Connection Test' },
  { id: 'fileupload', label: 'File Upload' },
  { id: 'realtime', label: 'Real-Time' },
  { id: 'settings', label: 'Settings' },
]
