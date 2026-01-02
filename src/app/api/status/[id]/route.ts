import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: animationId } = await params;

    if (!animationId) {
      return NextResponse.json(
        { error: 'Animation ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    const { data: animation, error } = await supabase
      .from('animations')
      .select('*')
      .eq('id', animationId)
      .single();

    if (error || !animation) {
      return NextResponse.json(
        { error: 'Animation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(animation);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

