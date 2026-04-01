import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Crown, Check, AlertCircle } from 'lucide-react';

const PaymentSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const subscriptionPlan = user?.subscription_plan || (user?.subscription_status === 'active' ? 'basic' : 'free');

  const plans = [
    {
      id: 'free',
      name: 'Free Tier',
      price: '0',
      currency: 'TZS',
      period: '/month',
      features: [
        '20 lesson plans per month',
        'Core lesson planning tools',
        'Print lesson plans',
        'No MyHub, uploads, or monetization'
      ],
      current: subscriptionPlan === 'free'
    },
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '9,999',
      currency: 'TZS',
      period: '/month',
      features: [
        '50 lesson plans per month',
        'MyHub access',
        'File uploads',
        'Scheme of Work and Notes',
        'Templates access'
      ],
      current: subscriptionPlan === 'basic'
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '19,999',
      currency: 'TZS',
      period: '/month',
      features: [
        'Unlimited lesson plans',
        'Full resource sharing',
        'Priority support',
        'Advanced analytics',
        'Monetization features'
      ],
      current: subscriptionPlan === 'premium'
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">Payment Settings</h2>
        <p className="text-[#7A8A76]">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-[#2D5A27] to-[#3d7a35] text-white rounded-xl p-6 mb-8">
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
                ? 'Upgrade to Basic or Premium for more lesson generation and MyHub features.'
                : subscriptionPlan === 'basic'
                ? 'You have 50 lessons per month and core workspace features.'
                : 'You have unlimited lesson plans and advanced monetization features.'}
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white border rounded-xl p-6 relative ${
              plan.current ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/20' : 'border-[#E4DFD5]'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E5A93D] text-[#1A2E16] text-xs font-bold px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            )}
            {plan.current && (
              <span className="absolute -top-3 right-4 bg-[#2D5A27] text-white text-xs font-bold px-3 py-1 rounded-full">
                Current Plan
              </span>
            )}
            
            <h3 className="font-heading text-lg font-bold text-[#1A2E16] mb-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-[#1A2E16]">{plan.currency} {plan.price}</span>
              <span className="text-[#7A8A76]">{plan.period}</span>
            </div>
            
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#4A5B46]">
                  <Check className="w-4 h-4 text-[#2D5A27] mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {!plan.current && plan.id !== 'free' && (
              <button
                onClick={() => navigate('/subscribe')}
                className="w-full py-2.5 bg-[#D95D39] text-white rounded-lg font-medium hover:bg-[#BD4D2D] transition-colors"
              >
                Upgrade
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Payment Info Notice */}
      <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#F59E0B] mt-0.5" />
        <div>
          <h4 className="font-medium text-[#92400E]">Payment Integration Coming Soon</h4>
          <p className="text-sm text-[#B45309]">
            PesaPal integration is being set up. Currently running in demo mode.
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-8 bg-white border border-[#E4DFD5] rounded-xl">
        <div className="p-4 border-b border-[#E4DFD5]">
          <h3 className="font-heading font-semibold text-[#1A2E16]">Transaction History</h3>
        </div>
        <div className="p-8 text-center">
          <CreditCard className="w-12 h-12 text-[#8E9E82] mx-auto mb-4" />
          <p className="text-[#7A8A76]">No transactions yet</p>
          <p className="text-sm text-[#A0A0A0]">Your payment history will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;
