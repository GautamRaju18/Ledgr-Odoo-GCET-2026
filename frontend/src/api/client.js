import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

export const auth = {
  token: () => localStorage.getItem('token'),
  save: (token) => localStorage.setItem('token', token),
  clear: () => localStorage.removeItem('token'),
}

api.interceptors.request.use((config) => {
  const token = auth.token()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && auth.token()) {
      auth.clear()
      window.location.assign('/login')
    }
    return Promise.reject(err)
  },
)

/** Human-readable message from an API error ({detail: string | validation list}). */
export function errorMessage(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail))
    return detail.map((d) => d.msg.replace(/^Value error, /, '')).join('. ')
  return 'Something went wrong, please try again'
}

const data = (promise) => promise.then((res) => res.data)

/** list/get/create/update/remove for a REST resource such as '/warehouses'. */
export function resource(path) {
  return {
    list: (params) => data(api.get(path, { params })),
    get: (id) => data(api.get(`${path}/${id}`)),
    create: (body) => data(api.post(path, body)),
    update: (id, body) => data(api.put(`${path}/${id}`, body)),
    remove: (id) => data(api.delete(`${path}/${id}`)),
  }
}
