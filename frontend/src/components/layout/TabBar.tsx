import { type TabId, TABS } from '@/types/tab'
import { cn } from '@/lib/utils'
import { Activity, Upload, Mic, Settings } from 'lucide-react'

const tabIcons: Record<TabId, React.ReactNode> = {
  connection: <Activity className="w-4 h-4" />,
  fileupload: <Upload className="w-4 h-4" />,
  realtime: <Mic className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
}

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {tabIcons[tab.id]}
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
