import { api } from './client'

const post = (path, body) => api.post(path, body).then((res) => res.data)

export const signup = (body) => post('/auth/signup', body)
export const login = (body) => post('/auth/login', body)
export const forgotPassword = (body) => post('/auth/forgot-password', body)
export const resetPassword = (body) => post('/auth/reset-password', body)
