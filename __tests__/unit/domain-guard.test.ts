import { describe, it, expect } from 'vitest'

const ALLOWED_DOMAINS = ['barnard.edu', 'columbia.edu']

function isAllowedDomain(email: string | undefined): boolean {
  if (!email) return false
  const domain = email.split('@')[1]
  return !!domain && ALLOWED_DOMAINS.includes(domain)
}

describe('Domain guard', () => {
  it('allows columbia.edu emails', () => {
    expect(isAllowedDomain('sh4421@columbia.edu')).toBe(true)
  })

  it('allows barnard.edu emails', () => {
    expect(isAllowedDomain('jd1234@barnard.edu')).toBe(true)
  })

  it('rejects gmail.com emails', () => {
    expect(isAllowedDomain('user@gmail.com')).toBe(false)
  })

  it('rejects emails from similar-looking domains', () => {
    expect(isAllowedDomain('user@notcolumbia.edu')).toBe(false)
    expect(isAllowedDomain('user@columbia.edu.evil.com')).toBe(false)
  })

  it('rejects undefined email', () => {
    expect(isAllowedDomain(undefined)).toBe(false)
  })

  it('rejects email with no domain', () => {
    expect(isAllowedDomain('nodomain')).toBe(false)
  })
})
