import axios from 'axios'
import { VeteranRequest, RecommendationResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function getRecommendations(request: VeteranRequest): Promise<RecommendationResponse> {
  const response = await api.post<RecommendationResponse>('/recommend', request)
  return response.data
}

export async function uploadDD214(file: File): Promise<string> {
  // Get pre-signed URL
  const { data } = await api.put('/upload-dd214', {
    filename: file.name
  })
  
  // Upload file to S3
  await axios.put(data.uploadUrl, file, {
    headers: {
      'Content-Type': file.type
    }
  })
  
  return data.fileId
}