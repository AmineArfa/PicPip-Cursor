import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { checkAdminAccess } from '@/lib/admin';
import { sendAdminReply } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const { isAdmin, userId } = await checkAdminAccess();
    if (!isAdmin || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    // Validate message
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long (maximum 5000 characters)' },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceRoleClient();

    // Get ticket to verify it exists and get email
    const { data: ticket, error: ticketError } = await serviceClient
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Get admin email
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmail = user?.email || process.env.ADMIN_EMAIL || 'admin@picpip.co';

    // Insert admin reply message
    const { data: newMessage, error: messageError } = await serviceClient
      .from('support_messages')
      .insert({
        ticket_id: id,
        sender_type: 'admin',
        sender_email: adminEmail,
        message: trimmedMessage,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send reply' },
        { status: 500 }
      );
    }

    // Update ticket status to in_progress if it was open
    if (ticket.status === 'open') {
      await serviceClient
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', id);
    }

    // Send email notification to user (non-blocking)
    sendAdminReply({
      ticketNumber: ticket.ticket_number,
      userEmail: ticket.email,
      adminMessage: trimmedMessage,
    }).catch((error) => {
      console.error('Failed to send email notification:', error);
      // Don't fail the request if email fails
    });

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/support/tickets/[id]/reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

