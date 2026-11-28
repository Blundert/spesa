import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { LANG_KEY } from '../../i18n'
import { decodeSharePayload } from '../../lib/shareLink'
import {
  groupReceived,
  openReceivedList,
  toggleChecked,
  type ReceivedList,
} from '../../lib/receivedList'
import {
  deleteReceivedList,
  getReceivedList,
  purgeExpiredReceivedLists,
  saveReceivedList,
} from '../../db/repositories/receivedLists'
import { CheckedCircle, OpenCircle, ShopGroup, ShopRow } from './ShopGroup'

type State = { status: 'loading' } | { status: 'invalid' } | { status: 'ready'; list: ReceivedList }

/** Chi non ha mai scelto una lingua nell'app vede la vista nella lingua del browser (it o en). */
function useBrowserLanguage() {
  useEffect(() => {
    try {
      if (localStorage.getItem(LANG_KEY) === null && navigator.language.toLowerCase().startsWith('en')) {
        void i18n.changeLanguage('en')
      }
    } catch {
      // storage non disponibile: resta l'italiano
    }
  }, [])
}

/**
 * Vista di una lista ricevuta con un link (`#l=…`): sola lettura più spunte, salvate solo su questo
 * dispositivo. Stessi componenti della spesa in corso; non tocca nessun dato dell'app.
 */
export function ReceivedListView({ encoded }: { encoded: string }) {
  const { t } = useTranslation()
  const [state, setState] = useState<State>({ status: 'loading' })
  useBrowserLanguage()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const payload = await decodeSharePayload(encoded)
      if (cancelled) return
      if (payload === null) {
        setState({ status: 'invalid' })
        return
      }
      await purgeExpiredReceivedLists()
      const list = openReceivedList(payload, await getReceivedList(payload.id), Date.now())
      await saveReceivedList(list)
      if (!cancelled) setState({ status: 'ready', list })
    })()
    return () => {
      cancelled = true
    }
  }, [encoded])

  const toggle = useCallback((name: string) => {
    setState((s) => {
      if (s.status !== 'ready') return s
      const list = toggleChecked(s.list, name)
      void saveReceivedList(list)
      return { status: 'ready', list }
    })
  }, [])

  const remove = async (id: string) => {
    await deleteReceivedList(id)
    // Il link resta nell'URL: si toglie, così un ricaricamento non la ricrea.
    window.location.replace(window.location.pathname)
  }

  if (state.status === 'loading') return null

  return (
    <div className="h-full w-full max-w-[560px] overflow-y-auto px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+40px)]">
      {state.status === 'invalid' ? (
        <div className="bg-t-surface rounded-[20px] px-[18px] py-5">
          <div className="text-[22px] font-normal tracking-[-0.3px] text-t-fg mb-2">{t('share.received.invalidTitle')}</div>
          <div className="text-[15px] text-t-muted">{t('share.received.invalidHint')}</div>
        </div>
      ) : (
        <ReadyList list={state.list} onToggle={toggle} onRemove={() => void remove(state.list.id)} />
      )}
    </div>
  )
}

function ReadyList({ list, onToggle, onRemove }: { list: ReceivedList; onToggle: (name: string) => void; onRemove: () => void }) {
  const { t } = useTranslation()
  const { todo, done } = groupReceived(list)
  const total = list.items.length
  return (
    <>
      <div className="flex items-baseline justify-between px-1 pb-[18px]">
        <h1 className="m-0 text-[26px] font-normal tracking-[-0.5px] text-t-fg">{list.name}</h1>
        {total > 0 && (
          <span className="text-[15px] text-t-muted tabular-nums">
            {t('share.received.progress', { done: done.length, total })}
          </span>
        )}
      </div>

      {total === 0 && <div className="text-[15px] text-t-muted px-1.5">{t('share.received.empty')}</div>}
      {total > 0 && todo.length === 0 && (
        <div className="bg-t-surface2 text-t-muted text-[13px] rounded-2xl px-[18px] py-3 mb-4">{t('share.received.allDone')}</div>
      )}

      {todo.map((g) => (
        <ShopGroup key={g.category} title={g.category} className="mb-4">
          {g.items.map((item, i) => (
            <ShopRow key={item.name} last={i === g.items.length - 1} padding="py-[17px]">
              <button
                onClick={() => onToggle(item.name)}
                className="flex flex-1 items-center gap-[13px] text-left active:opacity-60 transition-opacity"
              >
                <OpenCircle />
                <div className="flex-1 text-base text-t-fg">{item.name}</div>
                {item.quantity > 1 && <span className="text-[15px] text-t-muted tabular-nums">×{item.quantity}</span>}
              </button>
            </ShopRow>
          ))}
        </ShopGroup>
      ))}

      {done.length > 0 && (
        <ShopGroup title={t('spesa.inCart')} className="mt-1.5">
          {done.map((item, i) => (
            <ShopRow key={item.name} last={i === done.length - 1} padding="py-4">
              <CheckedCircle onClick={() => onToggle(item.name)} label={t('spesa.uncheck')} />
              <div className="flex flex-1 items-center gap-[13px] ml-[13px]">
                <div className="flex-1 opacity-50 text-base text-t-fg">{item.name}</div>
                {item.quantity > 1 && <span className="text-[15px] text-t-muted tabular-nums">×{item.quantity}</span>}
              </div>
            </ShopRow>
          ))}
        </ShopGroup>
      )}

      <button onClick={onRemove} className="block mx-auto mt-6 text-[15px] text-t-muted px-3 py-2 active:opacity-50">
        {t('share.received.remove')}
      </button>
    </>
  )
}
