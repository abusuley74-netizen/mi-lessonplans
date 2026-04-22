import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Crown, Check, Loader2, ExternalLink, Clock, Zap, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PLAN_BADGES = {
  basic: { icon: Zap, color: 'bg-blue-500' },
  premium: { icon: Star, color: 'bg-purple-600' },
  master: { icon: Crown, color: 'bg-amber-600' },
};

const PaymentSettings = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [subscribing, setSubscribing] = useState(null);

  const rawPlan = user?.subscription_plan || (user?.subscription_status === 'active' ? 'basic' : 'free');
  const subscriptionPlan = rawPlan === 'enterprise' ? 'master' : rawPlan;
  const isSubscribed = subscriptionPlan !== 'free';

  const plans = [
    {
      id: 'free',
      name: 'Free Tier',
      price: '0',
      currency: 'TZS',
      period: '/month',
      features: [
        '10 lesson plans per month',
        'My Files & Profile',
        'My Activities',
      ]
    },
    {
      id: 'basic',
      name: 'Basic Plan',
      badge: 'Starter',
      price: '9,999',
      currency: 'TZS',
      period: '/month',
      features: [
        '50 lesson plans per month',
        'Create Notes',
        'Resource sharing',
        'My Activities',
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      badge: 'Pro',
      popular: true,
      price: '19,999',
      currency: 'TZS',
      period: '/month',
      features: [
        'Unlimited lesson plans',
        'Templates & Dictation',
        'Upload Materials & Scheme of Work',
        'Full resource sharing',
      ]
    },
    {
      id: 'master',
      name: 'Master Plan',
      badge: 'Elite',
      price: '29,999',
      currency: 'TZS',
      period: '/month',
      features: [
        'Everything in Premium',
        'Binti Hamdani+ (AI Test Generator)',
        'Refer & Earn access',
        'Dedicated support',
      ]
    }
  ];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      await axios.get(`${API_URL}/api/subscription/plans`);
    } catch {
      // Silent fail
    }
    setLoadingTx(false);
  };

  const handleSubscribeClick = async (planId) => {
    setSubscribing(planId);
    
    // Demo upgrade — bypasses payment for testing
    try {
      const demoRes = await axios.post(
        `${API_URL}/api/subscription/demo-upgrade`,
        { plan_id: planId }
      );
      if (demoRes.data.success) {
        toast.success(`Upgraded to ${planId}! Refreshing...`);
        setTimeout(() => window.location.reload(), 1000);
        return;
      }
    } catch {
      // Fall through to real checkout
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/subscription/checkout`,
        { 
          plan_id: planId
          // No phone number needed for PesaPal
        },
        {  }
      );

      const { checkout_url, message } = response.data;
      if (checkout_url) {
        toast.success('Redirecting to PesaPal checkout...');
        // Redirect to PesaPal checkout page
        window.location.href = checkout_url;
      } else {
        toast.error(message || 'Could not create checkout. Please try again.');
        setSubscribing(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Payment service unavailable. Please try again later.');
      setSubscribing(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">Payment Settings</h2>
        <p className="text-[#7A8A76]">Manage your subscription and billing</p>
      </div>

      {/* Current Plan Banner */}
      <div className="bg-gradient-to-r from-[#2D5A27] to-[#3d7a35] text-white rounded-xl p-6 mb-8" data-testid="current-plan-banner">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            {isSubscribed ? <Crown className="w-7 h-7" /> : <CreditCard className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold">
              {subscriptionPlan === 'free' ? 'Free Tier' : `${subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} Plan Active`}
            </h3>
            <p className="text-white/80">
              {subscriptionPlan === 'free'
                ? 'Upgrade to Basic, Premium, or Master for more features.'
                : subscriptionPlan === 'basic'
                ? 'You have 50 lessons per month and core workspace features.'
                : subscriptionPlan === 'premium'
                ? 'You have unlimited lesson plans and advanced features.'
                : 'You have full Master features including Refer & Earn and dedicated support.'}
            </p>
            {user?.subscription_expires && (
              <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expires: {new Date(user.subscription_expires).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="plans-grid">
        {plans.map((plan) => {
          const isCurrent = subscriptionPlan === plan.id;
          const badgeInfo = PLAN_BADGES[plan.id];
          const BadgeIcon = badgeInfo?.icon;
          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-xl p-5 relative transition-shadow hover:shadow-md ${
                isCurrent ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/20' : 'border-[#E4DFD5]'
              } ${plan.popular ? 'ring-2 ring-purple-200' : ''}`}
              data-testid={`plan-card-${plan.id}`}
            >
              {plan.badge && badgeInfo && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 ${badgeInfo.color} text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1`}>
                  <BadgeIcon className="w-3 h-3" />
                  {plan.badge}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-3 bg-[#2D5A27] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Current
                </span>
              )}

              <h3 className="font-heading text-lg font-bold text-[#1A2E16] mb-2 mt-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-2xl font-bold text-[#1A2E16]">{plan.currency} {plan.price}</span>
                <span className="text-sm text-[#7A8A76]">{plan.period}</span>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#4A5B46]">
                    <Check className="w-4 h-4 text-[#2D5A27] mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2 text-center text-sm text-[#2D5A27] font-medium bg-[#2D5A27]/10 rounded-lg">
                  Current Plan
                </div>
              ) : plan.id !== 'free' ? (
                  <button
                    onClick={() => handleSubscribeClick(plan.id)}
                    disabled={subscribing === plan.id}
                    className="w-full py-2.5 bg-[#D95D39] text-white rounded-lg font-medium hover:bg-[#BD4D2D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid={`subscribe-btn-${plan.id}`}
                  >
                    {subscribing === plan.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                    ) : (
                      <>Upgrade</>
                    )}
                  </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* PesaPal Payment Info */}
      <div className="bg-[#EFF6FF] border border-[#3B82F6]/30 rounded-xl p-4 flex items-start gap-3 mb-8" data-testid="pesapal-info">
        <ExternalLink className="w-5 h-5 text-[#3B82F6] mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-[#1E40AF]">PesaPal Payment Integration</h4>
          <p className="text-sm text-[#1D4ED8]">
            Payments are processed securely via PesaPal. You'll be redirected to PesaPal's checkout page when you upgrade.
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-[#E4DFD5] rounded-xl" data-testid="transaction-history">
        <div className="p-4 border-b border-[#E4DFD5]">
          <h3 className="font-heading font-semibold text-[#1A2E16]">Transaction History</h3>
        </div>
        {transactions.length > 0 ? (
          <div className="divide-y divide-[#E4DFD5]">
            {transactions.map((tx, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1A2E16]">{tx.plan_id} Plan</p>
                  <p className="text-xs text-[#7A8A76]">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#1A2E16]">TZS {tx.amount?.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-[#8E9E82] mx-auto mb-4" />
            <p className="text-[#7A8A76]">No transactions yet</p>
            <p className="text-sm text-[#A0A0A0]">Your payment history will appear here after your first purchase</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSettings;
