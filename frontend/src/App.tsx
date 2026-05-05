import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import TabBar from '@/components/layout/TabBar'
import SettingsPanel from '@/components/settings/SettingsPanel'
import { type TabId, TABS } from '@/types/tab'

function TabPlaceholder({ tab }: { tab: { label: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-700">{tab.label}</h3>
      <p className="text-sm text-gray-400 mt-1">Coming in a future update</p>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('connection')

  const activeTabDef = TABS.find((t) => t.id === activeTab)!

  return (
    <AppLayout subtitle="Speech Recognition Testing &amp; Demonstration Suite">
      <div className="space-y-6">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {activeTab === 'settings' ? (
            <SettingsPanel key="settings" />
          ) : (
            <TabPlaceholder key={activeTab} tab={activeTabDef} />
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default App
