import { api, resource } from './client'

export const pickings = {
  ...resource('/pickings'),
  /** action: 'todo' | 'check-availability' | 'validate' | 'cancel' */
  action: (id, action) => api.post(`/pickings/${id}/${action}`).then((res) => res.data),
}
