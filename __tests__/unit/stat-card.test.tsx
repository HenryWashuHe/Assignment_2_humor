import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '@/components/StatCard'

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Users" value={42} />)
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders optional description when provided', () => {
    render(<StatCard label="Study Users" value={10} description="is_in_study = true" />)
    expect(screen.getByText('is_in_study = true')).toBeInTheDocument()
  })

  it('does not render description when omitted', () => {
    const { container } = render(<StatCard label="Images" value={5} />)
    expect(container.querySelectorAll('p').length).toBe(2) // label + value only
  })

  it('renders string values', () => {
    render(<StatCard label="Status" value="Active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
