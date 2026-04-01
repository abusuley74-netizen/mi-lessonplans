import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link2, Copy, Check, Trash2, Star, ExternalLink, Loader2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TYPE_LABELS = { lesson: 'Lesson Plan', note: 'Note', scheme: 'Scheme', template: 'Template', dictation: 'Dictation' };
const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-600',
  disabled: 'bg-gray-100 text-gray-500',
};

const MySharedLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [confirmDisable, setConfirmDisable] = useState(null);

  useEffect(() => { fetchLinks(); }, []);

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/my-links`, { withCredentials: true });
      setLinks(res.data.links || []);
    } catch (err) {
      toast.error('Failed to load shared links');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code) => {
    const url = `${window.location.origin}/shared/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      toast.success('Link copied!');
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleDisable = async (code) => {
    try {
      await axios.delete(`${API_URL}/api/links/${code}`, { withCredentials: true });
      setLinks(links.map(l => l.link_code === code ? { ...l, status: 'disabled' } : l));
      toast.success('Link disabled');
    } catch (err) {
      toast.error('Failed to disable link');
    }
    setConfirmDisable(null);
  };

  const activeCount = links.filter(l => l.status === 'active').length;
  const totalDownloads = links.reduce((sum, l) => sum + (l.download_count || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">Shared Links</h2>
        <p className="text-[#7A8A76]">Manage your shareable resource links</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4" data-testid="stat-total-links">
          <p className="text-2xl font-bold text-[#1A2E16]">{links.length}</p>
          <p className="text-sm text-[#7A8A76]">Total Links</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4" data-testid="stat-active-links">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-sm text-[#7A8A76]">Active</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4" data-testid="stat-total-downloads">
          <p className="text-2xl font-bold text-[#2D5A27]">{totalDownloads}</p>
          <p className="text-sm text-[#7A8A76]">Downloads</p>
        </div>
      </div>

      {/* Links list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#2D5A27] animate-spin" />
        </div>
      ) : links.length === 0 ? (
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-12 text-center" data-testid="empty-shared-links">
          <FolderOpen className="w-12 h-12 text-[#8E9E82] mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold text-[#1A2E16] mb-2">No shared links yet</h3>
          <p className="text-[#7A8A76]">Share a resource from My Files to create your first link</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="shared-links-list">
          {links.map(link => (
            <div key={link.link_code} className="bg-white border border-[#E4DFD5] rounded-xl p-4 hover:shadow-md transition-shadow" data-testid={`shared-link-${link.link_code}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-[#1A2E16] truncate">{link.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[link.status] || STATUS_STYLES.disabled}`}>
                      {link.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F2EFE8] text-[#4A5B46]">
                      {TYPE_LABELS[link.resource_type] || link.resource_type}
                    </span>
                    {link.is_paid && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        TZS {link.price?.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A8A76]">
                    <span>{new Date(link.created_at).toLocaleDateString()}</span>
                    <span>{link.download_count}/{link.max_downloads} downloads</span>
                    {link.total_ratings > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {link.avg_rating} ({link.total_ratings})
                      </span>
                    )}
                  </div>

                  {link.description && (
                    <p className="text-xs text-[#7A8A76] mt-1 line-clamp-1">{link.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {link.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleCopy(link.link_code)}
                        className={`p-2 rounded-lg transition-colors ${copiedCode === link.link_code ? 'bg-green-100 text-green-600' : 'text-[#7A8A76] hover:bg-[#F2EFE8] hover:text-[#2D5A27]'}`}
                        title="Copy link"
                        data-testid={`copy-link-${link.link_code}`}
                      >
                        {copiedCode === link.link_code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={`/shared/${link.link_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-[#7A8A76] hover:bg-[#F2EFE8] hover:text-[#2D5A27] transition-colors"
                        title="Open link"
                        data-testid={`open-link-${link.link_code}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  {link.status === 'active' && (
                    <button
                      onClick={() => setConfirmDisable(link.link_code)}
                      className="p-2 rounded-lg text-[#7A8A76] hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Disable link"
                      data-testid={`disable-link-${link.link_code}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm disable modal */}
      {confirmDisable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]" data-testid="disable-confirm-modal">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#1A2E16]">Disable this link?</h3>
                <p className="text-sm text-[#7A8A76] mt-0.5">Visitors will no longer be able to access it.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDisable(null)} className="px-4 py-2 border border-[#E4DFD5] rounded-lg text-[#4A5B46] font-medium hover:bg-[#F2EFE8]" data-testid="disable-cancel-btn">
                Cancel
              </button>
              <button onClick={() => handleDisable(confirmDisable)} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700" data-testid="disable-confirm-btn">
                Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySharedLinks;
