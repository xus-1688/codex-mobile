import { describe, expect, it } from 'vitest'
import { resolvePassword } from './password'

describe('resolvePassword', () => {
  it('uses the environment password when no CLI password option is provided', () => {
    expect(resolvePassword(undefined, 'fixed-password')).toEqual({
      password: 'fixed-password',
      generated: false,
    })
  })

  it('lets an explicit CLI password override the environment password', () => {
    expect(resolvePassword('cli-password', 'environment-password')).toEqual({
      password: 'cli-password',
      generated: false,
    })
  })

  it('lets --no-password disable authentication even when the environment is configured', () => {
    expect(resolvePassword(false, 'environment-password')).toEqual({
      password: undefined,
      generated: false,
    })
  })

  it('generates a password when neither source is configured', () => {
    const result = resolvePassword(undefined, undefined)

    expect(result.generated).toBe(true)
    expect(result.password).toBeTruthy()
  })
})
