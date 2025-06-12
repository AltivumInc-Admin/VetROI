import json
import os
import pytest
from unittest.mock import Mock, patch, MagicMock

# Set environment variables before importing handler
os.environ['TABLE_NAME'] = 'test-table'
os.environ['BEDROCK_MODEL_ID'] = 'test-model'
os.environ['ONET_API_URL'] = 'https://test.api'
os.environ['ONET_SECRET_NAME'] = 'test-secret'

from src.handler import lambda_handler
from src.models import VeteranRequest, Career


@pytest.fixture
def api_gateway_event():
    """Generate API Gateway event"""
    return {
        'body': json.dumps({
            'branch': 'army',
            'code': '11B',
            'homeState': 'TX',
            'relocate': False,
            'education': 'bachelor'
        }),
        'headers': {
            'Content-Type': 'application/json'
        },
        'httpMethod': 'POST',
        'path': '/recommend'
    }


@pytest.fixture
def mock_onet_data():
    """Mock O*NET data response"""
    return {
        'military_code': '11B',
        'careers': [
            {
                'soc': '11-1011.00',
                'title': 'Chief Executive',
                'description': 'Plan, direct, or coordinate activities',
                'median_salary': 130000,
                'tasks': ['Task 1', 'Task 2'],
                'skills': ['Leadership', 'Communication']
            }
        ]
    }


@pytest.fixture
def mock_careers():
    """Mock career recommendations"""
    return [
        Career(
            title='Project Manager',
            soc='11-9199.00',
            summary='Lead projects and teams',
            medianSalary=95000,
            matchReason='Your military leadership experience',
            nextStep='Get PMP certification'
        )
    ] * 5


class TestLambdaHandler:
    
    @patch('src.handler.ONetClient')
    @patch('src.handler.BedrockClient')
    @patch('src.handler.table')
    def test_successful_recommendation(self, mock_table, mock_bedrock_class, mock_onet_class, 
                                     api_gateway_event, mock_onet_data, mock_careers):
        """Test successful recommendation generation"""
        
        # Setup mocks
        mock_onet = Mock()
        mock_onet.get_career_data.return_value = mock_onet_data
        mock_onet_class.return_value = mock_onet
        
        mock_bedrock = Mock()
        mock_bedrock.generate_recommendations.return_value = mock_careers
        mock_bedrock_class.return_value = mock_bedrock
        
        mock_table.put_item = Mock()
        
        # Call handler
        response = lambda_handler(api_gateway_event, None)
        
        # Assertions
        assert response['statusCode'] == 200
        assert 'application/json' in response['headers']['Content-Type']
        
        body = json.loads(response['body'])
        assert 'session_id' in body
        assert 'recommendations' in body
        assert len(body['recommendations']) == 5
        
        # Verify calls
        mock_onet.get_career_data.assert_called_once_with('11B', 'TX')
        mock_bedrock.generate_recommendations.assert_called_once()
        mock_table.put_item.assert_called_once()
    
    
    def test_invalid_request(self, api_gateway_event):
        """Test handling of invalid request"""
        
        # Invalid branch
        api_gateway_event['body'] = json.dumps({
            'branch': 'invalid_branch',
            'code': '11B',
            'homeState': 'TX',
            'relocate': False,
            'education': 'bachelor'
        })
        
        response = lambda_handler(api_gateway_event, None)
        
        assert response['statusCode'] == 400
        assert 'error' in json.loads(response['body'])
    
    
    def test_missing_body(self):
        """Test handling of missing request body"""
        
        event = {
            'headers': {'Content-Type': 'application/json'},
            'httpMethod': 'POST',
            'path': '/recommend'
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 400
    
    
    @patch('src.handler.ONetClient')
    @patch('src.handler.table')
    def test_bedrock_failure(self, mock_table, mock_onet_class, api_gateway_event, mock_onet_data):
        """Test handling of Bedrock failure"""
        
        # Setup mocks
        mock_onet = Mock()
        mock_onet.get_career_data.return_value = mock_onet_data
        mock_onet_class.return_value = mock_onet
        
        # Simulate Bedrock failure
        with patch('src.handler.BedrockClient') as mock_bedrock_class:
            mock_bedrock_class.side_effect = Exception('Bedrock error')
            
            response = lambda_handler(api_gateway_event, None)
            
            assert response['statusCode'] == 500
            assert 'error' in json.loads(response['body'])