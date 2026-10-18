/**
 * FINServ Digital Banking Concierge & AI Assistant
 * - 24/7 interactive floating assistant across Customer & Admin portals
 * - Pre-configured fast action chips (KYC, FD Rates, Card Controls, Transfers, Security)
 * - Intelligent contextual banking responses with direct in-app navigation actions
 * - Accessible keyboard navigation, mobile drawer support, and dark/light adaptive styling
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  action?: {
    label: string;
    route: string;
  };
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: 'Hello! I am your FINServ 24/7 Digital Banking Assistant. How can I assist you with your accounts, transfers, or banking services today?',
    timestamp: 'Just now',
  },
];

const SUGGESTION_CHIPS = [
  { label: '📝 Complete KYC', query: 'How do I complete my KYC verification?' },
  { label: '📈 Fixed Deposit Rates', query: 'What are the current FD interest rates?' },
  { label: '💳 Manage / Freeze Card', query: 'How do I freeze or manage my virtual debit card?' },
  { label: '💸 Fund Transfers', query: 'How do instant transfers and NEFT/IMPS work?' },
  { label: '🔒 Account Security', query: 'How does FINServ protect my banking data?' },
];

export const BankingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: getNextMsgId('user'),
      sender: 'user',
      text: query,
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const response = generateBotResponse(query, getNextMsgId('bot'), botTime);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 600);
  };

let chatMsgSeq = 0;
const getNextMsgId = (prefix: string) => `${prefix}-${++chatMsgSeq}`;

const generateBotResponse = (query: string, msgId: string, time: string): ChatMessage => {
  const q = query.toLowerCase();

  if (q.includes('kyc') || q.includes('verify') || q.includes('document') || q.includes('pan')) {
    return {
      id: msgId,
      sender: 'bot',
      text: 'KYC on FINServ follows a 5-step progressive flow: 1) Contact OTP, 2) Personal Profile, 3) FATCA & Address, 4) PAN & Government ID upload, and 5) Final Legal Declaration. Once submitted, bank officers review and approve applications within minutes.',
      timestamp: time,
      action: {
        label: 'Open KYC Portal',
        route: '/onboarding',
      },
    };
  }

  if (q.includes('fd') || q.includes('deposit') || q.includes('rate') || q.includes('interest') || q.includes('invest')) {
    return {
      id: msgId,
      sender: 'bot',
      text: 'FINServ offers competitive Fixed Deposit interest rates up to 8.25% p.a., with quarterly compounding and zero pre-closure penalty options. Senior citizens receive an additional +0.50% p.a. benefit.',
      timestamp: time,
      action: {
        label: 'Book Fixed Deposit',
        route: '/app/deposits',
      },
    };
  }

  if (q.includes('card') || q.includes('freeze') || q.includes('limit') || q.includes('debit') || q.includes('atm')) {
    return {
      id: msgId,
      sender: 'bot',
      text: 'Your FINServ Platinum Virtual Debit Card includes instant freeze/unfreeze toggles, daily online & ATM transaction limit sliders, and international usage controls backed by hardware tokenization.',
      timestamp: time,
      action: {
        label: 'Manage Debit Cards',
        route: '/app/cards',
      },
    };
  }

  if (q.includes('transfer') || q.includes('send') || q.includes('pay') || q.includes('neft') || q.includes('imps') || q.includes('money')) {
    return {
      id: msgId,
      sender: 'bot',
      text: 'Fund transfers on FINServ are cleared immediately via our double-entry ledger engine. We support Intra-Bank, IMPS, and NEFT transfers with cryptographic idempotency keys to ensure zero duplicate debits.',
      timestamp: time,
      action: {
        label: 'Make a Transfer',
        route: '/app/transfers',
      },
    };
  }

  if (q.includes('security') || q.includes('safe') || q.includes('encryption') || q.includes('2fa') || q.includes('password')) {
    return {
      id: msgId,
      sender: 'bot',
      text: 'FINServ adheres to RBI core banking cybersecurity standards: AES-256-GCM hardware database encryption, SHA-256 blind indexing for tax identifiers, mandatory 2FA OTP verification, and strict role segregation.',
      timestamp: time,
    };
  }

  if (q.includes('statement') || q.includes('balance') || q.includes('history') || q.includes('download')) {
    return {
      id: msgId,
      sender: 'bot',
      text: 'You can generate digitally signed account statements with date-range filters, debit/credit categorizations, and PDF downloads directly in your customer portal.',
      timestamp: time,
      action: {
        label: 'View Statements',
        route: '/app/statements',
      },
    };
  }

  // Default Fallback
  return {
    id: msgId,
    sender: 'bot',
    text: "I can help you navigate account operations, book Fixed Deposits, configure card security controls, initiate instant transfers, or check KYC status. Select a topic below or contact our 24/7 priority helpdesk at support@finserv.local.",
    timestamp: time,
  };
};

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
        }}
      >
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open FINServ Banking Assistant"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 18px',
              borderRadius: '9999px',
              backgroundColor: 'var(--brand-primary, #0B2545)',
              background: 'linear-gradient(135deg, #0B2545 0%, #0F3B66 50%, #2EC4B6 100%)',
              color: '#FFFFFF',
              border: '1px solid rgba(46, 196, 182, 0.4)',
              boxShadow: '0 8px 24px rgba(11, 37, 69, 0.35), 0 0 16px rgba(46, 196, 182, 0.25)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MessageSquare size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#34D399',
                  boxShadow: '0 0 6px #34D399',
                }}
              />
            </div>
            <span>FINServ Assistant</span>
          </button>
        )}
      </div>

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="FINServ Banking Assistant Chat"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 48px)',
            backgroundColor: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl, 16px)',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.35), 0 0 24px rgba(46, 196, 182, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 10000,
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #0B2545 0%, #10375C 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2EC4B6 0%, #38BDF8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0B2545',
                  fontWeight: 800,
                  fontSize: '14px',
                  boxShadow: '0 0 10px rgba(46, 196, 182, 0.5)',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>FINServ Concierge</span>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#34D399',
                      display: 'inline-block',
                      boxShadow: '0 0 6px #34D399',
                    }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)' }}>
                  Core-Banking AI • 24/7 Support
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handleReset}
                title="Reset conversation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Bar */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--surface-sunken)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
            }}
          >
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip.query)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderRadius: '9999px',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'var(--surface-canvas)',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      backgroundColor: isUser
                        ? 'var(--brand-primary, #0B2545)'
                        : 'var(--surface-card)',
                      color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      border: isUser ? 'none' : '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
                    }}
                  >
                    {msg.text}

                    {/* Optional In-App Navigation Action Button */}
                    {msg.action && (
                      <div style={{ marginTop: '10px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsOpen(false);
                            navigate(msg.action!.route);
                          }}
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            height: 'auto',
                            borderColor: 'var(--brand-accent)',
                            color: 'var(--brand-accent)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {msg.action.label} <ChevronRight size={13} />
                        </Button>
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      color: 'var(--text-tertiary)',
                      marginTop: '3px',
                      padding: '0 4px',
                    }}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 14px',
                  borderRadius: '16px 16px 16px 2px',
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>FINServ assistant typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-card)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Ask about KYC, FDs, cards, transfers..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--surface-sunken)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send Message"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: input.trim() ? 'var(--brand-primary, #0B2545)' : 'var(--border-default)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
