import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LatencyChart from '@/components/connection/LatencyChart'

describe('LatencyChart', () => {
  it('renders bar chart with latency data', () => {
    const data = [50, 100, 200, 500]
    render(<LatencyChart data={data} />)
    // Should render bars for each data point
    expect(screen.getByTitle('50 ms')).toBeInTheDocument()
    expect(screen.getByTitle('100 ms')).toBeInTheDocument()
    expect(screen.getByTitle('200 ms')).toBeInTheDocument()
    expect(screen.getByTitle('500 ms')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    render(<LatencyChart data={[]} />)
    expect(screen.getByText('No data yet')).toBeInTheDocument()
  })

  it('renders green bar for low latency (<100ms)', () => {
    render(<LatencyChart data={[50]} />)
    const barWrapper = screen.getByTitle('50 ms')
    const colorBar = barWrapper.querySelector('[class*="bg-"]')
    expect(colorBar).toHaveClass('bg-emerald-500')
  })

  it('renders yellow bar for medium latency (100-500ms)', () => {
    render(<LatencyChart data={[250]} />)
    const barWrapper = screen.getByTitle('250 ms')
    const colorBar = barWrapper.querySelector('[class*="bg-"]')
    expect(colorBar).toHaveClass('bg-yellow-500')
  })

  it('renders red bar for high latency (>500ms)', () => {
    render(<LatencyChart data={[600]} />)
    const barWrapper = screen.getByTitle('600 ms')
    const colorBar = barWrapper.querySelector('[class*="bg-"]')
    expect(colorBar).toHaveClass('bg-red-500')
  })
})
