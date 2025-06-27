# CSS Refactoring Plan for VetROI

## Current Issues
1. **Theme Conflicts**: App.css contains light blue theme that conflicts with DarkTheme.css
2. **Specificity Wars**: DarkTheme.css uses `!important` everywhere to override App.css
3. **Mixed Concerns**: Structure and theme are mixed in the same files
4. **Maintenance Difficulty**: Hard to update theme without breaking layout

## Proposed Solution

### File Structure
```
src/styles/
├── App.structure.css    # Layout, spacing, structure ONLY
├── App.theme.css       # Theme application to structural elements
├── DarkTheme.css       # Theme variables and global overrides
├── components/         # Component-specific styles
└── index.css          # Global resets and base styles
```

### Implementation Steps

#### Step 1: Backup Current Files
```bash
cp src/styles/App.css src/styles/App.css.backup
cp src/styles/DarkTheme.css src/styles/DarkTheme.css.backup
```

#### Step 2: Split App.css
- Move all structural styles to `App.structure.css`
- Move all theme/color styles to `App.theme.css`
- Remove conflicting styles

#### Step 3: Clean up DarkTheme.css
- Remove unnecessary `!important` declarations
- Keep only global theme variables and overrides
- Ensure it plays nicely with App.theme.css

#### Step 4: Update imports in App.tsx
```typescript
// Replace
import './styles/App.css'

// With
import './styles/App.structure.css'
import './styles/App.theme.css'
```

## Benefits
1. **Clear Separation**: Structure vs Theme
2. **Easy Theme Switching**: Could add light theme by swapping App.theme.css
3. **No More !important**: Proper cascade without specificity battles
4. **Better Maintenance**: Know exactly where to make changes
5. **Performance**: Smaller, more focused CSS files

## What Changes for Other Developer
- The dark theme will be MORE consistent, not less
- No visual changes to the app
- Easier to maintain and extend
- Can still enhance glassmorphism effects in App.theme.css

## Testing Checklist
- [ ] All pages render correctly
- [ ] Dark theme is consistent throughout
- [ ] No flash of unstyled content
- [ ] Mobile responsive styles work
- [ ] Form inputs maintain dark theme
- [ ] Navigation buttons styled correctly
- [ ] Career planner maintains theme