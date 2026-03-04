import { describe, it, expect } from 'vitest'

// Mirrors the check in proxy.ts: profile row from profiles table
function isSuperadmin(profile: { is_superadmin: boolean } | null | undefined): boolean {
  return profile?.is_superadmin === true
}

describe('Superadmin check (profiles.is_superadmin)', () => {
  it('grants access when is_superadmin is true', () => {
    expect(isSuperadmin({ is_superadmin: true })).toBe(true)
  })

  it('denies access when is_superadmin is false', () => {
    expect(isSuperadmin({ is_superadmin: false })).toBe(false)
  })

  it('denies access when profile is null', () => {
    expect(isSuperadmin(null)).toBe(false)
  })

  it('denies access when profile is undefined', () => {
    expect(isSuperadmin(undefined)).toBe(false)
  })
})
