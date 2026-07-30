import { generatePassword } from '../server/password.js'

export type PasswordResolution = {
  password: string | undefined
  generated: boolean
}

export function resolvePassword(
  input: string | boolean | undefined,
  environmentPassword = process.env.CODEXUI_PASSWORD,
): PasswordResolution {
  if (input === false) {
    return { password: undefined, generated: false }
  }
  if (typeof input === 'string') {
    return { password: input, generated: false }
  }
  if (environmentPassword) {
    return { password: environmentPassword, generated: false }
  }
  return { password: generatePassword(), generated: true }
}
