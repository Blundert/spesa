export const action = {
  padding: '10px 18px',
  borderRadius: '10px',
  border: '1px solid var(--t-line2)',
  background: 'var(--t-surface)',
  color: 'var(--t-fg)',
  fontSize: '14px',
  cursor: 'pointer',
}

export const primary = { ...action, background: 'var(--t-accent)', color: 'var(--t-on)', border: '1px solid var(--t-fg)' }
export const danger = { ...action, color: 'var(--t-danger)', border: '1px solid var(--t-danger)' }

export const input = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid var(--t-line2)',
  background: 'var(--t-surface)',
  fontSize: '14px',
  color: 'var(--t-fg)',
  outline: 'none',
}
