# VetROI Correct Configuration

## Production Infrastructure

### API Gateway
- **Correct API URL**: `https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod`
- **API Gateway ID**: `jg5fae61lj`
- **Region**: `us-east-2`

### Lambda Function
- **Function Name**: `VetROI_Recommend`
- **Handler**: `lambda_function.lambda_handler`
- **Runtime**: Python 3.12
- **O*NET Endpoint**: `/online/crosswalks/military` (NOT `/veterans/military`)

### Amplify App
- **App ID**: `d34razwlkdgpdv`
- **App Name**: `VetROI`
- **Production URL**: https://vetroi.altivum.ai
- **Environment Variables**:
  - `VITE_API_URL`: `https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod`
  - `VITE_API_KEY`: `1du0W33OTS3NkLhXJY5R4FOY9LJq6ZB1h7Lrdwig`

### Correct Response Structure
```json
{
  "session_id": "uuid",
  "profile": { /* veteran input */ },
  "onet_careers": {
    "keyword": "18D",
    "branch": "all",
    "total": 1,
    "match": [{
      "code": "18D",
      "title": "Special Forces Medical Sergeant (Army - Enlisted)",
      "occupations": {
        "occupation": [
          /* Array of 25 career objects */
          {
            "code": "11-9111.00",
            "title": "Medical and Health Services Managers",
            "tags": {
              "bright_outlook": true,
              "green": false
            }
          }
        ]
      }
    }]
  },
  "timestamp": "ISO-8601"
}
```

### What NOT to Use
- ❌ API Gateway `yrugnz2sl7` (wrong)
- ❌ `/veterans/military` endpoint (returns different structure)
- ❌ `recommendations` array (old structure with fake data)
- ❌ Bedrock/AI in data collection phase

## Last Known Good State
- Lambda updated: 2025-06-16T16:00:20.000+0000
- Amplify updated: 2025-06-16T11:07:59.298000-05:00
- API returns correct O*NET crosswalk data
- Frontend parses `onet_careers.match[0].occupations.occupation`