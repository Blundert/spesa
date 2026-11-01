export const btnPrimary = {
  background: 'var(--t-accent)',
  color: 'var(--t-on)',
  border: 'none',
  borderRadius: '10px',
  padding: '10px 18px',
  fontSize: '14px',
  cursor: 'pointer',
} as const

export const btnSecondary = {
  background: 'var(--t-bg)',
  color: 'var(--t-fg)',
  border: 'none',
  borderRadius: '10px',
  padding: '10px 18px',
  fontSize: '14px',
  cursor: 'pointer',
} as const

export const btnDanger = { ...btnPrimary, background: 'var(--t-danger)' } as const
