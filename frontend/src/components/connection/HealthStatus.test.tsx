import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HealthStatus from '@/components/connection/HealthStatus'

describe('HealthStatus', () => {
  it('renders green dot and "Connected" when status is ok', () => {
    render(<HealthStatus status="ok" />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('renders red dot and "Disconnected" when status is error', () => {
    render(<HealthStatus status="error" message="Connection failed" />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText('Connection failed')).toBeInTheDocument()
  })

  it('renders checking indicator when status is checking', () => {
    render(<HealthStatus status="checking" />)
    expect(screen.getByText('Checking...')).toBeInTheDocument()
  })

  it('shows error message when provided with error status', () => {
    render(<HealthStatus status="error" message="Server not reachable" />)
    expect(screen.getByText('Server not reachable')).toBeInTheDocument()
  })
})
