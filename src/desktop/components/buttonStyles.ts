export const btnPrimary = {
  background: '#2A2A2C',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '10px 18px',
  fontSize: '14px',
  cursor: 'pointer',
} as const

export const btnSecondary = {
  background: '#F2F2F0',
  color: '#2A2A2C',
  border: 'none',
  borderRadius: '10px',
  padding: '10px 18px',
  fontSize: '14px',
  cursor: 'pointer',
} as const

export const btnDanger = { ...btnPrimary, background: '#D14343' } as const
