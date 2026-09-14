import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL
const apiBaseUrl = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/$/, '')}/api`
  : '/api'

const client = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
})

// Global error normalizer
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

export default client

export { apiBaseUrl }
