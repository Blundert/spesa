// Finta API GitHub (Contents + Git Data) per i test di gitSync. Non è usata dall'app.
import { createHash } from 'node:crypto'

export type Override = (method: string, url: string) => Response | Error | undefined

export class FakeGithub {
  /** path → contenuto del file nel branch. */
  files = new Map<string, string>()
  commits = 0
  calls: Array<{ method: string; url: string; body: unknown }> = []
  override: Override | undefined
  /** Se true, il PATCH del ref risponde 422 (il branch è avanzato nel frattempo). */
  rejectRefUpdate = false
  /** Se true, la risposta di POST /trees non elenca i file. */
  omitTreeEntries = false
  /** Se true, GET contents risponde senza `content` ma con `download_url`. */
  useDownloadUrl = false
  /** Se true, GET contents risponde senza `content` né `download_url`. */
  emptyContents = false
  private pendingTree: Array<{ path: string; content: string }> = []
  private pendingMessage = ''
  /** Commit in ordine cronologico: messaggio, data e file toccati (con il loro contenuto). */
  log: Array<{ sha: string; message: string; date: string; files: Record<string, string> }> = []
  /** Se true, GET /commits risponde 500. */
  failCommitList = false
  /** Se true, GET /contents/backups risponde 500. */
  failBackupList = false

  static sha(content: string): string {
    return createHash('sha1').update(content).digest('hex')
  }

  private record(message: string, files: Record<string, string>) {
    // Data finta ma crescente: le voci si ordinano per data come in GitHub.
    const date = new Date(Date.UTC(2026, 10, 1, 12, 0, this.commits)).toISOString()
    this.log.push({ sha: `c${this.commits}`, message, date, files })
  }

  fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    const body: unknown = init?.body ? JSON.parse(String(init.body)) : undefined
    this.calls.push({ method, url, body })
    const forced = this.override?.(method, url)
    if (forced instanceof Error) throw forced
    if (forced) return forced

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

    if (url.startsWith('https://download.test/')) {
      return new Response(this.files.get(decodeURIComponent(url.slice('https://download.test/'.length))) ?? '')
    }

    const contents = /\/contents\/([^?]+)/.exec(url)
    if (contents) {
      const path = decodeURIComponent(contents[1])
      if (method === 'PUT') {
        const b = body as { content: string }
        const text = Buffer.from(b.content, 'base64').toString('utf8')
        this.files.set(path, text)
        this.commits++
        this.record(`Backup ${this.commits}`, { [path]: text })
        return json({ content: { sha: FakeGithub.sha(text) } })
      }
      if (path === 'backups') {
        if (this.failBackupList) return json({ message: 'boom' }, 500)
        const names = [...this.files.keys()].filter((f) => f.startsWith('backups/'))
        if (names.length === 0) return json({ message: 'Not Found' }, 404)
        return json(names.map((n) => ({ path: n, sha: FakeGithub.sha(this.files.get(n) ?? '') })))
      }
      const ref = /[?&]ref=([^&]+)/.exec(url)?.[1] ?? 'main'
      const at = this.log.find((k) => k.sha === decodeURIComponent(ref))
      const text = at ? at.files[path] : this.files.get(path)
      if (text === undefined) return json({ message: 'Not Found' }, 404)
      if (this.emptyContents) return json({})
      if (this.useDownloadUrl) {
        return json({ sha: FakeGithub.sha(text), download_url: `https://download.test/${encodeURIComponent(path)}` })
      }
      return json({ sha: FakeGithub.sha(text), content: Buffer.from(text, 'utf8').toString('base64') })
    }

    if (/\/commits\?/.test(url)) {
      if (this.failCommitList) return json({ message: 'boom' }, 500)
      const path = decodeURIComponent(/[?&]path=([^&]+)/.exec(url)?.[1] ?? '')
      return json(
        this.log
          .filter((k) => path in k.files)
          .map((k) => ({ sha: k.sha, commit: { message: k.message, author: { date: k.date } } }))
          .reverse(),
      )
    }
    if (/\/git\/ref\/heads\//.test(url)) return json({ object: { sha: `c${this.commits}` } })
    if (/\/git\/commits\/c\d+$/.test(url)) return json({ tree: { sha: `t${this.commits}` } })
    if (/\/git\/trees$/.test(url)) {
      const b = body as { tree: Array<{ path: string; content: string }> }
      this.pendingTree = b.tree
      return json({
        sha: `t${this.commits + 1}`,
        tree: this.omitTreeEntries ? [] : b.tree.map((e) => ({ path: e.path, sha: FakeGithub.sha(e.content) })),
      })
    }
    if (/\/git\/commits$/.test(url)) {
      this.pendingMessage = (body as { message: string }).message
      return json({ sha: `c${this.commits + 1}` })
    }
    if (/\/git\/refs\/heads\//.test(url)) {
      if (this.rejectRefUpdate) return json({ message: 'Update is not a fast forward' }, 422)
      for (const e of this.pendingTree) this.files.set(e.path, e.content)
      this.commits++
      this.record(this.pendingMessage, Object.fromEntries(this.pendingTree.map((e) => [e.path, e.content])))
      return json({})
    }
    return json({ message: 'unexpected' }, 500)
  }
}
