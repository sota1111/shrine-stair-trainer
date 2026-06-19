import { describe, it, expect } from 'vitest'
import { sampleData } from './sampleData'

describe('sampleData', () => {
  it('provides placeholder records for UI evaluation', () => {
    expect(sampleData.length).toBeGreaterThan(0)
  })

  it('every record falls within May 2026', () => {
    for (const r of sampleData) {
      expect(r.date.startsWith('2026-05')).toBe(true)
    }
  })

  it('every record is flagged with the sample- id prefix so it is never persisted', () => {
    for (const r of sampleData) {
      expect(r.id.startsWith('sample-')).toBe(true)
    }
  })
})
