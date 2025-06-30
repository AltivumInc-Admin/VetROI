import React from 'react'

// Professional SVG Icon Components for DD214 Insights

interface IconProps {
  size?: number
  color?: string
  className?: string
}

// Executive Summary - Target/Crosshair Icon
export const ExecutiveSummaryIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke={color} strokeWidth="2"/>
  </svg>
)

// Career Intelligence - Briefcase Icon
export const CareerIntelligenceIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke={color} strokeWidth="2"/>
    <path d="M12 11V13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M2 11H22" stroke={color} strokeWidth="2"/>
  </svg>
)

// Leadership Profile - Star/Badge Icon
export const LeadershipProfileIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L14.09 8.26L21 9.27L16.5 13.14L17.81 20L12 16.77L6.19 20L7.5 13.14L3 9.27L9.91 8.26L12 2Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
  </svg>
)

// Action Center - Rocket/Arrow Icon
export const ActionCenterIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 12L19 12M19 12L12 5M19 12L12 19" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="5" cy="12" r="2" fill={color}/>
  </svg>
)

// Psychological Preparation - Brain/Mind Icon
export const PsychologicalPrepIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C7.58172 2 4 5.58172 4 10C4 14.4183 7.58172 18 12 18C16.4183 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2Z" 
      stroke={color} 
      strokeWidth="2"
    />
    <path d="M8 10C8 10 9.5 12 12 12C14.5 12 16 10 16 10" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path d="M12 18V22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 21H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Timeline & Roadmap - Calendar/Timeline Icon
export const TimelineRoadmapIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M3 9H21" stroke={color} strokeWidth="2"/>
    <path d="M8 2V6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 2V6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="8" cy="14" r="1" fill={color}/>
    <circle cx="12" cy="14" r="1" fill={color}/>
    <circle cx="16" cy="14" r="1" fill={color}/>
    <path d="M8 18H16" stroke={color} strokeWidth="1"/>
  </svg>
)

// Geo-Intelligence - Globe Icon
export const GeoIntelligenceIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="2"/>
    <path d="M2 12H22" stroke={color} strokeWidth="2"/>
    <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke={color} strokeWidth="2"/>
    <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke={color} strokeWidth="2"/>
  </svg>
)

// Legacy Intelligence - Scroll/Document Icon
export const LegacyIntelligenceIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L16 4H6C4.89543 4 4 4.89543 4 6Z" 
      stroke={color} 
      strokeWidth="2"
    />
    <path d="M16 4V8H20" stroke={color} strokeWidth="2"/>
    <path d="M8 12H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 16H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Extended Summary - Document/Report Icon
export const ExtendedSummaryIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M8 6H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 10H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 14H12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <rect x="8" y="17" width="8" height="2" fill={color} opacity="0.3"/>
  </svg>
)

// AI Prompt Generator - Processor/Chip Icon
export const AIPromptGeneratorIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="6" y="6" width="12" height="12" rx="2" stroke={color} strokeWidth="2"/>
    <rect x="9" y="9" width="6" height="6" rx="1" fill={color} opacity="0.3"/>
    <path d="M9 2V6M15 2V6M9 18V22M15 18V22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M2 9H6M18 9H22M2 15H6M18 15H22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Back Navigation - Chevron Left Icon
export const BackNavigationIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M15 19L8 12L15 5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

// Utility Icons for Content

// Money/Salary Icon
export const SalaryIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <path d="M12 6V18" stroke={color} strokeWidth="2"/>
    <path d="M9 9C9 9 10 8 12 8C14 8 15 9 15 10.5C15 12 14 13 12 13C10 13 9 14 9 15.5C9 17 10 18 12 18C14 18 15 17 15 17" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
)

// Location/Pin Icon
export const LocationIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C8.13401 2 5 5.13401 5 9C5 13.5 12 22 12 22C12 22 19 13.5 19 9C19 5.13401 15.866 2 12 2Z" 
      stroke={color} 
      strokeWidth="2"
    />
    <circle cx="12" cy="9" r="3" stroke={color} strokeWidth="2"/>
  </svg>
)

// Tip/Lightbulb Icon
export const TipIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C8.68629 2 6 4.68629 6 8C6 10.2208 7.2066 12.1599 9 13.1973V18C9 19.1046 9.89543 20 11 20H13C14.1046 20 15 19.1046 15 18V13.1973C16.7934 12.1599 18 10.2208 18 8C18 4.68629 15.3137 2 12 2Z" 
      stroke={color} 
      strokeWidth="2"
    />
    <path d="M9 18H15" stroke={color} strokeWidth="2"/>
    <path d="M10 21H14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Achievement/Medal Icon
export const AchievementIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor',
  className = ''
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="9" r="7" stroke={color} strokeWidth="2"/>
    <path d="M12 6L13.09 8.26L15.5 8.5L13.75 10.14L14.18 12.5L12 11.27L9.82 12.5L10.25 10.14L8.5 8.5L10.91 8.26L12 6Z" 
      fill={color} 
      opacity="0.3"
    />
    <path d="M7 14L6 22L12 19L18 22L17 14" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

// Icon mapping utility
export const iconMap = {
  '🎯': ExecutiveSummaryIcon,
  '💼': CareerIntelligenceIcon,
  '⭐': LeadershipProfileIcon,
  '🚀': ActionCenterIcon,
  '🧠': PsychologicalPrepIcon,
  '📅': TimelineRoadmapIcon,
  '🌐': GeoIntelligenceIcon,
  '📜': LegacyIntelligenceIcon,
  '📝': ExtendedSummaryIcon,
  '🤖': AIPromptGeneratorIcon,
  '🔙': BackNavigationIcon,
  '💰': SalaryIcon,
  '📍': LocationIcon,
  '💡': TipIcon,
  '🎖️': AchievementIcon
}

// Helper function to get icon by emoji
export const getIconByEmoji = (emoji: string): React.FC<IconProps> | null => {
  return iconMap[emoji as keyof typeof iconMap] || null
}