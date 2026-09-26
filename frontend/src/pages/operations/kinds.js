/** URL segment -> how that operation type looks and behaves. */
export const KINDS = {
  receipts: {
    type: 'receipt',
    title: 'Receipts',
    single: 'Receipt',
    partnerLabel: 'Receive From',
    partnerType: 'vendor',
    source: false,
    dest: true,
  },
  deliveries: {
    type: 'delivery',
    title: 'Delivery Orders',
    single: 'Delivery',
    partnerLabel: 'Deliver To',
    partnerType: 'customer',
    source: true,
    dest: false,
  },
  transfers: {
    type: 'internal',
    title: 'Internal Transfers',
    single: 'Internal Transfer',
    partnerLabel: 'Contact',
    partnerType: null,
    source: true,
    dest: true,
  },
}

export const STATUS = {
  draft: { label: 'Draft', tone: 'gray' },
  waiting: { label: 'Waiting', tone: 'amber' },
  ready: { label: 'Ready', tone: 'blue' },
  done: { label: 'Done', tone: 'green' },
  canceled: { label: 'Canceled', tone: 'red' },
}

export const FLOW = {
  receipt: ['draft', 'ready', 'done'],
  delivery: ['draft', 'waiting', 'ready', 'done'],
  internal: ['draft', 'ready', 'done'],
}

export const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local

export const isLate = (p) => !['done', 'canceled'].includes(p.status) && p.schedule_date < today()
