/**
 * Frontend page: ChatInput
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useMemo, useState } from 'react';
import { Send, Mic, Camera } from 'lucide-react';

/**
 * Chat Input Component
 * 
 * Handles user input with:
 * - Text input with auto-resize
 * - Voice recording capability
 * - Image/file upload
 * - Send button with disabled states
 * - Emergency mode restrictions
 */
const ChatInput = ({
  onSendMessage,
  onUploadXray,
  uploadDisabled,
  scanContext,
  scanContextEnabled,
  onToggleScanContext,
  isEmergencyMode,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const hasScanContext = useMemo(() => Boolean(scanContext?.id), [scanContext?.id]);

  /**
   * Handle sending message
   */
  const handleSend = () => {
    if (inputMessage.trim() && !isEmergencyMode) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  /**
   * Handle key press (Enter to send)
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Handle voice recording toggle
   */
  const handleVoiceRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording implementation would go here
  };

  /**
   * Handle image upload
   */
  const handleXrayUpload = () => {
    if (!onUploadXray) return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) onUploadXray(file);
    };
    fileInput.click();
  };

  return (
    <div className="flex items-end space-x-3 sm:space-x-4">
      {/* Text Input */}
      <div className="flex-1">
        {hasScanContext ? (
          <button
            type="button"
            onClick={() => onToggleScanContext?.(!scanContextEnabled)}
            className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              scanContextEnabled
                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title={scanContextEnabled ? 'Scan context ON (click to disable)' : 'Scan context OFF (click to enable)'}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {scanContextEnabled ? 'Scan context: ON' : 'Scan context: OFF'}
          </button>
        ) : null}
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            isEmergencyMode 
              ? "Emergency mode active - Help is on the way..." 
              : "Describe your symptoms, upload medical images, or ask health questions..."
          }
          disabled={isEmergencyMode}
          className="w-full min-h-[60px] max-h-32 resize-none border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl p-3 text-slate-900 placeholder-slate-500 transition-all duration-200 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
          rows={1}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Voice Recording Button */}
        <button
          onClick={handleVoiceRecording}
          disabled={isEmergencyMode}
          className={`p-2 rounded-2xl border-2 transition-all duration-200 ${
            isRecording
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 disabled:opacity-50'
          }`}
        >
          <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* X-ray Upload Button */}
        <button
          onClick={handleXrayUpload}
          disabled={isEmergencyMode || uploadDisabled}
          className="p-2 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 transition-all duration-200 disabled:opacity-50"
        >
          <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputMessage.trim() || isEmergencyMode}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl text-white p-2 sm:p-3 rounded-2xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:transform-none"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;