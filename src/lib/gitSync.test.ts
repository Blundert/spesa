import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { db, wipeAllData } from '../db/db'
import { exportData, type BackupData } from '../db/backup'
import { getSafetySnapshots } from '../db/repositories/safetySnapshots'
import { FakeGithub } from './fakeGithub'
import {
  autoSync,
  createBranch,
  getAutoSync,
  listBranches,
  listCommitGraph,
  listRemoteHistory,
  loadRemoteBackup,
  loadHistoryBackup,
  restoreFromBackup,
  getGitConfig,
  isGitConfigured,
  setAutoSync,
  setGitConfig,
  forgetGitToken,
  switchBranch,
  syncPull,
} from './gitSync'

const CONFIG = { token: 't', login: '', owner: 'me', repo: 'spesa', branch: 'main', path: 'spesa-db.json' }
const PATH = 'spesa-db.json'

let gh: FakeGithub
let store: Map<string, string>

function stubStorage() {
  store = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  })
}

async function addItem(name: string) {
  await db.items.add({ name, normalizedName: name.toLowerCase(), categoryId: 1, lastPriceCents: null, suggestedPriceCents: null })
}

/** Un backup remoto con un solo articolo. */
async function remoteWith(name: string): Promise<BackupData> {
  const base = await exportData()
  return {
    ...base,
    exportedAt: 0,
    items: [{ id: 99, name, normalizedName: name.toLowerCase(), categoryId: 1, lastPriceCents: null, suggestedPriceCents: null }],
  }
}

beforeEach(async () => {
  stubStorage()
  gh = new FakeGithub()
  vi.stubGlobal('fetch', gh.fetch)
  await wipeAllData()
  await db.safetySnapshots.clear()
  setGitConfig(CONFIG)
})

afterEach(() => vi.unstubAllGlobals())

describe('configurazione', () => {
  it('dimenticare il token cancella anche il login e tiene il resto', () => {
    setGitConfig({ ...CONFIG, login: 'matteo' })
    forgetGitToken()
    expect(getGitConfig()).toEqual({ ...CONFIG, token: '', login: '' })
    expect(isGitConfigured(getGitConfig())).toBe(false)
  })

  it('senza nulla salvato dà i valori predefiniti', () => {
    store.clear()
    expect(getGitConfig()).toEqual({ token: '', login: '', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
    expect(isGitConfigured(getGitConfig())).toBe(false)
  })

  it('rilegge la configurazione e riempie i campi mancanti', () => {
    store.set('gitsync-config', JSON.stringify({ token: 'x', owner: 'o', repo: 'r' }))
    expect(getGitConfig()).toEqual({ token: 'x', login: '', owner: 'o', repo: 'r', branch: 'main', path: 'spesa-db.json' })
    expect(isGitConfigured(getGitConfig())).toBe(true)
    store.set('gitsync-config', JSON.stringify({}))
    expect(getGitConfig().token).toBe('')
  })

  it('ignora un JSON corrotto', () => {
    store.set('gitsync-config', '{rotto')
    expect(getGitConfig().owner).toBe('')
  })

  it('salva e legge l’auto-sync', () => {
    expect(getAutoSync()).toBe(false)
    setAutoSync(true)
    expect(getAutoSync()).toBe(true)
    setAutoSync(false)
    expect(getAutoSync()).toBe(false)
  })
})

describe('autoSync', () => {
  it('non configurato', async () => {
    store.clear()
    expect(await autoSync()).toEqual({ status: 'notConfigured' })
  })

  it('crea il file remoto se non esiste', async () => {
    await addItem('Mele')
    expect(await autoSync()).toEqual({ status: 'pushed' })
    expect(gh.files.get(PATH)).toContain('Mele')
  })

  it('poi non fa niente finché nulla cambia', async () => {
    await addItem('Mele')
    await autoSync()
    expect(await autoSync()).toEqual({ status: 'noop' })
  })

  it('in background senza modifiche non usa la rete', async () => {
    await addItem('Mele')
    await autoSync()
    gh.calls = []
    expect(await autoSync({ allowPull: false })).toEqual({ status: 'noop' })
    expect(gh.calls).toEqual([])
  })

  it('invia le modifiche locali se il remoto non è cambiato', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    expect(await autoSync()).toEqual({ status: 'pushed' })
    expect(gh.files.get(PATH)).toContain('Pere')
  })

  it('scarica le modifiche remote se il locale non è cambiato', async () => {
    await addItem('Mele')
    await autoSync()
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    expect(await autoSync()).toEqual({ status: 'pulled' })
    expect((await db.items.toArray()).map((i) => i.name)).toEqual(['Kiwi'])
  })

  it('in background, con locale e remoto cambiati, segnala comunque il conflitto', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    expect(await autoSync({ allowPull: false })).toEqual({ status: 'conflict' })
  })

  it('rifiuta un backup remoto non valido', async () => {
    await addItem('Mele')
    await autoSync()
    gh.files.set(PATH, '{"foo":1}')
    await expect(autoSync()).rejects.toThrow('Backup remoto non valido')
  })

  it('segnala il conflitto se cambiano entrambi, senza scrivere niente', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    const before = gh.commits
    expect(await autoSync()).toEqual({ status: 'conflict' })
    expect(gh.commits).toBe(before)
    expect(await db.items.count()).toBe(2)
  })

  describe('dispositivo nuovo (solo dati iniziali)', () => {
    it('scarica il remoto invece di chiedere', async () => {
      gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
      expect(await autoSync()).toEqual({ status: 'pulled' })
      expect((await db.items.toArray()).map((i) => i.name)).toEqual(['Kiwi'])
      expect(await getSafetySnapshots()).toEqual([])
    })

    it('in background non scarica', async () => {
      gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
      expect(await autoSync({ allowPull: false })).toEqual({ status: 'noop' })
      expect(await db.items.count()).toBe(0)
    })

    it('rifiuta un backup remoto non valido', async () => {
      gh.files.set(PATH, '{"foo":1}')
      await expect(autoSync()).rejects.toThrow('Backup remoto non valido')
    })
  })

  describe('errori di rete', () => {
    it('GET non riuscito', async () => {
      await addItem('Mele')
      gh.override = () => new Response('', { status: 500 })
      await expect(autoSync()).rejects.toThrow('GitHub 500')
    })

    it('PUT riuscito ma senza sha nella risposta', async () => {
      await addItem('Mele')
      gh.override = (m) => (m === 'PUT' ? new Response('{}', { status: 200 }) : undefined)
      expect(await autoSync()).toEqual({ status: 'pushed' })
    })

    it('PUT non riuscito', async () => {
      await addItem('Mele')
      gh.override = (m) => (m === 'PUT' ? new Response('boom', { status: 403 }) : undefined)
      await expect(autoSync()).rejects.toThrow('GitHub 403: boom')
    })
  })
})

describe('lettura del file remoto', () => {
  it('usa download_url se il contenuto non è inline', async () => {
    await addItem('Mele')
    await autoSync()
    gh.useDownloadUrl = true
    const d = await remoteWith('Kiwi')
    gh.files.set(PATH, JSON.stringify(d))
    await syncPull()
    expect((await db.items.toArray()).map((i) => i.name)).toEqual(['Kiwi'])
  })

  it('senza contenuto né download_url il file è vuoto e quindi non valido', async () => {
    gh.files.set(PATH, 'x')
    gh.emptyContents = true
    await expect(syncPull()).rejects.toThrow()
  })

  it('codifica il percorso a segmenti', async () => {
    setGitConfig({ ...CONFIG, path: 'dati spesa/db.json' })
    await addItem('Mele')
    await autoSync()
    expect(gh.files.has('dati spesa/db.json')).toBe(true)
  })

  it('gestisce caratteri non ASCII', async () => {
    await addItem('Baccalà mantecato')
    await autoSync()
    expect(gh.files.get(PATH)).toContain('Baccalà mantecato')
  })
})

describe('scrittura atomica (commit unico)', () => {
  const diverged = async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
  }

  it('un solo commit con i dati e i backup di locale e remoto', async () => {
    await diverged()
    const before = gh.commits
    await restoreFromBackup(await remoteWith('Unito'), 'repo', 'Merge')
    expect(gh.commits).toBe(before + 1)
    expect(gh.log.at(-1)?.message).toMatch(/^Merge /)
    expect(Object.keys(gh.log.at(-1)!.files).filter((f) => f.startsWith('backups/')).sort()).toHaveLength(2)
    expect(gh.files.get(PATH)).toContain('Unito')
    expect(await autoSync()).toEqual({ status: 'noop' })
  })

  it('se il branch è avanzato nel frattempo non scrive niente e lo dice', async () => {
    await diverged()
    gh.rejectRefUpdate = true
    const before = gh.commits
    await expect(restoreFromBackup(await remoteWith('Unito'), 'repo')).rejects.toThrow(
      'Il remoto è cambiato durante il salvataggio',
    )
    expect(gh.commits).toBe(before)
    expect((await db.items.toArray()).map((i) => i.name).sort()).toEqual(['Mele', 'Pere'])
  })

  it('rilancia gli altri errori', async () => {
    await diverged()
    gh.override = (m, u) => (m === 'POST' && u.endsWith('/git/trees') ? new Response('no', { status: 403 }) : undefined)
    await expect(restoreFromBackup(await remoteWith('Unito'), 'repo')).rejects.toThrow('GitHub 403: no')
    gh.override = (m) => (m === 'PATCH' ? new TypeError('offline') : undefined)
    await expect(restoreFromBackup(await remoteWith('Unito'), 'repo')).rejects.toThrow('offline')
  })

  it('risposta senza i file dell’albero', async () => {
    await diverged()
    gh.omitTreeEntries = true
    await expect(restoreFromBackup(await remoteWith('Unito'), 'repo')).rejects.toThrow('risposta incompleta')
  })
})

describe('loadRemoteBackup', () => {
  it('non configurato / senza file / non valido / valido', async () => {
    store.clear()
    await expect(loadRemoteBackup()).rejects.toThrow('Sync non configurato')
    setGitConfig(CONFIG)
    await expect(loadRemoteBackup()).rejects.toThrow('Nessun backup remoto')
    gh.files.set(PATH, '{"foo":1}')
    await expect(loadRemoteBackup()).rejects.toThrow('Backup remoto non valido')
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    expect((await loadRemoteBackup()).items.map((i) => i.name)).toEqual(['Kiwi'])
  })
})

describe('syncPull ("Usa remoto")', () => {
  it('non configurato / senza remoto / remoto non valido', async () => {
    store.clear()
    await expect(syncPull()).rejects.toThrow('Sync non configurato')
    setGitConfig(CONFIG)
    await expect(syncPull()).rejects.toThrow('Nessun backup remoto')
    gh.files.set(PATH, '{"foo":1}')
    await expect(syncPull()).rejects.toThrow('Backup remoto non valido')
  })

  it('locale iniziale: scarica senza backup né copie', async () => {
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    expect(await syncPull()).toEqual({ backupPath: null })
    expect(await getSafetySnapshots()).toEqual([])
    expect(gh.commits).toBe(0)
  })

  it('locale invariato dall’ultimo sync: copia locale ma niente commit', async () => {
    await addItem('Mele')
    await autoSync()
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    const before = gh.commits
    expect(await syncPull()).toEqual({ backupPath: null })
    expect(gh.commits).toBe(before)
    expect(await getSafetySnapshots()).toHaveLength(1)
  })

  it('locale modificato: prima il commit di backup, poi l’import', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    const remoteJson = JSON.stringify(await remoteWith('Kiwi'))
    gh.files.set(PATH, remoteJson)
    const before = gh.commits

    const res = await syncPull()

    expect(gh.commits).toBe(before + 1)
    expect(res.backupPath).toMatch(/^backups\/.+-local\.json$/)
    expect(gh.files.get(res.backupPath!)).toContain('Pere')
    expect(gh.files.get(PATH)).toBe(remoteJson) // il file dei dati non cambia
    expect((await db.items.toArray()).map((i) => i.name)).toEqual(['Kiwi'])
    expect(await getSafetySnapshots()).toHaveLength(1)
    expect(await autoSync()).toEqual({ status: 'noop' })
  })

  it('se il backup non riesce, il locale non viene toccato', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    gh.override = (m, u) => (m === 'POST' && u.endsWith('/git/trees') ? new Response('', { status: 401 }) : undefined)

    await expect(syncPull()).rejects.toThrow('GitHub 401')

    expect((await db.items.toArray()).map((i) => i.name).sort()).toEqual(['Mele', 'Pere'])
  })
})

describe('cronologia', () => {
  it('non configurata', async () => {
    store.clear()
    await expect(listRemoteHistory()).rejects.toThrow('Sync non configurato')
    await expect(loadHistoryBackup({ kind: 'commit', sha: 'x', date: '', message: '' })).rejects.toThrow(
      'Sync non configurato',
    )
  })

  it('senza nessun commit né backup è vuota', async () => {
    expect(await listRemoteHistory()).toEqual([])
  })

  it('unisce commit dei dati e file di backup, dal più recente', async () => {
    await addItem('Mele')
    await autoSync() // commit 1
    await addItem('Pere')
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    gh.files.set('backups/non-nostro.json', 'x')
    await restoreFromBackup(await remoteWith('Unito'), 'repo') // commit 2: dati + backups/
    const h = await listRemoteHistory()
    const commits = h.filter((e) => e.kind === 'commit')
    const backups = h.filter((e) => e.kind === 'backup')
    expect(commits).toHaveLength(2)
    expect(backups).toHaveLength(2)
    expect(backups.map((b) => (b.kind === 'backup' ? b.side : '')).sort()).toEqual(['local', 'remote'])
    const dates = h.map((e) => e.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('errori di rete', async () => {
    gh.failCommitList = true
    await expect(listRemoteHistory()).rejects.toThrow('GitHub 500')
    gh.failCommitList = false
    gh.failBackupList = true
    await expect(listRemoteHistory()).rejects.toThrow('GitHub 500')
  })

  it('scarica la versione di un commit e il contenuto di un backup', async () => {
    await addItem('Mele')
    await autoSync()
    const first = (await listRemoteHistory())[0]
    await addItem('Pere')
    await autoSync()
    const old = await loadHistoryBackup(first)
    expect(old.items.map((i) => i.name)).toEqual(['Mele'])

    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    await restoreFromBackup(await remoteWith('Unito'), 'repo')
    const backup = (await listRemoteHistory()).find((e) => e.kind === 'backup' && e.side === 'remote')!
    expect((await loadHistoryBackup(backup)).items.map((i) => i.name)).toEqual(['Kiwi'])
  })

  it('file non trovato o non valido', async () => {
    await expect(loadHistoryBackup({ kind: 'backup', path: 'backups/x.json', date: '', side: 'local', sha: '' })).rejects.toThrow(
      'File non trovato',
    )
    gh.files.set('backups/x.json', '{"foo":1}')
    await expect(loadHistoryBackup({ kind: 'backup', path: 'backups/x.json', date: '', side: 'local', sha: '' })).rejects.toThrow(
      'Backup non valido',
    )
  })
})

describe('restoreFromBackup', () => {
  it('non configurato (via repo)', async () => {
    store.clear()
    await expect(restoreFromBackup(await remoteWith('Kiwi'), 'repo')).rejects.toThrow('Sync non configurato')
  })

  it('senza file remoto: crea il file con i dati ripristinati', async () => {
    await addItem('Pere')
    const res = await restoreFromBackup(await remoteWith('Kiwi'), 'repo')
    expect(res).toEqual({ backupPath: null })
    expect(gh.files.get(PATH)).toContain('Kiwi')
    expect((await db.items.toArray()).map((i) => i.name)).toEqual(['Kiwi'])
    expect(await getSafetySnapshots()).toHaveLength(1)
  })

  it('con il locale non ancora sincronizzato: un commit con dati ripristinati e backup del locale', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    const before = gh.commits
    const res = await restoreFromBackup(await remoteWith('Kiwi'), 'repo')
    expect(gh.commits).toBe(before + 1)
    expect(res.backupPath).toMatch(/-local\.json$/)
    expect(gh.files.get(res.backupPath!)).toContain('Pere')
    expect(gh.files.get(PATH)).toContain('Kiwi')
    expect(gh.log.at(-1)?.message).toMatch(/^Restore /)
    expect((await db.items.toArray()).map((i) => i.name)).toEqual(['Kiwi'])
    expect(await autoSync()).toEqual({ status: 'noop' })
  })

  it('con locale già sincronizzato: solo il file dei dati', async () => {
    await addItem('Mele')
    await autoSync()
    const res = await restoreFromBackup(await remoteWith('Kiwi'), 'repo')
    expect(res).toEqual({ backupPath: null })
    expect(Object.keys(gh.log.at(-1)!.files)).toEqual([PATH])
  })

  it('con remoto avanzato e non scaricato: salva anche il backup del remoto', async () => {
    await addItem('Mele')
    await autoSync()
    gh.files.set(PATH, JSON.stringify(await remoteWith('Altro')))
    const res = await restoreFromBackup(await remoteWith('Kiwi'), 'repo')
    expect(res.backupPath).toMatch(/-remote\.json$/)
    expect(gh.files.get(res.backupPath!)).toContain('Altro')
  })

  it('con locale e remoto da salvare: due backup nello stesso commit, ritorna quello locale', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    gh.files.set(PATH, JSON.stringify(await remoteWith('Altro')))
    const before = gh.commits
    const res = await restoreFromBackup(await remoteWith('Kiwi'), 'repo')
    expect(gh.commits).toBe(before + 1)
    expect(res.backupPath).toMatch(/-local\.json$/)
    expect(Object.keys(gh.log.at(-1)!.files).filter((f) => f.startsWith('backups/'))).toHaveLength(2)
  })

  it('con il locale ancora iniziale: niente copia né backup locale, ma il remoto non scaricato sì', async () => {
    gh.files.set(PATH, JSON.stringify(await remoteWith('Altro')))
    const res = await restoreFromBackup(await remoteWith('Kiwi'), 'repo')
    expect(res.backupPath).toMatch(/-remote\.json$/)
    expect(await getSafetySnapshots()).toEqual([])
  })

  it('se il commit non riesce il locale non cambia', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    gh.override = (m, u) => (m === 'POST' && u.endsWith('/git/trees') ? new Response('', { status: 401 }) : undefined)
    await expect(restoreFromBackup(await remoteWith('Kiwi'), 'repo')).rejects.toThrow('GitHub 401')
    expect((await db.items.toArray()).map((i) => i.name).sort()).toEqual(['Mele', 'Pere'])
  })

  it('via locale: copia di sicurezza e import, senza rete', async () => {
    await addItem('Pere')
    const res = await restoreFromBackup(await remoteWith('Kiwi'), 'local')
    expect(res).toEqual({ backupPath: null })
    expect(gh.calls).toEqual([])
    expect((await db.items.toArray()).map((i) => i.name)).toEqual(['Kiwi'])
    expect(await getSafetySnapshots()).toHaveLength(1)
  })

  it('via locale con dati iniziali: nessuna copia', async () => {
    await restoreFromBackup(await remoteWith('Kiwi'), 'local')
    expect(await getSafetySnapshots()).toEqual([])
  })
})

describe('branch', () => {
  it('senza configurazione tutto rifiuta', async () => {
    store.clear()
    await expect(listBranches()).rejects.toThrow('Sync non configurato')
    await expect(createBranch('prova')).rejects.toThrow('Sync non configurato')
    await expect(switchBranch('prova')).rejects.toThrow('Sync non configurato')
  })

  it('elenca i branch', async () => {
    expect(await listBranches()).toEqual(['main'])
    gh.branchFiles.set('prova', new Map())
    expect(await listBranches()).toEqual(['main', 'prova'])
    gh.override = () => new Response('', { status: 500 })
    await expect(listBranches()).rejects.toThrow('GitHub 500')
  })

  it('crea un branch dal commit attuale, rifiuta nomi non validi e doppioni', async () => {
    await addItem('Mele')
    await autoSync()
    await createBranch('prova')
    expect(gh.branchFiles.get('prova')?.get(PATH)).toContain('Mele')
    await expect(createBranch('prova')).rejects.toThrow('Esiste già')
    await expect(createBranch('main')).rejects.toThrow('Esiste già')
    await expect(createBranch('a b')).rejects.toThrow('non valido')
    gh.override = (m, u) => (m === 'POST' && u.endsWith('/git/refs') ? new Response('', { status: 403 }) : undefined)
    await expect(createBranch('altro')).rejects.toThrow('GitHub 403')
  })

  it('carica il file dei dati di un altro branch', async () => {
    gh.branchFiles.set('prova', new Map([[PATH, JSON.stringify(await remoteWith('Kiwi'))]]))
    expect((await loadRemoteBackup('prova')).items.map((i) => i.name)).toEqual(['Kiwi'])
  })

  describe('switchBranch', () => {
    const onBranch = async (name: string, item: string) => {
      gh.branchFiles.set(name, new Map([[PATH, JSON.stringify(await remoteWith(item))]]))
    }

    it('branch senza file o con file non valido', async () => {
      gh.branchFiles.set('vuoto', new Map())
      await expect(switchBranch('vuoto')).rejects.toThrow('Nessun backup su questo branch')
      gh.branchFiles.set('rotto', new Map([[PATH, '{"foo":1}']]))
      await expect(switchBranch('rotto')).rejects.toThrow('Backup non valido')
    })

    it('locale già sincronizzato: copia di sicurezza, nessun commit; poi il sync lavora sul nuovo branch', async () => {
      await addItem('Mele')
      await autoSync()
      await onBranch('prova', 'Kiwi')
      const before = gh.commits
      expect(await switchBranch('prova')).toEqual({ backupPath: null })
      expect(gh.commits).toBe(before)
      expect(getGitConfig().branch).toBe('prova')
      expect((await db.items.toArray()).map((i) => i.name)).toEqual(['Kiwi'])
      expect(await getSafetySnapshots()).toHaveLength(1)
      expect(await autoSync()).toEqual({ status: 'noop' })
    })

    it('locale non sincronizzato: prima il backup nel branch che si lascia, poi il passaggio', async () => {
      await addItem('Mele')
      await autoSync()
      await addItem('Pere')
      await onBranch('prova', 'Kiwi')
      const res = await switchBranch('prova')
      expect(res.backupPath).toMatch(/^backups\/.+-local\.json$/)
      expect(gh.files.get(res.backupPath!)).toContain('Pere') // sul branch lasciato (main)
      expect(gh.log.at(-1)?.message).toMatch(/^Back up local before switching to prova /)
      expect(gh.branchFiles.get('prova')?.has(res.backupPath!)).toBe(false)
      expect((await db.items.toArray()).map((i) => i.name)).toEqual(['Kiwi'])
    })

    it('locale iniziale: passa senza copie né commit', async () => {
      await onBranch('prova', 'Kiwi')
      expect(await switchBranch('prova')).toEqual({ backupPath: null })
      expect(await getSafetySnapshots()).toEqual([])
      expect(gh.commits).toBe(0)
    })

    it('se il backup non riesce il locale e il branch restano com’erano', async () => {
      await addItem('Mele')
      await autoSync()
      await addItem('Pere')
      await onBranch('prova', 'Kiwi')
      gh.override = (m, u) => (m === 'POST' && u.endsWith('/git/trees') ? new Response('', { status: 401 }) : undefined)
      await expect(switchBranch('prova')).rejects.toThrow('GitHub 401')
      expect(getGitConfig().branch).toBe('main')
      expect((await db.items.toArray()).map((i) => i.name).sort()).toEqual(['Mele', 'Pere'])
    })

    it('si può tornare indietro: il backup finisce sul branch in cui si era', async () => {
      await addItem('Mele')
      await autoSync()
      await onBranch('prova', 'Kiwi')
      await switchBranch('prova')
      await addItem('Fichi')
      gh.branchFiles.get('prova')!.set('spesa-db.json', JSON.stringify(await remoteWith('Kiwi')))
      await switchBranch('main')
      expect(getGitConfig().branch).toBe('main')
      expect([...gh.branchFiles.get('prova')!.keys()].some((f) => f.startsWith('backups/'))).toBe(true)
    })
  })
})

describe('listCommitGraph', () => {
  it('non configurato', async () => {
    store.clear()
    await expect(listCommitGraph()).rejects.toThrow('Sync non configurato')
  })

  it('un branch: commit con genitori e punta', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    await autoSync()
    const g = await listCommitGraph()
    expect(g.commits.map((k) => k.sha).sort()).toEqual(['c1', 'c2'])
    expect(g.commits.find((k) => k.sha === 'c2')?.parents).toEqual(['c1'])
    expect(g.commits.find((k) => k.sha === 'c1')?.parents).toEqual([])
    expect(g.heads).toEqual({ main: 'c2' })
  })

  it('più branch: unisce i commit senza duplicati, tiene solo la prima riga del messaggio, salta i branch vuoti', async () => {
    gh.branchFiles.set('vuoto', new Map())
    gh.override = (_m, u) => {
      if (!/\/commits\?/.test(u)) return undefined
      const row = (sha: string, parent: string | null, message: string) => ({
        sha,
        parents: parent ? [{ sha: parent }] : [],
        commit: { message, author: { date: '2026-11-01T10:00:00Z' } },
      })
      const body = u.includes('sha=main')
        ? [row('b', 'a', 'Backup\n\ndettagli'), row('a', null, 'Root')]
        : u.includes('sha=feat')
          ? [row('f', 'a', 'Prova'), row('a', null, 'Root')]
          : []
      return new Response(JSON.stringify(body), { status: 200 })
    }
    gh.branchFiles.set('feat', new Map())
    const g = await listCommitGraph()
    expect(g.commits.map((k) => k.sha).sort()).toEqual(['a', 'b', 'f'])
    expect(g.commits.find((k) => k.sha === 'b')?.message).toBe('Backup')
    expect(g.heads).toEqual({ main: 'b', feat: 'f' })
  })

  it('errore di rete', async () => {
    gh.failCommitList = true
    await expect(listCommitGraph()).rejects.toThrow('GitHub 500')
  })
})
