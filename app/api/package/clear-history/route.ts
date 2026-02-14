/**
 * Clear History API Route
 * Bulk-deletes terminal packaging jobs for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

const DEFAULT_TERMINAL_STATUSES = ['completed', 'deployed', 'failed', 'cancelled', 'duplicate_skipped'];

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header (Microsoft access token from MSAL)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Microsoft.' },
        { status: 401 }
      );
    }

    // Decode the token to get user info
    const accessToken = authHeader.slice(7);
    let userId: string;

    try {
      const tokenPayload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString()
      );
      userId = tokenPayload.oid || tokenPayload.sub;

      if (!userId) {
        return NextResponse.json(
          { error: 'Invalid token: missing user identifier' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // Parse optional statuses from request body
    let statuses = DEFAULT_TERMINAL_STATUSES;
    try {
      const body = await request.json();
      if (Array.isArray(body.statuses) && body.statuses.length > 0) {
        // Only allow valid terminal statuses
        statuses = body.statuses.filter((s: unknown) =>
          typeof s === 'string' && DEFAULT_TERMINAL_STATUSES.includes(s)
        );
        if (statuses.length === 0) {
          return NextResponse.json(
            { error: 'No valid terminal statuses provided' },
            { status: 400 }
          );
        }
      }
    } catch {
      // Body is optional, use defaults
    }

    const db = getDatabase();
    const deletedCount = await db.jobs.deleteByUserIdAndStatuses(userId, statuses);

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
