import { api, resource } from './client'

export const warehouses = resource('/warehouses')
export const locations = resource('/locations')
export const categories = resource('/categories')
export const partners = resource('/partners')
export const reorderRules = resource('/reorder-rules')
export const products = resource('/products')

const get = (path, params) => api.get(path, { params }).then((res) => res.data)

export const stock = {
  list: (params) => get('/stock', params),
  adjust: (body) => api.post('/stock/adjust', body).then((res) => res.data),
}
export const moves = { list: (params) => get('/moves', params) }
export const dashboard = { kpis: (params) => get('/dashboard/kpis', params) }
export const me = {
  get: () => get('/users/me'),
  update: (body) => api.put('/users/me', body).then((res) => res.data),
}
