// Military Occupational Specialty (MOS) Translation Utility
// Maps military codes to human-readable titles

interface MilitaryCode {
  code: string
  title: string
  branch: string
}

// Common military codes by branch
const militaryCodes: MilitaryCode[] = [
  // Army MOS
  { code: '11B', title: 'Infantry Soldier', branch: 'Army' },
  { code: '11C', title: 'Indirect Fire Infantryman', branch: 'Army' },
  { code: '12B', title: 'Combat Engineer', branch: 'Army' },
  { code: '13F', title: 'Fire Support Specialist', branch: 'Army' },
  { code: '15W', title: 'Unmanned Aircraft Systems Operator', branch: 'Army' },
  { code: '18D', title: 'Special Forces Medical Sergeant', branch: 'Army' },
  { code: '25B', title: 'Information Technology Specialist', branch: 'Army' },
  { code: '31B', title: 'Military Police', branch: 'Army' },
  { code: '35S', title: 'Signals Intelligence Analyst', branch: 'Army' },
  { code: '68W', title: 'Combat Medic Specialist', branch: 'Army' },
  { code: '88M', title: 'Motor Transport Operator', branch: 'Army' },
  { code: '91B', title: 'Wheeled Vehicle Mechanic', branch: 'Army' },
  
  // Navy Ratings
  { code: 'HM', title: 'Hospital Corpsman', branch: 'Navy' },
  { code: 'IT', title: 'Information Systems Technician', branch: 'Navy' },
  { code: 'MA', title: 'Master-at-Arms', branch: 'Navy' },
  { code: 'MM', title: 'Machinist\'s Mate', branch: 'Navy' },
  { code: 'BM', title: 'Boatswain\'s Mate', branch: 'Navy' },
  { code: 'ET', title: 'Electronics Technician', branch: 'Navy' },
  { code: 'AT', title: 'Aviation Electronics Technician', branch: 'Navy' },
  { code: 'GM', title: 'Gunner\'s Mate', branch: 'Navy' },
  
  // Air Force AFSC
  { code: '1N0X1', title: 'Operations Intelligence', branch: 'Air Force' },
  { code: '1N4X1', title: 'Fusion Analyst', branch: 'Air Force' },
  { code: '2A3X3', title: 'Tactical Aircraft Maintenance', branch: 'Air Force' },
  { code: '3D0X2', title: 'Cyber Systems Operations', branch: 'Air Force' },
  { code: '3D1X2', title: 'Cyber Transport Systems', branch: 'Air Force' },
  { code: '3E7X1', title: 'Fire Protection', branch: 'Air Force' },
  { code: '3P0X1', title: 'Security Forces', branch: 'Air Force' },
  { code: '4N0X1', title: 'Aerospace Medical Service', branch: 'Air Force' },
  { code: '4A2X1', title: 'Biomedical Equipment', branch: 'Air Force' },
  
  // Marines MOS
  { code: '0311', title: 'Rifleman', branch: 'Marines' },
  { code: '0331', title: 'Machine Gunner', branch: 'Marines' },
  { code: '0341', title: 'Mortarman', branch: 'Marines' },
  { code: '0351', title: 'Infantry Assault Marine', branch: 'Marines' },
  { code: '0651', title: 'Cyber Network Operator', branch: 'Marines' },
  { code: '0861', title: 'Fire Support Marine', branch: 'Marines' },
  { code: '1371', title: 'Combat Engineer', branch: 'Marines' },
  { code: '5811', title: 'Military Police', branch: 'Marines' },
  
  // Coast Guard
  { code: 'BM', title: 'Boatswain\'s Mate', branch: 'Coast Guard' },
  { code: 'MK', title: 'Machinery Technician', branch: 'Coast Guard' },
  { code: 'IT', title: 'Information Systems Technician', branch: 'Coast Guard' },
  { code: 'ME', title: 'Maritime Enforcement Specialist', branch: 'Coast Guard' },
  { code: 'HS', title: 'Health Services Technician', branch: 'Coast Guard' },
  
  // Space Force
  { code: '1C6X1', title: 'Space Systems Operations', branch: 'Space Force' },
  { code: '5S0X1', title: 'Space Systems Specialist', branch: 'Space Force' },
  { code: '13S', title: 'Space Operations Officer', branch: 'Space Force' },
]

export function translateMOS(code: string, branch?: string): string | null {
  if (!code) return null
  
  // Normalize the code (uppercase, remove spaces)
  const normalizedCode = code.toUpperCase().trim()
  
  // First, try exact match
  let match = militaryCodes.find(mc => 
    mc.code.toUpperCase() === normalizedCode &&
    (!branch || mc.branch.toLowerCase() === branch.toLowerCase())
  )
  
  // If no exact match and branch provided, try without branch filter
  if (!match && branch) {
    match = militaryCodes.find(mc => mc.code.toUpperCase() === normalizedCode)
  }
  
  // If still no match, try partial match (for shortened codes)
  if (!match) {
    match = militaryCodes.find(mc => 
      mc.code.toUpperCase().startsWith(normalizedCode) ||
      normalizedCode.startsWith(mc.code.toUpperCase())
    )
  }
  
  return match ? match.title : null
}

export function getBranchFromMOS(code: string): string | null {
  const normalizedCode = code.toUpperCase().trim()
  const match = militaryCodes.find(mc => mc.code.toUpperCase() === normalizedCode)
  return match ? match.branch : null
}

// Import state data
import { US_STATES } from '../types'

// Format the profile summary
export function formatProfileSummary(
  branch: string,
  mosCode: string,
  stateCode: string,
  relocate: boolean
): string {
  const mosTitle = translateMOS(mosCode, branch)
  const mosDisplay = mosTitle ? `${mosTitle} (${mosCode})` : mosCode
  
  // Get full state name from code
  const state = US_STATES.find(s => s.code === stateCode)?.name || stateCode
  
  const relocateText = relocate 
    ? 'and are open to relocating for the right opportunity' 
    : `and prefer to stay in ${state}`
  
  // Format branch name properly
  const branchDisplay = branch.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  return `You served in the ${branchDisplay} as a ${mosDisplay}. You're currently in ${state} ${relocateText}.`
}