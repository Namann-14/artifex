'use client';

import React, { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useAPIClient } from '@/lib/api-client';

export default function AuthDebug() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const apiClient = useAPIClient();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const debugToken = async () => {
    try {
      const token = await getToken();
      console.log('Full token:', token);
      
      if (token) {
        // Decode token to see payload (client-side decode only for debugging)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        
        setTokenInfo({
          token: token.substring(0, 50) + '...',
          payload: decoded,
          isSignedIn,
          userId: user?.id,
          email: user?.emailAddresses?.[0]?.emailAddress
        });
      } else {
        setTokenInfo({ error: 'No token available' });
      }
    } catch (error) {
      console.error('Token debug error:', error);
      setTokenInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const testAuthMe = async () => {
    try {
      console.log('Testing /auth/me endpoint...');
      const response = await apiClient.getCurrentUser();
      setApiResponse({ success: true, data: response });
    } catch (error) {
      console.error('API test error:', error);
      setApiResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const testDirectCall = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.text();
      console.log('Direct call response status:', response.status);
      console.log('Direct call response:', data);
      
      try {
        const jsonData = JSON.parse(data);
        setApiResponse({ directCall: true, status: response.status, data: jsonData });
      } catch {
        setApiResponse({ directCall: true, status: response.status, data: data });
      }
    } catch (error) {
      console.error('Direct call error:', error);
      setApiResponse({ directCall: true, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const testDebugToken = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/debug-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.text();
      console.log('Debug token response status:', response.status);
      console.log('Debug token response:', data);
      
      try {
        const jsonData = JSON.parse(data);
        setApiResponse({ debugToken: true, status: response.status, data: jsonData });
      } catch {
        setApiResponse({ debugToken: true, status: response.status, data: data });
      }
    } catch (error) {
      console.error('Debug token error:', error);
      setApiResponse({ debugToken: true, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Authentication Debug</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Auth Status</h3>
          <p>Signed In: {isSignedIn ? 'Yes' : 'No'}</p>
          <p>User ID: {user?.id || 'None'}</p>
          <p>Email: {user?.emailAddresses?.[0]?.emailAddress || 'None'}</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={debugToken}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Debug Token
          </button>
          <button
            onClick={testAuthMe}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test API Client
          </button>
          <button
            onClick={testDirectCall}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Direct Call
          </button>
          <button
            onClick={testDebugToken}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Debug Token Endpoint
          </button>
        </div>

        {tokenInfo && (
          <div>
            <h3 className="text-lg font-semibold">Token Debug</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          </div>
        )}

        {apiResponse && (
          <div>
            <h3 className="text-lg font-semibold">API Response</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}