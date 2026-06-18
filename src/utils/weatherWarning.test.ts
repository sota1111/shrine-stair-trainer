import { describe, it, expect } from 'vitest'
import {
  isDangerousCondition,
  isDangerousExercise,
  ALTERNATIVE_EXERCISES,
} from './weatherWarning'

describe('isDangerousCondition', () => {
  it('returns true for bad weather regardless of road condition', () => {
    expect(isDangerousCondition('rainy', 'dry')).toBe(true)
    expect(isDangerousCondition('light-rain', 'dry')).toBe(true)
  })

  it('returns true for bad road condition regardless of weather', () => {
    expect(isDangerousCondition('sunny', 'wet')).toBe(true)
    expect(isDangerousCondition('sunny', 'rainy')).toBe(true)
    expect(isDangerousCondition('sunny', 'slippery')).toBe(true)
  })

  it('returns false when both weather and road are safe', () => {
    expect(isDangerousCondition('sunny', 'dry')).toBe(false)
    expect(isDangerousCondition('cloudy', 'dry')).toBe(false)
  })
})

describe('isDangerousExercise', () => {
  it('flags skip-step exercises as dangerous', () => {
    expect(isDangerousExercise('一段飛ばし')).toBe(true)
    expect(isDangerousExercise('二段飛ばし')).toBe(true)
  })

  it('does not flag safe exercises', () => {
    expect(isDangerousExercise('一段ずつ')).toBe(false)
    expect(isDangerousExercise('軽め')).toBe(false)
    expect(isDangerousExercise('休養')).toBe(false)
  })
})

describe('ALTERNATIVE_EXERCISES', () => {
  it('offers safe fallback exercises', () => {
    expect(ALTERNATIVE_EXERCISES).toContain('休養')
    expect(ALTERNATIVE_EXERCISES).toContain('軽め')
    expect(ALTERNATIVE_EXERCISES.length).toBeGreaterThan(0)
  })

  it('contains no dangerous exercises', () => {
    expect(ALTERNATIVE_EXERCISES).not.toContain('一段飛ばし')
    expect(ALTERNATIVE_EXERCISES).not.toContain('二段飛ばし')
  })
})
