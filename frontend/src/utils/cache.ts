// Cache utilities for O*NET data
const CACHE_PREFIX = 'vetroi_cache_'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface CacheItem<T> {
  data: T
  timestamp: number
}

export class DataCache {
  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key)
      if (!cached) return null
      
      const item: CacheItem<T> = JSON.parse(cached)
      const now = Date.now()
      
      // Check if cache is expired
      if (now - item.timestamp > CACHE_DURATION) {
        this.remove(key)
        return null
      }
      
      return item.data
    } catch (error) {
      console.error('Cache read error:', error)
      return null
    }
  }
  
  static set<T>(key: string, data: T): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
    } catch (error) {
      console.error('Cache write error:', error)
      // If localStorage is full, clear old entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldEntries()
        // Try once more
        try {
          localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }))
        } catch {
          // Give up if still failing
        }
      }
    }
  }
  
  static remove(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key)
  }
  
  static clearAll(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
  
  static clearOldEntries(): void {
    const keys = Object.keys(localStorage)
    const now = Date.now()
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}')
          if (item.timestamp && now - item.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key)
          }
        } catch {
          // Remove corrupted entries
          localStorage.removeItem(key)
        }
      }
    })
  }
}

// Session storage for temporary data
export class SessionCache {
  static get<T>(key: string): T | null {
    try {
      const cached = sessionStorage.getItem(CACHE_PREFIX + key)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }
  
  static set<T>(key: string, data: T): void {
    try {
      sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data))
    } catch (error) {
      console.error('Session cache write error:', error)
    }
  }
  
  static remove(key: string): void {
    sessionStorage.removeItem(CACHE_PREFIX + key)
  }
}