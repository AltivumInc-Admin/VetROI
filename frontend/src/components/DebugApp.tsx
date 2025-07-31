import { useEffect } from 'react'

export const DebugApp = () => {
  useEffect(() => {
    console.log('DebugApp mounted')
    console.log('Window location:', window.location.pathname)
    console.log('App container:', document.querySelector('.App'))
    console.log('Main container:', document.querySelector('.app-main'))
    console.log('Flow container:', document.querySelector('.vertical-flow-container'))
    console.log('Section wrappers:', document.querySelectorAll('.section-wrapper'))
  }, [])
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'red', 
      color: 'white', 
      padding: '10px',
      zIndex: 9999 
    }}>
      Debug: App Loaded
    </div>
  )
}