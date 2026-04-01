import React, { useState } from 'react';
import axios from 'axios';
import { X, Check, Crown, Zap, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SubscriptionModal = ({ isOpen, onClose }) => {
  const { refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const plans = {
    basic: {
      id: 'basic',
      name: 'Basic Plan',
      price: '9,999',
      currency: 'TZS',
      period: '/month',
      lessonLimit: 50,
      features: [
        'All Free tier features',
        'MyHub access (personal workspace)',
        'File uploads',
        'Limited resource sharing',
        'Scheme of work creation',
        'Notes creation',
        'Templates access',
        'Resource monetization capabilities'
      ]
    },
    premium: {
      id: 'premium',
      name: 'Premium Plan',
      price: '19,999',
      currency: 'TZS',
      period: '/month',
      lessonLimit: 'Unlimited',
      features: [
        'Unlimited lesson plans',
        'All Basic features',
        'Full resource sharing',
        'Priority support',
        'Advanced analytics',
        'Custom templates',
        'Bulk operations',
        'Export to multiple formats',
        'Full monetization features'
      ]
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/subscription/checkout`,
        { plan_id: selectedPlan },
        { withCredentials: true }
      );

      const { checkout_url } = response.data;
      if (!checkout_url) {
        throw new Error('No checkout URL returned from server');
      }

      toast.success('Redirecting to PesaPal checkout...');
      window.location.href = checkout_url;
    } catch (error) {
      console.error('Subscription checkout error:', error);
      toast.error('Subscription checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div 
        className="relative overflow-hidden bg-[#1A2E16] text-white rounded-2xl max-w-2xl w-full"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/33145086/pexels-photo-33145086.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#1A2E16]/90"></div>

        {/* Content */}
        <div className="relative p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            data-testid="close-subscription-modal"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#D95D39] rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-3xl font-bold mb-2">Upgrade to Pro</h2>
            <p className="text-white/70">
              Unlock unlimited lesson plans and premium features
            </p>
          </div>

          {/* Plan Selection */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {Object.values(plans).map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                  selectedPlan === plan.id
                    ? 'border-[#D95D39] bg-white/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
                data-testid={`plan-${plan.id}`}
              >
                {plan.badge && (
                  <span className="absolute -top-2 -right-2 bg-[#E5A93D] text-[#1A2E16] text-xs font-bold px-2 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {selectedPlan === plan.id ? (
                    <div className="w-5 h-5 bg-[#D95D39] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-white/40 rounded-full"></div>
                  )}
                  <span className="font-semibold">{plan.name}</span>
                </div>
                <div className="mb-3">
                  <span className="text-2xl font-bold">{plan.currency} {plan.price}</span>
                  <span className="text-white/60">{plan.period}</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                      <Check className="w-4 h-4 text-[#8E9E82]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Features List */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-[#E5A93D]" />
              <span className="font-semibold">All Pro Features</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {plans[selectedPlan].features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                  <Star className="w-3 h-3 text-[#8E9E82]" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-[#D95D39] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#BD4D2D] transition-colors disabled:opacity-50"
            data-testid="subscribe-btn"
          >
            {loading ? 'Processing...' : `Subscribe for ${plans[selectedPlan].currency} ${plans[selectedPlan].price}${plans[selectedPlan].period}`}
          </button>

          <p className="text-center text-white/50 text-xs mt-4">
            Demo Mode • Real payment integration coming with PesaPal
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
