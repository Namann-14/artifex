import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      prompt,
      type = 'text-to-image',
      style = 'realistic',
      quality = 'high',
      dimensions = { width: 1024, height: 1024 },
    }: {
      prompt: string;
      type?: string;
      style?: string;
      quality?: string;
      dimensions?: { width: number; height: number };
    } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get the authentication token
    const token = await getToken();
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Failed to get authentication token' },
        { status: 401 }
      );
    }

    // Get the backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    
    // Map the type to correct backend endpoint
    const endpointMap: { [key: string]: string } = {
      'text-to-image': 'text-to-image',
      'image-to-image': 'image-to-image',
      'multi-image': 'multi-image',
      'refine': 'refine'
    };
    
    const endpoint = endpointMap[type] || 'text-to-image';
    
    console.log('Forwarding to backend:', `${backendUrl}/generate/${endpoint}`);
    console.log('Token present:', !!token);
    console.log('Request payload:', { prompt, style, quality, dimensions });

    // Forward the request to your backend server
    const backendResponse = await fetch(`${backendUrl}/generate/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt,
        style,
        quality,
        dimensions,
      }),
    });

    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return NextResponse.json(
        { 
          success: false,
          message: errorData.message || errorData.error || 'Generation failed',
          status: backendResponse.status,
          debug: {
            backendUrl: `${backendUrl}/generate/${endpoint}`,
            hasToken: !!token,
            userId: userId
          }
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log('Backend success response:', result);

    // Return the response from your backend with success flag
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}