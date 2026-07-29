import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ad-filter
 * Public endpoint to fetch custom ad filter code and versioning.
 * Query params:
 *   - ?full=true : returns { version, code }
 *   - default    : returns { version }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === 'true';

    const code = process.env.CUSTOM_AD_FILTER_CODE || '';
    const version = process.env.CUSTOM_AD_FILTER_VERSION
      ? parseInt(process.env.CUSTOM_AD_FILTER_VERSION, 10)
      : (code ? 1 : 0);

    if (full) {
      return NextResponse.json({
        code,
        version,
      });
    }

    return NextResponse.json({
      version,
    });
  } catch (error) {
    console.error('[AdFilter API] Error fetching custom filter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad filter config', details: (error as Error).message },
      { status: 500 }
    );
  }
}
