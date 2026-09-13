import client from './client'

export const detectPothole = (formData) =>
  client.post('/potholes/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const listPotholes = (params = {}) =>
  client.get('/potholes', { params })

export const getPothole = (id) =>
  client.get(`/potholes/${id}`)

export const updatePothole = (id, data) =>
  client.patch(`/potholes/${id}`, data)

export const getStats = () =>
  client.get('/potholes/stats')
