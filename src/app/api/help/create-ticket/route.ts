import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { sendNewTicketNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, message } = body;

    // Validate required fields
    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate message length
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long (maximum 5000 characters)' },
        { status: 400 }
      );
    }

    // Get user ID if authenticated (optional)
    let userId: string | null = null;
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {
      // User not authenticated, that's fine - tickets can be from guests
    }

    // Use service role client for database operations
    const serviceClient = await createServiceRoleClient();

    // Generate ticket number using database function
    const { data: ticketNumberResult, error: ticketNumberError } = await serviceClient
      .rpc('generate_ticket_number');

    if (ticketNumberError) {
      console.error('Error generating ticket number:', ticketNumberError);
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      );
    }

    // RPC functions return the value directly in data
    const ticketNumber = ticketNumberResult as string;
    
    if (!ticketNumber) {
      console.error('Ticket number generation returned empty result');
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      );
    }

    // Generate subject from first line of message (optional)
    const firstLine = trimmedMessage.split('\n')[0].trim();
    const subject = firstLine.length > 100 
      ? firstLine.substring(0, 100) + '...' 
      : firstLine;

    // Insert ticket and first message in a transaction
    // First, insert the ticket
    const { data: ticket, error: ticketError } = await serviceClient
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        email: email.trim(),
        subject: subject || null,
        status: 'open',
        user_id: userId,
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      console.error('Error creating ticket:', ticketError);
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      );
    }

    // Insert the first message
    const { error: messageError } = await serviceClient
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'user',
        sender_email: email.trim(),
        message: trimmedMessage,
      });

    if (messageError) {
      console.error('Error creating message:', messageError);
      // Try to clean up the ticket if message insertion fails
      await serviceClient.from('support_tickets').delete().eq('id', ticket.id);
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      );
    }

    // Send email notification to admin (non-blocking)
    sendNewTicketNotification({
      ticketNumber,
      userEmail: email.trim(),
      messagePreview: trimmedMessage.length > 200 
        ? trimmedMessage.substring(0, 200) + '...' 
        : trimmedMessage,
    }).catch((error) => {
      console.error('Failed to send email notification:', error);
      // Don't fail the request if email fails
    });

    return NextResponse.json({
      success: true,
      ticketNumber,
    });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

