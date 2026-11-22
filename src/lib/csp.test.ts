import { describe, expect, it } from 'vitest'
import { buildCsp, GITHUB_API_ORIGIN } from './csp'

describe('buildCsp', () => {
  it('senza hash ammette solo script della stessa origine', () => {
    const csp = buildCsp([])
    expect(csp).toContain("script-src 'self';")
    expect(csp).not.toContain('unsafe-eval')
  })

  it('aggiunge gli hash degli script inline, uno per uno e tra apici', () => {
    const csp = buildCsp(['sha256-abc=', 'sha256-def='])
    expect(csp).toContain("script-src 'self' 'sha256-abc=' 'sha256-def=';")
  })

  it('la rete è limitata alla stessa origine e all\'API di GitHub', () => {
    expect(buildCsp([])).toContain(`connect-src 'self' ${GITHUB_API_ORIGIN};`)
  })

  it('blocca plugin e restringe base e form', () => {
    const csp = buildCsp([])
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'self'")
  })

  it('non usa direttive ignorate dal meta (frame-ancestors, report-uri)', () => {
    const csp = buildCsp([])
    expect(csp).not.toContain('frame-ancestors')
    expect(csp).not.toContain('report-uri')
  })

  it('non carica nulla da host di terzi oltre a GitHub', () => {
    expect(buildCsp([]).match(/https?:\/\/[^\s;]+/g)).toEqual([GITHUB_API_ORIGIN])
  })
})
