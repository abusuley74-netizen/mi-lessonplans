import React, { useState, useEffect } from 'react';
import referralService from '../lib/referralService';
import './TeacherReferAndEarn.css';

const TeacherReferAndEarn = ({ currentUser }) => {
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [metrics, setMetrics] = useState({
    totalReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeReferralSystem();
  }, [currentUser]);

  const initializeReferralSystem = async () => {
    try {
      setLoading(true);

      // Generate referral code (simplified - in production, this would be stored in DB)
      const code = `REF_${currentUser.user_id.slice(-8).toUpperCase()}`;
      setReferralCode(code);

      // Generate referral link
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/register?ref=${code}`);

      // Load metrics (for premium teachers, they can see their own referral metrics)
      // Note: This would need backend support for teacher referrals
      setMetrics({
        totalReferrals: 0,
        totalCommission: 0,
        pendingCommission: 0
      });

    } catch (err) {
      setError('Failed to initialize referral system');
      console.error('Error initializing referral system:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  };

  const shareOnSocial = (platform) => {
    const text = `Join MiLesson Plans - Create amazing lesson plans with AI! Use my referral code: ${referralCode}`;
    const url = encodeURIComponent(referralLink);

    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Join MiLesson Plans')}&body=${encodeURIComponent(text + '\n\n' + referralLink)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  if (loading) {
    return <div className="teacher-referrals-loading">Loading referral system...</div>;
  }

  return (
    <div className="teacher-referrals-container">
      <div className="teacher-referrals-header">
        <h2>Refer & Earn</h2>
        <p>Share MiLesson Plans with fellow teachers and earn commissions!</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Commission Overview */}
      <div className="commission-overview">
        <div className="commission-card">
          <h3>Total Referrals</h3>
          <span className="commission-value">{metrics.totalReferrals}</span>
        </div>
        <div className="commission-card">
          <h3>Total Earned</h3>
          <span className="commission-value">{formatCurrency(metrics.totalCommission)}</span>
        </div>
        <div className="commission-card">
          <h3>Pending</h3>
          <span className="commission-value">{formatCurrency(metrics.pendingCommission)}</span>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="referral-code-section">
        <h3>Your Referral Code</h3>
        <div className="referral-code-display">
          <code>{referralCode}</code>
          <button
            className="btn-secondary"
            onClick={() => copyToClipboard(referralCode)}
          >
            Copy Code
          </button>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="referral-link-section">
        <h3>Referral Link</h3>
        <div className="referral-link-display">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="referral-link-input"
          />
          <button
            className="btn-secondary"
            onClick={() => copyToClipboard(referralLink)}
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Share Options */}
      <div className="share-section">
        <h3>Share Your Referral</h3>
        <div className="share-buttons">
          <button
            className="share-btn whatsapp"
            onClick={() => shareOnSocial('whatsapp')}
          >
            📱 WhatsApp
          </button>
          <button
            className="share-btn facebook"
            onClick={() => shareOnSocial('facebook')}
          >
            📘 Facebook
          </button>
          <button
            className="share-btn twitter"
            onClick={() => shareOnSocial('twitter')}
          >
            🐦 Twitter
          </button>
          <button
            className="share-btn email"
            onClick={() => shareOnSocial('email')}
          >
            ✉️ Email
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works">
        <h3>How It Works</h3>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Share Your Code</h4>
              <p>Share your referral code or link with fellow teachers</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>They Sign Up</h4>
              <p>When they register using your code, they're linked to you</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>They Subscribe</h4>
              <p>When they upgrade to Basic or Premium, you earn commission</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>You Get Paid</h4>
              <p>Earn 30% of their subscription revenue every month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Rates */}
      <div className="commission-rates">
        <h3>Commission Rates</h3>
        <div className="rates-table">
          <div className="rate-row">
            <span className="plan-name">Basic Plan (TZS 9,999/month)</span>
            <span className="commission-amount">{formatCurrency(2999.7)}/month</span>
          </div>
          <div className="rate-row">
            <span className="plan-name">Premium Plan (TZS 19,999/month)</span>
            <span className="commission-amount">{formatCurrency(5999.7)}/month</span>
          </div>
          <div className="rate-row">
            <span className="plan-name">Enterprise Plan (TZS 29,999/month)</span>
            <span className="commission-amount">{formatCurrency(8999.7)}/month</span>
          </div>
        </div>
        <p className="commission-note">* 30% commission rate on all subscription revenue</p>
      </div>
    </div>
  );
};

export default TeacherReferAndEarn;