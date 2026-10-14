import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1')

const api = axios.create({ baseURL: BASE_URL })

export const getRaces      = ()     => api.get('/races')
export const getRace       = (slug) => api.get(`/races/${slug}`)
export const getCandidate  = (slug) => api.get(`/candidates/${slug}`)
export const getYardsticks = ()     => api.get('/yardsticks')

export default api
