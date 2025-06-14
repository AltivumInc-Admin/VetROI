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

// S3 bucket configuration
const S3_BASE_URL = 'https://altroi-data.s3.amazonaws.com'

export async function fetchSOCData(socCode: string): Promise<any> {
  try {
    const response = await axios.get(`${S3_BASE_URL}/soc-details/${socCode}.json`)
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