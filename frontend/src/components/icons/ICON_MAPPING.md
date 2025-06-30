# DD214 Insights Icon Mapping Guide

## Navigation Icons (Tier 1 - SVG)

| Current Emoji | New Icon | Description | Implementation |
|--------------|----------|-------------|----------------|
| 🎯 | Target/Crosshair | Executive Summary | `<ExecutiveSummaryIcon />` |
| 💼 | Briefcase | Career Intelligence | `<CareerIntelligenceIcon />` |
| ⭐ | Star Badge | Leadership Profile | `<LeadershipProfileIcon />` |
| 🚀 | Action Arrow | Action Center | `<ActionCenterIcon />` |
| 🧠 | Mind/Head | Psychological Preparation | `<PsychologicalPrepIcon />` |
| 📅 | Calendar Grid | Timeline & Roadmap | `<TimelineRoadmapIcon />` |
| 🌐 | Globe | 3D Geo-Intelligence | `<GeoIntelligenceIcon />` |
| 📜 | Document Scroll | Legacy Intelligence | `<LegacyIntelligenceIcon />` |
| 📝 | Document Report | Extended Summary | `<ExtendedSummaryIcon />` |
| 🤖 | Processor Chip | AI Prompt Generator | `<AIPromptGeneratorIcon />` |
| 🔙 | Chevron Left | Back Navigation | `<BackNavigationIcon />` |

## Content Icons (Tier 2 - Unicode/SVG)

| Current Emoji | Replacement | Usage Context |
|--------------|-------------|---------------|
| 💰 | $ or SVG | Salary/Compensation |
| 📍 | ▪ or SVG | Location markers |
| 💡 | ◆ or SVG | Tips/Ideas |
| 🎖️ | ★ or SVG | Military honors |
| 🏆 | ▲ | Achievements |
| 🤝 | ⬥ | Networking |
| 📧 | ✉ | Email |
| ✓ | ✓ | Checkmarks |
| ⚡ | ► | Quick/Fast |
| 🏢 | ■ | Companies |

## Section Headers (Tier 3 - Typography)

| Current | Replacement | Description |
|---------|-------------|-------------|
| 🎯 Quick Win Tracker | ▸ Quick Win Tracker | Section headers |
| 💡 Pro Tips | ◆ Pro Tips | Tip sections |
| 🏆 Milestone Celebrations | ■ Milestone Celebrations | Achievement sections |

## Implementation Priority

### Phase 1: Navigation Menu (Immediate)
1. Replace all navigation menu emojis with SVG icons
2. Update `DD214InsightsView.tsx` navigation array
3. Test hover states and accessibility

### Phase 2: High-Visibility Content (Next)
1. Executive Summary leverage points
2. Career Intelligence salary indicators
3. Action Center buttons
4. Timeline phase markers

### Phase 3: Supporting Elements (Final)
1. Category filters in Geo-Intelligence
2. AI Prompt Generator categories
3. PDF generation icons
4. Minor UI indicators

## Design Principles

1. **Consistency**: All icons use same stroke width (2px) and style
2. **Scalability**: SVG icons work at any size
3. **Accessibility**: Icons include proper ARIA labels
4. **Performance**: Icons are lightweight React components
5. **Flexibility**: Easy to update colors via props

## Color Scheme

- Primary: `currentColor` (inherits from parent)
- Hover: Slightly brighter version
- Active: Accent color (#00d4ff)
- Disabled: 50% opacity

## Usage Example

```tsx
import { ExecutiveSummaryIcon } from '../icons/IconLibrary'

// Basic usage
<ExecutiveSummaryIcon />

// With custom size and color
<ExecutiveSummaryIcon size={24} color="#00d4ff" />

// With className
<ExecutiveSummaryIcon className="nav-icon" />
```