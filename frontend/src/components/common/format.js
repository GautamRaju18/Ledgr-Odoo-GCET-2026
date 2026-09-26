export const cx = (...classes) => classes.filter(Boolean).join(' ')

export const fmtQty = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
export const fmtMoney = (n) =>
  Number(n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'INR' })
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '')
