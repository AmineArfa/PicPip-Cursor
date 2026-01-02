'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MessageSquare, Send, ChevronLeft, Mail, Calendar } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton, NeoCard } from '@/components/ui';
import type { SupportTicket, SupportMessage } from '@/lib/supabase/types';

type TicketStatus = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

interface TicketWithMessages extends SupportTicket {
  messages?: SupportMessage[];
}

export function AdminSupportContent() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const response = await fetch(`/api/admin/support/tickets?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single ticket with messages
  const fetchTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (!response.ok) throw new Error('Failed to fetch ticket');

      const data = await response.json();
      setSelectedTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, searchQuery]);

  // Handle status update
  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Refresh ticket if selected
      if (selectedTicket?.id === ticketId) {
        await fetchTicket(ticketId);
      }
      // Refresh ticket list
      await fetchTickets();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle reply
  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setIsReplying(true);
      const response = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage.trim() }),
      });

      if (!response.ok) throw new Error('Failed to send reply');

      setReplyMessage('');
      // Refresh ticket to get updated messages
      await fetchTicket(selectedTicket.id);
      // Refresh ticket list
      await fetchTickets();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (selectedTicket) {
    return (
      <DotPattern className="min-h-screen flex flex-col">
        <Header isAuthenticated={true} />
        <main className="flex-1 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Back button */}
            <NeoButton
              variant="secondary"
              size="md"
              icon={<ChevronLeft className="w-5 h-5" />}
              onClick={() => setSelectedTicket(null)}
              className="mb-6"
            >
              Back to Tickets
            </NeoButton>

            {/* Ticket Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <NeoCard hover={false} className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-[#181016] mb-2">
                      {selectedTicket.ticket_number}
                    </h1>
                    <div className="flex items-center gap-4 text-[#181016]/70">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{selectedTicket.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(selectedTicket.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full border-2 font-bold text-sm ${getStatusColor(selectedTicket.status)}`}
                    >
                      {selectedTicket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusUpdate(selectedTicket.id, e.target.value)}
                      disabled={isUpdatingStatus}
                      className="px-3 py-2 border-4 border-[#181016] rounded-xl font-bold bg-white focus:outline-none focus:border-[#ff61d2]"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </NeoCard>
            </motion.div>

            {/* Messages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 mb-6"
            >
              {selectedTicket.messages?.map((message) => (
                <NeoCard
                  key={message.id}
                  hover={false}
                  variant={message.sender_type === 'admin' ? 'cyan' : 'default'}
                  className={message.sender_type === 'admin' ? 'ml-8' : 'mr-8'}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-[#181016]">
                        {message.sender_type === 'admin' ? 'You' : message.sender_email}
                      </p>
                      <p className="text-sm text-[#181016]/60">{formatDate(message.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-[#181016] whitespace-pre-wrap">{message.message}</p>
                </NeoCard>
              ))}
            </motion.div>

            {/* Reply Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NeoCard hover={false}>
                <h2 className="font-display text-xl font-bold text-[#181016] mb-4">
                  Reply to {selectedTicket.email}
                </h2>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full h-32 p-4 border-4 border-[#181016] rounded-2xl resize-none focus:outline-none focus:border-[#ff61d2] font-medium"
                  disabled={isReplying}
                />
                <div className="mt-4 flex justify-end">
                  <NeoButton
                    variant="cyan"
                    size="lg"
                    icon={<Send className="w-5 h-5" />}
                    onClick={handleReply}
                    disabled={!replyMessage.trim() || isReplying}
                  >
                    {isReplying ? 'Sending...' : 'Send Reply'}
                  </NeoButton>
                </div>
              </NeoCard>
            </motion.div>
          </div>
        </main>
      </DotPattern>
    );
  }

  return (
    <DotPattern className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl font-bold text-[#181016] mb-2">
              Support Tickets
            </h1>
            <p className="text-[#181016]/70">Manage and reply to user support requests</p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <NeoCard hover={false}>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#181016]/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ticket number or email..."
                    className="w-full pl-12 pr-4 py-3 border-4 border-[#181016] rounded-2xl focus:outline-none focus:border-[#ff61d2] font-medium"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#181016]/40" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as TicketStatus)}
                    className="px-4 py-3 border-4 border-[#181016] rounded-2xl font-bold bg-white focus:outline-none focus:border-[#ff61d2]"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </NeoCard>
          </motion.div>

          {/* Tickets List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {loading ? (
              <NeoCard hover={false} className="text-center py-12">
                <p className="text-[#181016]/70">Loading tickets...</p>
              </NeoCard>
            ) : tickets.length === 0 ? (
              <NeoCard hover={false} className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#181016]/40" />
                <p className="text-[#181016]/70 font-bold">No tickets found</p>
              </NeoCard>
            ) : (
              tickets.map((ticket) => (
                <NeoCard
                  key={ticket.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => fetchTicket(ticket.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-xl font-bold text-[#181016]">
                          {ticket.ticket_number}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full border-2 text-xs font-bold ${getStatusColor(ticket.status)}`}
                        >
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[#181016]/70 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{ticket.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      {ticket.subject && (
                        <p className="mt-2 text-[#181016]/80 line-clamp-1">{ticket.subject}</p>
                      )}
                    </div>
                    <MessageSquare className="w-6 h-6 text-[#181016]/40 flex-shrink-0" />
                  </div>
                </NeoCard>
              ))
            )}
          </motion.div>
        </div>
      </main>
    </DotPattern>
  );
}

