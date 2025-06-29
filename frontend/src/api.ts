import axios from 'axios'
import { VeteranRequest, RecommendationResponse } from './types'
import { DataCache } from './utils/cache'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod'
const API_KEY = import.meta.env.VITE_API_KEY || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
})

export async function getRecommendations(request: VeteranRequest): Promise<RecommendationResponse> {
  const response = await api.post<RecommendationResponse>('/recommend', request)
  return response.data
}

export async function getDD214PresignedUrl(
  fileName: string, 
  fileType: string, 
  _veteranId: string
): Promise<{ uploadUrl: string; documentId: string }> {
  // Get the current user's JWT token
  const { fetchAuthSession } = await import('aws-amplify/auth');
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.post(
    'https://wzj49zuaaa.execute-api.us-east-2.amazonaws.com/prod/dd214/upload-url',
    {
      filename: fileName,
      fileType: fileType
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return data;
}

export async function uploadDD214ToS3(uploadUrl: string, file: File): Promise<void> {
  // Simple PUT request with just the file and content type
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type
    }
  })
}

export async function getDD214Status(documentId: string): Promise<any> {
  const { data } = await axios.get(
    `https://wzj49zuaaa.execute-api.us-east-2.amazonaws.com/prod/dd214/status/${documentId}`,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return data;
}

export async function getDD214Insights(documentId: string): Promise<any> {
  const { data } = await axios.get(
    `https://wzj49zuaaa.execute-api.us-east-2.amazonaws.com/prod/dd214/insights/${documentId}`,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return data;
}

export async function getRedactedDocument(documentId: string): Promise<any> {
  const { data } = await axios.get(
    `https://wzj49zuaaa.execute-api.us-east-2.amazonaws.com/prod/dd214/redacted/${documentId}`,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return data;
}

// Career data is fetched through our Lambda proxy to handle authentication

export async function fetchSOCData(socCode: string): Promise<any> {
  try {
    // Check cache first
    const cacheKey = `soc_${socCode}`
    const cached = DataCache.get(cacheKey)
    if (cached) {
      console.log(`Using cached data for SOC ${socCode}`)
      return cached
    }
    
    // Call our Lambda endpoint instead of O*NET directly (same pattern as getRecommendations)
    const response = await api.get(`/career/${socCode}`)
    
    // Cache the response
    if (response.data) {
      DataCache.set(cacheKey, response.data)
    }
    
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

// Sentra AI Career Counselor
export async function sentraConversation(params: {
  sessionId: string
  message: string
  veteranContext: any
  conversationId?: string
}): Promise<{
  conversationId: string
  response: string
  timestamp: string
}> {
  const { data } = await api.post('/sentra/conversation', params)
  return data
}

// DD214 Insights
export async function getDD214InsightsData(documentId: string): Promise<any> {
  const { data } = await axios.get(
    `https://wzj49zuaaa.execute-api.us-east-2.amazonaws.com/prod/dd214/insights/${documentId}`,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return data;
}