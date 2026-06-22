import { describe, it, expect } from 'vitest'
import { sampleData } from './sampleData'

describe('sampleData', () => {
  it('provides placeholder records for UI evaluation', () => {
    expect(sampleData.length).toBeGreaterThan(0)
  })

  it('every record falls within May or June 2026', () => {
    for (const r of sampleData) {
      expect(r.date.startsWith('2026-05') || r.date.startsWith('2026-06')).toBe(true)
    }
  })

  it('includes at least one June 2026 record', () => {
    expect(sampleData.some(r => r.date.startsWith('2026-06'))).toBe(true)
  })

  it('every record is flagged with the sample- id prefix so it is never persisted', () => {
    for (const r of sampleData) {
      expect(r.id.startsWith('sample-')).toBe(true)
    }
  })

  it('uses unique ids across both month blocks', () => {
    const ids = sampleData.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
