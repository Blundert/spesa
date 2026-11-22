import { describe, expect, it } from 'vitest'
import { newUid, parseRepoRef, SHARED_LIST_PATH } from './sharedList'

describe('newUid', () => {
  it('dà identificatori diversi ogni volta', () => {
    const a = newUid()
    expect(a).toMatch(/^[0-9a-f-]{36}$/)
    expect(newUid()).not.toBe(a)
  })
})

describe('parseRepoRef', () => {
  it('legge owner/repo', () => {
    expect(parseRepoRef('anna/spesa-casa')).toEqual({ owner: 'anna', repo: 'spesa-casa' })
    expect(parseRepoRef('  anna/spesa.casa_2 ')).toEqual({ owner: 'anna', repo: 'spesa.casa_2' })
  })

  it('legge gli indirizzi di GitHub, con .git e percorsi in coda', () => {
    expect(parseRepoRef('https://github.com/anna/spesa')).toEqual({ owner: 'anna', repo: 'spesa' })
    expect(parseRepoRef('github.com/anna/spesa.git')).toEqual({ owner: 'anna', repo: 'spesa' })
    expect(parseRepoRef('https://www.github.com/anna/spesa/tree/main')).toEqual({ owner: 'anna', repo: 'spesa' })
    expect(parseRepoRef('git@github.com:anna/spesa.git')).toEqual({ owner: 'anna', repo: 'spesa' })
  })

  it('rifiuta ciò che non è un repo', () => {
    expect(parseRepoRef('')).toBeNull()
    expect(parseRepoRef('anna')).toBeNull()
    expect(parseRepoRef('anna/')).toBeNull()
    expect(parseRepoRef('/spesa')).toBeNull()
    expect(parseRepoRef('-anna/spesa')).toBeNull()
    expect(parseRepoRef('an na/spesa')).toBeNull()
    expect(parseRepoRef('anna/sp esa')).toBeNull()
    expect(parseRepoRef('anna/..')).toBeNull()
    expect(parseRepoRef('anna/.')).toBeNull()
    expect(parseRepoRef('a'.repeat(40) + '/spesa')).toBeNull()
  })
})

describe('SHARED_LIST_PATH', () => {
  it('è un file json nella radice del repo', () => {
    expect(SHARED_LIST_PATH).toBe('lista.json')
  })
})
