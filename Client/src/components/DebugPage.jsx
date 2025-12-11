import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const DebugPage = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  const addResult = (test, success, message, data = null) => {
    const result = {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  const testAPIEndpoints = async () => {
    setLoading(true);
    setTestResults([]);

    // Test 1: Basic health check
    try {
      const response = await api.get('/api/test');
      addResult('Health Check', true, 'API is reachable', response.data);
    } catch (error) {
      addResult('Health Check', false, error.message);
    }

    // Test 2: Authentication status
    try {
      const response = await api.get('/api/users/me');
      addResult('Auth Check', true, 'User authenticated', response.data);
    } catch (error) {
      addResult('Auth Check', false, error.response?.data?.message || error.message);
    }

    // Test 3: Fetch notes
    try {
      const response = await api.get('/api/notes');
      addResult('Fetch Notes', true, `Found ${response.data.notes.length} notes`, response.data);
    } catch (error) {
      addResult('Fetch Notes', false, error.response?.data?.message || error.message);
    }

    // Test 4: AI Chat
    try {
      const response = await api.post('/api/ai/chat', {
        message: 'Hello, test message'
      });
      addResult('AI Chat', true, 'AI responded successfully', response.data);
    } catch (error) {
      addResult('AI Chat', false, error.response?.data?.message || error.message);
    }

    // Test 5: Create test note
    try {
      const testNote = {
        title: `Debug Test Note ${Date.now()}`,
        content: 'This is a test note created from debug page',
        type: 'text',
        tags: ['debug', 'test']
      };
      
      const response = await api.post('/api/notes', testNote);
      addResult('Create Note', true, 'Note created successfully', response.data);
    } catch (error) {
      addResult('Create Note', false, error.response?.data?.message || error.message);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">API Debug Page</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Current Auth Status:</h2>
          <p><strong>Authenticated:</strong> {user ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? `${user.name} (${user.email})` : 'None'}</p>
          <p><strong>Token:</strong> {token ? 'Present' : 'None'}</p>
        </div>

        <button
          onClick={testAPIEndpoints}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
        >
          {loading ? 'Testing...' : 'Run API Tests'}
        </button>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test Results:</h2>
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                result.success 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    {result.test} - {result.success ? '✅ Success' : '❌ Failed'}
                  </h3>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-500">
                        Show Response Data
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebugPage;