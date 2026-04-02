import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Crown, Check, Zap, ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SubscribePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '9,999',
      currency: 'TZS',
      period: 'month',
      lessonLimit: 50,
      features: [
        '50 lesson plans per month',
        'All Free tier features',
        'MyHub access (personal workspace)',
        'File uploads',
        'Scheme of work creation',
        'Notes creation',
        'Templates access',
        'Resource sharing'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '19,999',
      currency: 'TZS',
      period: 'month',
      badge: 'Unlimited',
      lessonLimit: 'Unlimited',
      features: [
        'Unlimited lesson plans',
        'All Basic features',
        'Full resource sharing & monetization',
        'Priority support',
        'Advanced analytics',
        'Custom templates',
        'Bulk operations',
        'Export to multiple formats'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: '29,999',
      currency: 'TZS',
      period: 'month',
      badge: 'Best Value',
      lessonLimit: 'Unlimited',
      features: [
        'Everything in Premium',
        'Team accounts',
        'Custom branding',
        'API access',
        'Dedicated support',
        'White-label options'
      ]
    }
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/subscription/checkout`,
        { plan_id: selectedPlan },
        { withCredentials: true }
      );

      const { checkout_url } = response.data;
      if (checkout_url) {
        toast.success('Redirecting to PesaPal checkout...');
        window.location.href = checkout_url;
        return;
      }
      toast.error('Could not create checkout session. Please try again.');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Payment service unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = user?.subscription_plan || (user?.subscription_status === 'active' ? 'basic' : 'free');
  const isSubscribed = currentPlan !== 'free';

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#7A8A76] hover:text-[#1A2E16] mb-8 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {isSubscribed ? (
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-8 text-center" data-testid="subscribed-card">
            <div className="w-16 h-16 bg-[#2D5A27] rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-[#1A2E16] mb-2">
              You're Subscribed!
            </h1>
            <p className="text-[#7A8A76] mb-2">
              You're on the <strong>{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</strong> plan.
            </p>
            {user?.subscription_expires && (
              <p className="text-sm text-[#7A8A76] mb-6">
                Expires: {new Date(user.subscription_expires).toLocaleDateString()}
              </p>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#2D5A27] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#21441C] transition-colors"
              data-testid="go-to-dashboard-btn"
            >
              Go to Generator
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#D95D39]/10 text-[#D95D39] px-4 py-2 rounded-full mb-4">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Upgrade Your Plan</span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#1A2E16] mb-4">
                Unlock Your Full Potential
              </h1>
              <p className="text-[#4A5B46] text-lg max-w-2xl mx-auto">
                Create unlimited lesson plans, access premium features, and save hours of planning time every week.
              </p>
            </div>

            {/* Plans */}
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative bg-white border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? 'border-[#2D5A27] shadow-lg'
                      : 'border-[#E4DFD5] hover:border-[#8E9E82]'
                  }`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E5A93D] text-[#1A2E16] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold text-[#1A2E16]">
                      {plan.name}
                    </h3>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan.id
                        ? 'bg-[#2D5A27] border-[#2D5A27]'
                        : 'border-[#E4DFD5]'
                    }`}>
                      {selectedPlan === plan.id && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[#1A2E16]">{plan.currency} {plan.price}</span>
                    <span className="text-[#7A8A76]">/{plan.period}</span>
                  </div>

                  <ul className="space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-[#4A5B46]">
                        <Check className="w-4 h-4 text-[#2D5A27] flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Subscribe Button */}
            <div className="text-center">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="bg-[#D95D39] text-white px-12 py-4 rounded-xl font-semibold text-lg hover:bg-[#BD4D2D] transition-colors shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
                data-testid="subscribe-now-btn"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
                ) : (
                  'Subscribe Now via PesaPal'
                )}
              </button>
              <p className="text-[#7A8A76] text-sm mt-4">
                Secure payment via PesaPal. Cancel anytime.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SubscribePage;
