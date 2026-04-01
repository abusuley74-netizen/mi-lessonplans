import React, { useState } from 'react';
import axios from 'axios';
import { X, Link2, Copy, Check, Lock, Unlock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ShareModal = ({ isOpen, onClose, resourceType, resourceId, resourceName }) => {
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/links`, {
        resource_type: resourceType,
        resource_id: resourceId,
        description,
        is_paid: isPaid,
        price: isPaid ? price : 0,
      }, { withCredentials: true });

      const code = res.data.link_code;
      const fullUrl = `${window.location.origin}/shared/${code}`;
      setGeneratedLink(fullUrl);
      toast.success('Shareable link created!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink).then(() => {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClose = () => {
    setGeneratedLink(null);
    setDescription('');
    setIsPaid(false);
    setPrice(1000);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]" data-testid="share-modal">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E4DFD5]">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#2D5A27]" />
            <h2 className="font-heading text-lg font-semibold text-[#1A2E16]">Share Resource</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 text-[#7A8A76] hover:text-[#1A2E16] hover:bg-[#F2EFE8] rounded-lg" data-testid="share-modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Resource info */}
          <div className="bg-[#F8F6F1] rounded-lg p-3">
            <p className="text-xs text-[#7A8A76] uppercase tracking-wider mb-1">{resourceType}</p>
            <p className="font-medium text-[#1A2E16] line-clamp-2" data-testid="share-resource-name">{resourceName}</p>
          </div>

          {!generatedLink ? (
            <>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#4A5B46] mb-1.5">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note for the visitor..."
                  className="w-full bg-white border border-[#E4DFD5] rounded-lg px-3 py-2 text-sm text-[#1A2E16] focus:border-[#2D5A27] focus:outline-none resize-none"
                  rows={2}
                  data-testid="share-description-input"
                />
              </div>

              {/* Paid toggle */}
              <div className="flex items-center justify-between p-3 bg-[#F8F6F1] rounded-lg">
                <div className="flex items-center gap-2">
                  {isPaid ? <Lock className="w-4 h-4 text-[#E5A93D]" /> : <Unlock className="w-4 h-4 text-[#2D5A27]" />}
                  <span className="text-sm font-medium text-[#1A2E16]">{isPaid ? 'Paid Access' : 'Free Access'}</span>
                </div>
                <button
                  onClick={() => setIsPaid(!isPaid)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isPaid ? 'bg-[#E5A93D]' : 'bg-[#D1D5DB]'}`}
                  data-testid="share-paid-toggle"
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPaid ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {/* Price input */}
              {isPaid && (
                <div>
                  <label className="block text-sm font-medium text-[#4A5B46] mb-1.5">Price (TZS)</label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-[#E4DFD5] rounded-lg px-3 py-2 text-sm text-[#1A2E16] focus:border-[#2D5A27] focus:outline-none"
                    data-testid="share-price-input"
                  />
                </div>
              )}

              {/* Info */}
              <p className="text-xs text-[#7A8A76] leading-relaxed">
                This link will expire automatically after <strong>1 download</strong> to prevent abuse.
                Visitors do not need to log in.
              </p>

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D5A27] text-white rounded-lg font-medium hover:bg-[#21441C] transition-colors disabled:opacity-50"
                data-testid="share-create-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {loading ? 'Creating...' : 'Generate Shareable Link'}
              </button>
            </>
          ) : (
            <>
              {/* Generated link display */}
              <div>
                <label className="block text-sm font-medium text-[#4A5B46] mb-1.5">Your shareable link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 bg-[#F8F6F1] border border-[#E4DFD5] rounded-lg px-3 py-2 text-sm text-[#1A2E16] select-all"
                    data-testid="share-link-output"
                  />
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-[#2D5A27] text-white hover:bg-[#21441C]'}`}
                    data-testid="share-copy-btn"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  This link allows <strong>1 download</strong> and will auto-expire after use.{' '}
                  {isPaid && `Visitors must pay TZS ${price.toLocaleString()} to access.`}
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 border border-[#E4DFD5] rounded-lg text-[#4A5B46] font-medium hover:bg-[#F2EFE8] transition-colors"
                data-testid="share-done-btn"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
