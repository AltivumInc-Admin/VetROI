# VetROI Local Folder Cleanup Plan
## Comprehensive & Phased Approach

### 🎯 Objectives
1. Remove unnecessary files while preserving production code
2. Reduce repository size for faster cloning
3. Organize remaining files logically
4. Ensure hackathon submission is clean and professional
5. Maintain all working functionality

---

## Phase 1: Safety First (Backup & Document)
**Priority: CRITICAL**
**Time: 10 minutes**

### 1.1 Create Full Backup
```bash
# Create timestamped backup
cp -r /Users/christianperez/Desktop/VetROI /Users/christianperez/Desktop/VetROI_BACKUP_$(date +%Y%m%d_%H%M%S)
```

### 1.2 Document Current State
```bash
# Save current file structure
find . -type f -name "*.py" -o -name "*.ts" -o -name "*.json" | sort > current_files_list.txt

# Check current repo size
du -sh .
git count-objects -vH
```

### 1.3 Verify Git Status
```bash
git status
git stash list
```

---

## Phase 2: Clean Lambda Deployment Artifacts
**Priority: HIGH**
**Time: 20 minutes**
**Potential Size Reduction: ~500MB+**

### 2.1 Remove Lambda Function Zips
**Location**: `/lambda/`
```
Files to DELETE:
- *.zip files (except in lambda-functions/code/ if needed for deployment)
- dd214_insights.zip
- dd214_insights_fixed.zip
- dd214_insights_updated.zip
- dd214_macie.zip
- dd214_macie_fixed.zip
- cors_handler.zip
- emergency_handler.zip
- quick_fix.zip
- real_function.zip
- recommend.zip
- stable_function.zip
- ultra_simple.zip
- working-handler.zip
- deploy-fix.zip
```

### 2.2 Clean Lambda Dependencies
**Location**: Various lambda subdirectories
```
Folders to DELETE:
- /lambda/recommend/package/
- /lambda/recommend/infrastructure/
- /lambda/recommend/real_deploy/ (if not needed)
- /lambda/dd214_*/bin/
- All __pycache__/ directories
```

### 2.3 Remove Duplicate Lambda Code
```
Files to DELETE:
- lambda_function_fixed.py (keep only the working version)
- lambda_function_simple.py
- handler_simple.py
- cors_handler.py
- emergency_handler.py
- ultra_simple.py
```

---

## Phase 3: Clean Infrastructure Files
**Priority: MEDIUM**
**Time: 15 minutes**

### 3.1 CloudFormation Cleanup
**Location**: `/infrastructure/cloudformation/`
```
Files to KEEP:
- Current working templates (phase*.yaml)
- import-resources.json
- PRODUCTION_PHASED_PLAN.md

Files to DELETE:
- test-*.json
- response.json
- deploy-*.sh (old versions)
- *-output.json
- fixed-statemachine*.json (keep only current)
```

### 3.2 Remove Temporary Scripts
**Location**: Root directory
```
Files to DELETE:
- demo_emergency_fix.sh
- emergency-restore.sh
- verify-backup.sh
- generate_architecture_diagram.py
- generate_lambda_focus_diagram.py
```

---

## Phase 4: Clean Frontend Build Artifacts
**Priority: HIGH**
**Time: 10 minutes**
**Potential Size Reduction: ~200MB**

### 4.1 Frontend Cleanup
**Location**: `/frontend/`
```
Folders to DELETE:
- /frontend/dist/ (build output)
- /frontend/node_modules/ (can be regenerated with npm install)

Files to DELETE:
- Any .map files
- Any .log files
```

---

## Phase 5: Documentation Consolidation
**Priority: LOW**
**Time: 15 minutes**

### 5.1 Consolidate Documentation
```
Files to REVIEW and possibly MERGE:
- Multiple *_PLAN.md files
- Multiple *_STATUS.md files
- Multiple *_COMPLETE.md files

Keep only:
- README.md
- CLAUDE.md
- LICENSE
- Key architecture docs
```

### 5.2 Archive Old Plans
```
Create: /docs/archive/
Move old planning documents there
```

---

## Phase 6: Clean Development Artifacts
**Priority: MEDIUM**
**Time: 10 minutes**

### 6.1 Remove IDE and OS Files
```
Files to DELETE:
- .DS_Store (all instances)
- *.swp, *.swo
- .idea/
- .vscode/
- *.pyc
- __pycache__/
```

### 6.2 Clean Test/Response Files
```
Files to DELETE:
- response.json (all instances)
- response_*.json
- test-*.json
- *.tmp
```

---

## Phase 7: Repository Optimization
**Priority: LOW**
**Time: 20 minutes**

### 7.1 Large File Analysis
```bash
# Find files larger than 1MB
find . -type f -size +1M -exec ls -lh {} \; | awk '{print $5, $9}' | sort -hr

# Find folders larger than 10MB
du -sh */ | sort -hr | head -20
```

### 7.2 Git History Cleanup (OPTIONAL - RISKY)
```bash
# Only if absolutely needed - removes large files from history
# WARNING: This rewrites history!
# git filter-branch --tree-filter 'rm -rf path/to/large/files' HEAD
```

---

## Phase 8: Final Organization
**Priority: HIGH**
**Time: 15 minutes**

### 8.1 Recommended Final Structure
```
VetROI/
├── README.md                    # Hackathon submission
├── CLAUDE.md                    # Development docs
├── LICENSE
├── .gitignore
├── frontend/                    # React app (no node_modules)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── lambda/                      # Lambda functions (clean)
│   ├── recommend/
│   ├── dd214_parser/
│   ├── dd214_insights/
│   └── shared/requirements.txt
├── infrastructure/              # IaC templates
│   ├── cloudformation/
│   └── cost-tracking.yaml
├── docs/                        # Documentation
│   ├── architecture/
│   └── archive/
├── scripts/                     # Utility scripts
│   └── track_dd214_costs.py
└── sam-templates/              # SAM deployment
    ├── template.yaml
    └── statemachine/
```

---

## Phase 9: Validation
**Priority: CRITICAL**
**Time: 10 minutes**

### 9.1 Test Critical Functionality
```bash
# Ensure nothing broke
npm --prefix frontend install
npm --prefix frontend run build

# Check Lambda packages still work
cd lambda/recommend && python -m src.handler
```

### 9.2 Final Git Checks
```bash
# Add cleaned files
git add -A
git status

# Check final size
du -sh .
git count-objects -vH

# Commit
git commit -m "Pre-hackathon cleanup: Remove build artifacts and temporary files"
```

---

## Phase 10: Final Checklist
**Before Pushing to GitHub**

- [ ] Backup created and verified
- [ ] All .zip files removed (except essential)
- [ ] No node_modules in repo
- [ ] No __pycache__ directories
- [ ] No temporary response.json files
- [ ] No .DS_Store files
- [ ] README.md is polished
- [ ] Architecture diagrams referenced
- [ ] All sensitive data removed
- [ ] .gitignore updated
- [ ] Final size under 100MB (ideally under 50MB)

---

## Estimated Impact

### Size Reduction
- Lambda zips: ~300MB
- node_modules: ~200MB
- Build artifacts: ~50MB
- Dependencies: ~100MB
- **Total Potential Reduction: ~650MB**

### File Count Reduction
- Current: ~4,000+ files
- Target: <500 files
- **Reduction: ~87%**

---

## Emergency Rollback
If anything goes wrong:
```bash
# Restore from backup
rm -rf /Users/christianperez/Desktop/VetROI
cp -r /Users/christianperez/Desktop/VetROI_BACKUP_[timestamp] /Users/christianperez/Desktop/VetROI
cd /Users/christianperez/Desktop/VetROI
```

---

**Ready to proceed? Start with Phase 1 (Backup) before any deletions!**