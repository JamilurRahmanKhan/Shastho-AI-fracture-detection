/**
 * Frontend page: MessageBubble
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, User, ImageIcon, FileText } from 'lucide-react';

/**
 * Message Bubble Component
 * 
 * Individual message display with:
 * - Different styling for user vs AI messages
 * - Support for attachments (images, files)
 * - Timestamp display
 * - Responsive design
 */
const MessageBubble = ({ message }) => {
  const isUser = message.type === 'user';

  const isXrayReport = message?.kind === 'xray_report' && message?.report;

  const toDate = (ts) => {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    if (typeof ts === "string" || typeof ts === "number") {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof ts.toDate === "function") return ts.toDate(); // Firestore Timestamp
    return null;
  };

  const timeLabel = (() => {
    const d = toDate(message.timestamp);
    if (!d) return "";
    try {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  })();

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg ${
          isUser
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-md'
            : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 rounded-2xl rounded-bl-md border border-slate-200'
        } p-4 shadow-lg`}
      >
        <div className="flex items-start space-x-3">
          {/* AI Icon for AI messages */}
          {!isUser && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
          
          {/* Message Content */}
          <div className="flex-1">
            {isXrayReport ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isUser ? 'text-white' : 'text-slate-700'}`} />
                  <div className={`text-sm font-semibold ${isUser ? 'text-white' : 'text-slate-900'}`}>X-ray report</div>
                </div>

                <div className={`rounded-xl ${isUser ? 'bg-white/15' : 'bg-white'} p-3 border ${isUser ? 'border-white/20' : 'border-slate-200'}`}>
                  <div className="grid grid-cols-1 gap-2">
                    {/*
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium ${isUser ? 'text-white/80' : 'text-slate-600'}`}>Region</span>
                      <span className={`text-xs font-semibold ${isUser ? 'text-white' : 'text-slate-900'}`}>{message.report.region || '—'}</span>
                    </div>
                    */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium ${isUser ? 'text-white/80' : 'text-slate-600'}`}>Fracture</span>
                      <span className={`text-xs font-semibold ${isUser ? 'text-white' : 'text-slate-900'}`}>{message.report.fractureDetected ? 'Detected' : 'Not detected'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium ${isUser ? 'text-white/80' : 'text-slate-600'}`}>Confidence</span>
                      <span className={`text-xs font-semibold ${isUser ? 'text-white' : 'text-slate-900'}`}>{typeof message.report.probability === 'number' ? `${message.report.probability}%` : '—'}</span>
                    </div>
                    {message.report.recoveryTimeline ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-medium ${isUser ? 'text-white/80' : 'text-slate-600'}`}>Recovery</span>
                        <span className={`text-xs font-semibold ${isUser ? 'text-white' : 'text-slate-900'}`}>{message.report.recoveryTimeline}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {message.report.fileUrl ? (
                      <a
                        href={message.report.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-xs font-semibold underline ${isUser ? 'text-white' : 'text-blue-700'}`}
                      >
                        View image
                      </a>
                    ) : null}
                    <span className={isUser ? 'text-white/40' : 'text-slate-300'}>•</span>
                    <Link
                      to="/history"
                      className={`text-xs font-semibold underline ${isUser ? 'text-white' : 'text-blue-700'}`}
                    >
                      Open history
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
            )}
            
            {/* Attachments */}
            {message.attachments && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-white/20 rounded-lg">
                    <ImageIcon className="w-4 h-4" />
                    {attachment?.url ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline"
                      >
                        {attachment.name}
                      </a>
                    ) : (
                      <span className="text-xs">{attachment.name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Timestamp */}
            <div className="text-xs opacity-70 mt-2">
              {timeLabel}
            </div>
          </div>
          
          {/* User Icon for user messages */}
          {isUser && (
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;