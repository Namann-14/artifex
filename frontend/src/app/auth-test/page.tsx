'use client';

import AuthDebug from '@/components/test/auth-debug';

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Authentication Test & Debug</h1>
        <AuthDebug />
      </div>
    </div>
  );
}