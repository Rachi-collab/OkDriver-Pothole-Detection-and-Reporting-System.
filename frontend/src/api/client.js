import axios from 'axios'

const BASE_URL = 'https://okdriver-backend.onrender.com/api'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

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