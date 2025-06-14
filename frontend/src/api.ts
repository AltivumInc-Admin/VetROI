import axios from 'axios'
import { VeteranRequest, RecommendationResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod'

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

// Career data is fetched through our Lambda proxy to handle authentication

export async function fetchSOCData(socCode: string): Promise<any> {
  try {
    // Call our Lambda endpoint instead of O*NET directly (same pattern as getRecommendations)
    const response = await api.get(`/career/${socCode}`)
    
    // The Lambda already adds the SOC code and title
    return response.data
  } catch (error) {
    console.error(`Failed to fetch data for SOC ${socCode}:`, error)
    return null
  }
}

export async function fetchMultipleSOCData(socCodes: string[]): Promise<Record<string, any>> {
  const promises = socCodes.map(code => 
    fetchSOCData(code).then(data => ({ code, data }))
  )
  
  const results = await Promise.all(promises)
  
  return results.reduce((acc, { code, data }) => {
    if (data) {
      acc[code] = data
    }
    return acc
  }, {} as Record<string, any>)
}