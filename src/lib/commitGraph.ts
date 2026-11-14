export interface GraphCommit {
  sha: string
  /** ISO 8601. */
  date: string
  message: string
  parents: string[]
}

/**
 * Una riga del grafo: il commit sta nella corsia `lane`; `incoming` sono le corsie da cui arrivano linee dall'alto
 * (verso il commit), `through` quelle che lo attraversano senza toccarlo, `outgoing` quelle dei genitori verso il basso.
 */
export interface GraphRow {
  commit: GraphCommit
  lane: number
  incoming: number[]
  through: number[]
  outgoing: number[]
  /** Quante corsie servono per disegnare la riga. */
  width: number
  /** Branch la cui punta è questo commit. */
  refs: string[]
}

/** Dal più recente, ma sempre con i figli prima dei genitori (anche se gli orologi non sono in ordine). */
function topoOrder(commits: GraphCommit[]): GraphCommit[] {
  const remaining = [...commits].sort((a, b) => b.date.localeCompare(a.date))
  const known = new Set(remaining.map((c) => c.sha))
  const pendingChildren = new Map(remaining.map((c) => [c.sha, 0]))
  for (const c of remaining) {
    for (const p of c.parents) if (known.has(p)) pendingChildren.set(p, (pendingChildren.get(p) as number) + 1)
  }
  const out: GraphCommit[] = []
  while (remaining.length > 0) {
    // C'è sempre un commit senza figli in attesa, salvo cicli (impossibili in git): in tal caso si prende il primo.
    const i = Math.max(0, remaining.findIndex((c) => pendingChildren.get(c.sha) === 0))
    const [c] = remaining.splice(i, 1)
    out.push(c)
    for (const p of c.parents) if (known.has(p)) pendingChildren.set(p, (pendingChildren.get(p) as number) - 1)
  }
  return out
}

/** Assegna a ogni commit una corsia e dice quali linee disegnare in ogni riga (grafo stile `git log --graph`). */
export function layoutGraph(commits: GraphCommit[], heads: Record<string, string> = {}): GraphRow[] {
  const refsBySha = new Map<string, string[]>()
  for (const [branch, sha] of Object.entries(heads)) refsBySha.set(sha, [...(refsBySha.get(sha) ?? []), branch])

  const lanes: Array<string | null> = []
  const freeLane = (): number => {
    const i = lanes.indexOf(null)
    if (i !== -1) return i
    lanes.push(null)
    return lanes.length - 1
  }

  return topoOrder(commits).map((commit) => {
    const incoming = lanes.flatMap((s, i) => (s === commit.sha ? [i] : []))
    const lane = incoming[0] ?? freeLane()
    const through = lanes.flatMap((s, i) => (s !== null && s !== commit.sha ? [i] : []))
    for (const i of incoming) lanes[i] = null

    const outgoing = commit.parents.map((parent, index) => {
      let j = lanes.indexOf(parent)
      if (j === -1) {
        j = index === 0 ? lane : freeLane()
        lanes[j] = parent
      }
      return j
    })
    while (lanes.length > 0 && lanes[lanes.length - 1] === null) lanes.pop()

    return {
      commit,
      lane,
      incoming,
      through,
      outgoing,
      width: Math.max(lane, ...incoming, ...through, ...outgoing) + 1,
      refs: refsBySha.get(commit.sha) ?? [],
    }
  })
}
