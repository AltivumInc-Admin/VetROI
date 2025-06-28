const https = require('https');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    };
    
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        // Parse request body
        const body = JSON.parse(event.body);
        const { jobTitle, state } = body;
        
        // Get secrets using the Lambda environment variable approach
        const USAJOBS_API_KEY = process.env.USAJOBS_API_KEY;
        const USAJOBS_EMAIL = process.env.USAJOBS_EMAIL;
        
        if (!USAJOBS_API_KEY || !USAJOBS_EMAIL) {
            throw new Error('Missing API credentials');
        }
        
        // Build USAJOBS API URL
        const searchParams = new URLSearchParams({
            PositionTitle: jobTitle,
            LocationName: state
        });
        
        const options = {
            hostname: 'data.usajobs.gov',
            path: `/api/search?${searchParams.toString()}`,
            method: 'GET',
            headers: {
                'Host': 'data.usajobs.gov',
                'User-Agent': USAJOBS_EMAIL,
                'Authorization-Key': USAJOBS_API_KEY
            }
        };
        
        // Make API request
        const usajobsData = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });
            
            req.on('error', reject);
            req.end();
        });
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(usajobsData)
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to search jobs' })
        };
    }
};