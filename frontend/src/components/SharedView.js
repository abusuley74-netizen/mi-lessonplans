import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Download, Star, Lock, AlertTriangle, Loader2, CheckCircle2, XCircle, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const fetchAndDownloadBlob = async (url, filename) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Download failed');
  const blob = await response.blob();
  const reader = new FileReader();
  reader.onload = () => {
    const a = document.createElement('a');
    a.href = reader.result;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  reader.readAsDataURL(blob);
};

const TYPE_LABELS = { lesson: 'Lesson Plan', note: 'Note', scheme: 'Scheme of Work', template: 'Template', dictation: 'Dictation' };
const TYPE_COLORS = { lesson: 'bg-green-100 text-green-700', note: 'bg-yellow-100 text-yellow-700', scheme: 'bg-blue-100 text-blue-700', template: 'bg-purple-100 text-purple-700', dictation: 'bg-orange-100 text-orange-700' };

const SharedView = () => {
  const { code } = useParams();
  const [linkData, setLinkData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paid, setPaid] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => {
    fetchLink();
  }, [code]);

  const fetchLink = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/links/${code}`);
      setLinkData(res.data.link);
      setPreview(res.data.preview);
      setExpired(res.data.expired);
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      else toast.error('Failed to load shared resource');
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = () => {
    setPaymentPending(true);
    setTimeout(() => {
      setPaid(true);
      setPaymentPending(false);
      toast.success('Payment successful (DEMO MODE)');
    }, 1500);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const filename = `${linkData.title || 'download'}.txt`;
      await fetchAndDownloadBlob(`${API_URL}/api/links/${code}/download`, filename);
      setDownloaded(true);
      toast.success('Download started! This link is now expired.');
      // Refresh link data
      setTimeout(() => fetchLink(), 500);
    } catch (err) {
      if (err.message?.includes('410') || err.message?.includes('expired')) {
        setExpired(true);
        toast.error('This link has already expired.');
      } else {
        toast.error('Download failed. The link may have expired.');
      }
      // Refresh to get current state
      fetchLink();
    } finally {
      setDownloading(false);
    }
  };

  const handleRate = async () => {
    if (ratingScore < 1) { toast.error('Please select a rating'); return; }
    try {
      const res = await axios.post(`${API_URL}/api/links/${code}/rate`, { score: ratingScore, comment: ratingComment });
      setRatingSubmitted(true);
      setLinkData(prev => ({ ...prev, avg_rating: res.data.avg_rating, total_ratings: res.data.total_ratings }));
      toast.success('Thank you for your rating!');
    } catch (err) {
      toast.error('Failed to submit rating');
    }
  };

  const canDownload = linkData && !expired && linkData.status === 'active' && (!linkData.is_paid || paid) && !downloaded;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[#4A5B46]">Loading shared resource...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center" data-testid="shared-not-found">
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A2E16] mb-2">Link Not Found</h1>
          <p className="text-[#7A8A76] mb-6">This shared link doesn't exist or has been removed.</p>
          <Link to="/login" className="inline-flex items-center gap-2 text-[#2D5A27] font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Go to MiLesson Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header bar */}
      <header className="bg-white border-b border-[#E4DFD5] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 text-[#2D5A27] font-bold text-lg" data-testid="shared-logo">
            MiLesson Plan
          </Link>
          <span className="text-xs text-[#7A8A76]">Shared Resource</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" data-testid="shared-view-card">
          {/* Top section */}
          <div className="p-6 sm:p-8 border-b border-[#E4DFD5]">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[linkData.resource_type] || 'bg-gray-100 text-gray-700'}`} data-testid="shared-type-badge">
                {TYPE_LABELS[linkData.resource_type] || linkData.resource_type}
              </span>
              {linkData.is_paid && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700 flex items-center gap-1" data-testid="shared-paid-badge">
                  <Lock className="w-3 h-3" /> TZS {linkData.price?.toLocaleString()}
                </span>
              )}
              {(expired || linkData.status !== 'active') && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-600 flex items-center gap-1" data-testid="shared-expired-badge">
                  <AlertTriangle className="w-3 h-3" /> Expired
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A2E16] mb-2" data-testid="shared-title">{linkData.title}</h1>

            {linkData.description && (
              <p className="text-[#7A8A76] mb-4" data-testid="shared-description">{linkData.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-[#7A8A76]">
              <User className="w-4 h-4" />
              <span data-testid="shared-teacher-name">Shared by {linkData.teacher_name}</span>
            </div>

            {/* Rating display */}
            {linkData.total_ratings > 0 && (
              <div className="flex items-center gap-2 mt-3" data-testid="shared-rating-display">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(linkData.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm text-[#7A8A76]">{linkData.avg_rating} ({linkData.total_ratings} rating{linkData.total_ratings !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>

          {/* Preview section */}
          {preview && (
            <div className="p-6 sm:p-8 border-b border-[#E4DFD5] bg-[#FDFBF7]" data-testid="shared-preview-section">
              <h3 className="text-sm font-medium text-[#7A8A76] uppercase tracking-wider mb-3">Preview</h3>
              <div className="space-y-2">
                {Object.entries(preview).map(([key, val]) => (
                  val ? (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="font-medium text-[#4A5B46] capitalize min-w-[100px]">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-[#1A2E16]">{val}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* Action section */}
          <div className="p-6 sm:p-8">
            {expired || linkData.status !== 'active' ? (
              <div className="text-center py-4" data-testid="shared-expired-message">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-[#1A2E16] mb-1">Link Expired</h3>
                <p className="text-sm text-[#7A8A76]">This link has been used or disabled by the teacher.</p>
              </div>
            ) : downloaded ? (
              <div className="text-center py-4" data-testid="shared-downloaded-message">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-[#1A2E16] mb-1">Downloaded Successfully!</h3>
                <p className="text-sm text-[#7A8A76]">This link has now expired after 1 download.</p>
              </div>
            ) : linkData.is_paid && !paid ? (
              <div className="text-center py-4" data-testid="shared-payment-section">
                <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-[#1A2E16] mb-1">Paid Resource</h3>
                <p className="text-sm text-[#7A8A76] mb-4">Pay TZS {linkData.price?.toLocaleString()} to unlock this resource</p>
                <button
                  onClick={handleMockPayment}
                  disabled={paymentPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E5A93D] text-white rounded-lg font-medium hover:bg-[#D49A2E] transition-colors disabled:opacity-50"
                  data-testid="shared-pay-btn"
                >
                  {paymentPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {paymentPending ? 'Processing...' : `Pay TZS ${linkData.price?.toLocaleString()}`}
                </button>
                <p className="text-xs text-[#7A8A76] mt-3">Payment is in DEMO MODE (PesaPal integration pending)</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={handleDownload}
                  disabled={downloading || !canDownload}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#2D5A27] text-white rounded-xl font-medium text-lg hover:bg-[#21441C] transition-colors disabled:opacity-50 shadow-md"
                  data-testid="shared-download-btn"
                >
                  {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {downloading ? 'Downloading...' : 'Download Resource'}
                </button>
                <p className="text-xs text-[#7A8A76] mt-3">This link will expire after downloading</p>
              </div>
            )}
          </div>

          {/* Rating section */}
          <div className="p-6 sm:p-8 border-t border-[#E4DFD5] bg-[#FDFBF7]" data-testid="shared-rating-section">
            <h3 className="text-sm font-medium text-[#7A8A76] uppercase tracking-wider mb-3">Rate this Resource</h3>
            {ratingSubmitted ? (
              <div className="text-center py-3">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-[#4A5B46]">Thank you for your feedback!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onMouseEnter={() => setHoverStar(s)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setRatingScore(s)}
                      className="p-0.5 transition-transform hover:scale-110"
                      data-testid={`rating-star-${s}`}
                    >
                      <Star className={`w-7 h-7 ${s <= (hoverStar || ratingScore) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  {ratingScore > 0 && <span className="text-sm text-[#7A8A76] ml-2">{ratingScore}/5</span>}
                </div>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Leave a comment (optional)..."
                  className="w-full bg-white border border-[#E4DFD5] rounded-lg px-3 py-2 text-sm text-[#1A2E16] focus:border-[#2D5A27] focus:outline-none resize-none"
                  rows={2}
                  data-testid="rating-comment-input"
                />
                <button
                  onClick={handleRate}
                  disabled={ratingScore < 1}
                  className="px-4 py-2 bg-[#2D5A27] text-white rounded-lg text-sm font-medium hover:bg-[#21441C] transition-colors disabled:opacity-40"
                  data-testid="rating-submit-btn"
                >
                  Submit Rating
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6">
        <p className="text-xs text-[#7A8A76]">Powered by MiLesson Plan</p>
      </footer>
    </div>
  );
};

export default SharedView;
