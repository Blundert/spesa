import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { db, wipeAllData } from '../db/db'
import { exportData, type BackupData } from '../db/backup'
import { getSafetySnapshots } from '../db/repositories/safetySnapshots'
import { FakeGithub } from './fakeGithub'
import {
  autoSync,
  getAutoSync,
  getGitConfig,
  isGitConfigured,
  setAutoSync,
  setGitConfig,
  syncPull,
  syncPushForce,
} from './gitSync'

const CONFIG = { token: 't', owner: 'me', repo: 'spesa', branch: 'main', path: 'spesa-db.json' }
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
  it('senza nulla salvato dà i valori predefiniti', () => {
    store.clear()
    expect(getGitConfig()).toEqual({ token: '', owner: '', repo: '', branch: 'main', path: 'spesa-db.json' })
    expect(isGitConfigured(getGitConfig())).toBe(false)
  })

  it('rilegge la configurazione e riempie i campi mancanti', () => {
    store.set('gitsync-config', JSON.stringify({ token: 'x', owner: 'o', repo: 'r' }))
    expect(getGitConfig()).toEqual({ token: 'x', owner: 'o', repo: 'r', branch: 'main', path: 'spesa-db.json' })
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

describe('syncPushForce ("Mantieni")', () => {
  it('non configurato', async () => {
    store.clear()
    await expect(syncPushForce()).rejects.toThrow('Sync non configurato')
  })

  it('senza remoto crea il file, senza backup', async () => {
    await addItem('Mele')
    expect(await syncPushForce()).toEqual({ backupPath: null })
    expect(gh.files.get(PATH)).toContain('Mele')
  })

  it('un solo commit con dati nuovi e backup del remoto scartato', async () => {
    await addItem('Mele')
    await autoSync()
    const remoteJson = JSON.stringify(await remoteWith('Kiwi'))
    gh.files.set(PATH, remoteJson)
    await addItem('Pere')
    const before = gh.commits

    const res = await syncPushForce()

    expect(gh.commits).toBe(before + 1)
    expect(res.backupPath).toMatch(/^backups\/.+-remote\.json$/)
    expect(gh.files.get(res.backupPath!)).toBe(remoteJson)
    expect(gh.files.get(PATH)).toContain('Pere')
    // lo stato è ricordato: ora è tutto allineato
    expect(await autoSync()).toEqual({ status: 'noop' })
  })

  it('se il branch è avanzato nel frattempo non scrive niente e lo dice', async () => {
    await addItem('Mele')
    await autoSync()
    await addItem('Pere')
    gh.files.set(PATH, JSON.stringify(await remoteWith('Kiwi')))
    gh.rejectRefUpdate = true
    const before = gh.commits
    await expect(syncPushForce()).rejects.toThrow('Il remoto è cambiato durante il salvataggio')
    expect(gh.commits).toBe(before)
  })

  it('rilancia gli altri errori', async () => {
    await addItem('Mele')
    await autoSync()
    gh.override = (m, u) => (m === 'POST' && u.endsWith('/git/trees') ? new Response('no', { status: 403 }) : undefined)
    await expect(syncPushForce()).rejects.toThrow('GitHub 403: no')
    gh.override = (m) => (m === 'PATCH' ? new TypeError('offline') : undefined)
    await expect(syncPushForce()).rejects.toThrow('offline')
  })

  it('risposta senza i file dell’albero', async () => {
    await addItem('Mele')
    await autoSync()
    gh.omitTreeEntries = true
    await expect(syncPushForce()).rejects.toThrow('risposta incompleta')
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
