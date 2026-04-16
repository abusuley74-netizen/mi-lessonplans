import React, { useState } from 'react';
import axios from 'axios';
import { X, Link2, Copy, Check, Lock, Unlock, Loader2, Share2 } from 'lucide-react';
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

  const handleWhatsApp = () => {
    const text = `Check out "${resourceName}" on mi-lessonplan.site:\n${generatedLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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

              {/* Share buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#1DA851] transition-colors"
                  data-testid="share-whatsapp-btn"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share via WhatsApp
                </button>
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
