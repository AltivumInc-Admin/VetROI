const https = require('https');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const client = new SecretsManagerClient({ region: 'us-east-2' });

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
        
        // Get API key from Secrets Manager
        const command = new GetSecretValueCommand({
            SecretId: 'arn:aws:secretsmanager:us-east-2:205930636302:secret:usa-ExiNQ2'
        });
        
        const secretData = await client.send(command);
        const { USAJOBS_API_KEY, USAJOBS_EMAIL } = JSON.parse(secretData.SecretString);
        
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