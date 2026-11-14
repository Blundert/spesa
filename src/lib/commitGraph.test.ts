import { describe, it, expect } from 'vitest'
import { layoutGraph, type GraphCommit } from './commitGraph'

const c = (sha: string, day: number, parents: string[] = []): GraphCommit => ({
  sha,
  date: `2026-11-${String(day).padStart(2, '0')}T10:00:00Z`,
  message: `m ${sha}`,
  parents,
})

const shape = (rows: ReturnType<typeof layoutGraph>) =>
  rows.map((r) => ({ sha: r.commit.sha, lane: r.lane, in: r.incoming, through: r.through, out: r.outgoing }))

describe('layoutGraph', () => {
  it('nessun commit: grafo vuoto', () => {
    expect(layoutGraph([])).toEqual([])
  })

  it('storia lineare: tutto nella corsia 0', () => {
    const rows = layoutGraph([c('a', 3, ['b']), c('b', 2, ['c']), c('c', 1)], { main: 'a' })
    expect(shape(rows)).toEqual([
      { sha: 'a', lane: 0, in: [], through: [], out: [0] },
      { sha: 'b', lane: 0, in: [0], through: [], out: [0] },
      { sha: 'c', lane: 0, in: [0], through: [], out: [] },
    ])
    expect(rows[0].refs).toEqual(['main'])
    expect(rows[1].refs).toEqual([])
    expect(rows.map((r) => r.width)).toEqual([1, 1, 1])
  })

  it('più branch sulla stessa punta', () => {
    expect(layoutGraph([c('a', 1)], { main: 'a', feat: 'a' })[0].refs).toEqual(['main', 'feat'])
  })

  it('branch e unione: la seconda corsia si apre e si richiude', () => {
    // m (merge di main2 e feat1) ← main2 ← base ; feat1 ← base
    const rows = layoutGraph(
      [c('m', 5, ['main2', 'feat1']), c('main2', 4, ['base']), c('feat1', 3, ['base']), c('base', 1)],
      { main: 'm', feat: 'feat1' },
    )
    expect(shape(rows)).toEqual([
      { sha: 'm', lane: 0, in: [], through: [], out: [0, 1] },
      { sha: 'main2', lane: 0, in: [0], through: [1], out: [0] },
      { sha: 'feat1', lane: 1, in: [1], through: [0], out: [0] },
      { sha: 'base', lane: 0, in: [0], through: [], out: [] },
    ])
    expect(rows[2].width).toBe(2)
    expect(rows[2].refs).toEqual(['feat'])
  })

  it('due punte diverse: la seconda occupa una corsia libera', () => {
    const rows = layoutGraph([c('a', 4, ['base']), c('b', 3, ['base']), c('base', 1)], { main: 'a', feat: 'b' })
    expect(shape(rows)).toEqual([
      { sha: 'a', lane: 0, in: [], through: [], out: [0] },
      { sha: 'b', lane: 1, in: [], through: [0], out: [0] },
      { sha: 'base', lane: 0, in: [0], through: [], out: [] },
    ])
  })

  it('unione con tre genitori (octopus) e riuso di una corsia già attesa', () => {
    const rows = layoutGraph([c('m', 5, ['x', 'y', 'z']), c('x', 4), c('y', 3), c('z', 2)])
    expect(rows[0].outgoing).toEqual([0, 1, 2])
    expect(rows.map((r) => r.lane)).toEqual([0, 0, 1, 2])
  })

  it('orologi fuori ordine: i figli stanno comunque prima dei genitori', () => {
    // il genitore "p" risulta più recente del figlio "k"
    const rows = layoutGraph([c('p', 9), c('k', 2, ['p'])])
    expect(rows.map((r) => r.commit.sha)).toEqual(['k', 'p'])
    expect(rows[1].incoming).toEqual([0])
  })

  it('genitori fuori dall’elenco (storia tagliata): la corsia resta aperta fino in fondo', () => {
    const rows = layoutGraph([c('a', 3, ['gone']), c('b', 2, ['gone'])])
    expect(shape(rows)).toEqual([
      { sha: 'a', lane: 0, in: [], through: [], out: [0] },
      { sha: 'b', lane: 1, in: [], through: [0], out: [0] },
    ])
  })

  it('un genitore già atteso in un’altra corsia chiude quella del commit', () => {
    const rows = layoutGraph([c('a', 5, ['r']), c('b', 4, ['r']), c('r', 1)])
    expect(rows[1].lane).toBe(1)
    expect(rows[1].outgoing).toEqual([0]) // confluisce nella corsia 0, dove "r" è già atteso
    expect(rows[2].lane).toBe(0)
  })

  it('una corsia liberata in mezzo viene riusata dalla punta successiva', () => {
    // la corsia 0 si chiude (x) mentre la 1 resta aperta (y): il commit "t" torna nella 0
    const rows = layoutGraph([c('a', 6, ['x']), c('b', 5, ['y']), c('x', 4), c('t', 3), c('y', 2)])
    expect(rows.map((r) => [r.commit.sha, r.lane])).toEqual([['a', 0], ['b', 1], ['x', 0], ['t', 0], ['y', 1]])
  })

  it('cicli (impossibili in git) non bloccano il calcolo', () => {
    const rows = layoutGraph([c('a', 2, ['b']), c('b', 1, ['a'])])
    expect(rows).toHaveLength(2)
  })
})
