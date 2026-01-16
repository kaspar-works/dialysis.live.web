import React, { useState } from 'react';
import { ReportReason, REPORT_REASON_CONFIG, reportContent } from '../../services/community';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'forum_post' | 'forum_reply';
  contentId: string;
  onSuccess?: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await reportContent({
        contentType,
        contentId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Report Content</h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Please select the reason for reporting this content. Our moderation team will review your report.
        </p>

        <div className="space-y-2 mb-4">
          {(Object.keys(REPORT_REASON_CONFIG) as ReportReason[]).map((reason) => (
            <label
              key={reason}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                selectedReason === reason
                  ? 'bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30'
                  : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-white/10'
              }`}
            >
              <input
                type="radio"
                name="reportReason"
                value={reason}
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
                className="mt-0.5 text-sky-500 focus:ring-sky-500"
              />
              <div>
                <span className="block font-medium text-slate-800 dark:text-white">
                  {REPORT_REASON_CONFIG[reason].label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {REPORT_REASON_CONFIG[reason].description}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Additional details (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide any additional context..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
