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

  static sha(content: string): string {
    return createHash('sha1').update(content).digest('hex')
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
        return json({ content: { sha: FakeGithub.sha(text) } })
      }
      const text = this.files.get(path)
      if (text === undefined) return json({ message: 'Not Found' }, 404)
      if (this.emptyContents) return json({})
      if (this.useDownloadUrl) {
        return json({ sha: FakeGithub.sha(text), download_url: `https://download.test/${encodeURIComponent(path)}` })
      }
      return json({ sha: FakeGithub.sha(text), content: Buffer.from(text, 'utf8').toString('base64') })
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
    if (/\/git\/commits$/.test(url)) return json({ sha: `c${this.commits + 1}` })
    if (/\/git\/refs\/heads\//.test(url)) {
      if (this.rejectRefUpdate) return json({ message: 'Update is not a fast forward' }, 422)
      for (const e of this.pendingTree) this.files.set(e.path, e.content)
      this.commits++
      return json({})
    }
    return json({ message: 'unexpected' }, 500)
  }
}
