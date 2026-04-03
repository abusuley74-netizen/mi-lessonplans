import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Gift, Copy, Check, Users, DollarSign, Clock, 
  Share2, ExternalLink, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PLAN_PRICES = { basic: 9999, premium: 19999, master: 29999 };

const TeacherReferAndEarn = ({ currentUser }) => {
  const [codeData, setCodeData] = useState(null);
  const [referrals, setReferrals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [showReferees, setShowReferees] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [codeRes, refRes] = await Promise.all([
        axios.get(`${API_URL}/api/teacher/referral/my-code`, { withCredentials: true }),
        axios.get(`${API_URL}/api/teacher/referral/my-referrals`, { withCredentials: true }),
      ]);
      setCodeData(codeRes.data);
      setReferrals(refRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(''), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    }
  };

  const shareOnSocial = (platform) => {
    if (!codeData) return;
    const text = `Join miLessonPlan - Create amazing lesson plans with AI! Use my referral link:`;
    const url = encodeURIComponent(codeData.referral_link);
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + codeData.referral_link)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Join miLessonPlan')}&body=${encodeURIComponent(text + '\n\n' + codeData.referral_link)}`;
        break;
      default: return;
    }
    window.open(shareUrl, '_blank');
  };

  const fmt = (n) => `TZS ${(n || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="teacher-refer-earn">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">Refer & Earn</h2>
        <p className="text-[#7A8A76]">Share miLessonPlan with fellow teachers and earn 30% commission on every subscription!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="referral-stats">
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-[#7A8A76]">Total Referrals</span>
          </div>
          <p className="text-3xl font-bold text-[#1A2E16]" data-testid="total-referrals">{referrals?.total_referrals || 0}</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-[#7A8A76]">Total Earned</span>
          </div>
          <p className="text-3xl font-bold text-[#1A2E16]" data-testid="total-earned">{fmt(referrals?.total_earned)}</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-[#7A8A76]">Pending Payout</span>
          </div>
          <p className="text-3xl font-bold text-[#1A2E16]" data-testid="pending-payout">{fmt(referrals?.pending_payout)}</p>
        </div>
      </div>

      {/* Referral Code & Link */}
      <div className="bg-white border border-[#E4DFD5] rounded-xl p-6" data-testid="referral-code-section">
        <h3 className="font-heading text-lg font-semibold text-[#1A2E16] mb-4">Your Referral Code</h3>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-[#F2EFE8] rounded-lg px-4 py-3 font-mono text-xl font-bold text-[#2D5A27] tracking-widest text-center" data-testid="referral-code-display">
            {codeData?.referral_code}
          </div>
          <button
            onClick={() => copyToClipboard(codeData?.referral_code, 'code')}
            className="px-4 py-3 bg-[#2D5A27] text-white rounded-lg hover:bg-[#21441C] transition-colors flex items-center gap-2"
            data-testid="copy-code-btn"
          >
            {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === 'code' ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-[#4A5B46] mb-1.5 block">Shareable Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={codeData?.referral_link || ''}
              readOnly
              className="flex-1 px-4 py-2.5 bg-[#FDFBF7] border border-[#E4DFD5] rounded-lg text-sm text-[#4A5B46]"
              data-testid="referral-link-input"
            />
            <button
              onClick={() => copyToClipboard(codeData?.referral_link, 'link')}
              className="px-4 py-2.5 bg-[#D95D39] text-white rounded-lg hover:bg-[#BD4D2D] transition-colors flex items-center gap-2 whitespace-nowrap"
              data-testid="copy-link-btn"
            >
              {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy Link
            </button>
          </div>
        </div>

        {/* Social Share */}
        <div>
          <label className="text-sm font-medium text-[#4A5B46] mb-2 block">Share via</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'whatsapp', label: 'WhatsApp', bg: 'bg-green-500 hover:bg-green-600' },
              { id: 'facebook', label: 'Facebook', bg: 'bg-blue-600 hover:bg-blue-700' },
              { id: 'twitter', label: 'Twitter', bg: 'bg-sky-500 hover:bg-sky-600' },
              { id: 'email', label: 'Email', bg: 'bg-gray-600 hover:bg-gray-700' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => shareOnSocial(s.id)}
                className={`px-4 py-2 text-white text-sm font-medium rounded-lg ${s.bg} transition-colors flex items-center gap-2`}
                data-testid={`share-${s.id}`}
              >
                <Share2 className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Commission Rates */}
      <div className="bg-gradient-to-r from-[#2D5A27] to-[#3d7a35] text-white rounded-xl p-6" data-testid="commission-rates">
        <h3 className="font-heading text-lg font-semibold mb-4">Commission Rates (30%)</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { plan: 'Basic', price: 9999 },
            { plan: 'Premium', price: 19999 },
            { plan: 'Master', price: 29999 },
          ].map(p => (
            <div key={p.plan} className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-sm text-white/70">{p.plan} Plan (TZS {p.price.toLocaleString()}/mo)</p>
              <p className="text-2xl font-bold mt-1">TZS {Math.round(p.price * 0.3).toLocaleString()}</p>
              <p className="text-xs text-white/50">per subscription cycle</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referred Users Table */}
      <div className="bg-white border border-[#E4DFD5] rounded-xl" data-testid="referred-users-section">
        <button 
          className="w-full flex items-center justify-between p-5 text-left"
          onClick={() => setShowReferees(!showReferees)}
        >
          <h3 className="font-heading text-lg font-semibold text-[#1A2E16]">
            Referred Users ({referrals?.total_referrals || 0})
          </h3>
          {showReferees ? <ChevronUp className="w-5 h-5 text-[#7A8A76]" /> : <ChevronDown className="w-5 h-5 text-[#7A8A76]" />}
        </button>
        
        {showReferees && (
          referrals?.referrals?.length > 0 ? (
            <div className="border-t border-[#E4DFD5]">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="referrals-table">
                  <thead>
                    <tr className="bg-[#F9F7F3] text-left text-sm text-[#7A8A76]">
                      <th className="px-5 py-3 font-medium">Teacher</th>
                      <th className="px-5 py-3 font-medium">Plan</th>
                      <th className="px-5 py-3 font-medium">Commission/Cycle</th>
                      <th className="px-5 py-3 font-medium">Total Paid</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4DFD5]">
                    {referrals.referrals.map((r, i) => (
                      <tr key={i} className="hover:bg-[#FDFBF7]">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[#1A2E16]">{r.name}</p>
                          <p className="text-xs text-[#7A8A76]">{r.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            r.plan === 'master' ? 'bg-amber-100 text-amber-800' :
                            r.plan === 'premium' ? 'bg-purple-100 text-purple-700' :
                            r.plan === 'basic' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {r.plan?.charAt(0).toUpperCase() + r.plan?.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-[#2D5A27]">{fmt(r.commission_per_cycle)}</td>
                        <td className="px-5 py-3 text-[#4A5B46]">{fmt(r.total_paid)}</td>
                        <td className="px-5 py-3 text-sm text-[#7A8A76]">{r.joined ? new Date(r.joined).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border-t border-[#E4DFD5] p-8 text-center">
              <Gift className="w-12 h-12 text-[#8E9E82] mx-auto mb-3" />
              <p className="text-[#7A8A76]">No referrals yet</p>
              <p className="text-sm text-[#A0A0A0]">Share your code with fellow teachers to start earning</p>
            </div>
          )
        )}
      </div>

      {/* How It Works */}
      <div className="bg-white border border-[#E4DFD5] rounded-xl p-6" data-testid="how-it-works">
        <h3 className="font-heading text-lg font-semibold text-[#1A2E16] mb-4">How It Works</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: 1, title: 'Share Your Code', desc: 'Send your unique code or link to fellow teachers' },
            { step: 2, title: 'They Sign Up', desc: 'When they register using your link, they\'re linked to you' },
            { step: 3, title: 'They Subscribe', desc: 'When they choose a paid plan, you earn 30% commission' },
            { step: 4, title: 'You Get Paid', desc: 'Commissions are tracked and paid out on schedule' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 bg-[#D95D39] text-white rounded-full flex items-center justify-center font-bold mx-auto mb-2">
                {s.step}
              </div>
              <h4 className="font-medium text-[#1A2E16] text-sm">{s.title}</h4>
              <p className="text-xs text-[#7A8A76] mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherReferAndEarn;
