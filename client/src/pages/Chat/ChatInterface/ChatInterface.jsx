/**
 * Frontend page: ChatInterface
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Bot, User, AlertTriangle } from 'lucide-react';
import MessageList from '../MessageList/MessageList';
import ChatInput from '../ChatInput/ChatInput';

/**
 * Chat Interface Component
 * 
 * Main chat area containing:
 * - Message history display
 * - Input controls
 * - Emergency mode alerts
 * - AI typing indicators
 */
const ChatInterface = ({
  messages,
  onSendMessage,
  onUploadXray,
  uploadDisabled,
  scanContext,
  scanContextEnabled,
  onToggleScanContext,
  isEmergencyMode,
}) => {
  return (
    <div className="h-full flex flex-col border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="border-b border-slate-200/50 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">AI Medical Assistant</h2>
              <p className="text-slate-600 text-sm sm:text-base">Ready to help with your health concerns</p>
            </div>
          </div>
          
          {isEmergencyMode && (
            <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-2 rounded-lg border border-red-200">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm font-medium">Emergency Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-[320px] overflow-y-auto">
        <MessageList messages={messages} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200/50 p-4 sm:p-6">
        <ChatInput
          onSendMessage={onSendMessage}
          onUploadXray={onUploadXray}
          uploadDisabled={uploadDisabled}
          scanContext={scanContext}
          scanContextEnabled={scanContextEnabled}
          onToggleScanContext={onToggleScanContext}
          isEmergencyMode={isEmergencyMode}
        />
      </div>
    </div>
  );
};

export default ChatInterface;