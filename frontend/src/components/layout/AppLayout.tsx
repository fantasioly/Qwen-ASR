import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">{title ?? 'Qwen3-ASR Web Demo'}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}
