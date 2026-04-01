import { API_BASE_URL } from './utils';

class ReferralService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async createReferral(referralData) {
    try {
      const response = await fetch(`${this.baseURL}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  }

  async getAdminReferrals(adminId) {
    try {
      const response = await fetch(`${this.baseURL}/referrals/admin/${adminId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching admin referrals:', error);
      throw error;
    }
  }

  async updateReferral(referralId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/referrals/${referralId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating referral:', error);
      throw error;
    }
  }

  async deleteReferral(referralId) {
    try {
      const response = await fetch(`${this.baseURL}/referrals/${referralId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting referral:', error);
      throw error;
    }
  }

  async getReferralMetrics(adminId) {
    try {
      const response = await fetch(`${this.baseURL}/referrals/metrics/${adminId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching referral metrics:', error);
      throw error;
    }
  }

  async syncAdminReferrals(adminId) {
    try {
      const response = await fetch(`${this.baseURL}/referrals/sync/${adminId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error syncing referrals:', error);
      throw error;
    }
  }

  // Commission calculation helper
  calculateCommission(plan, months) {
    const planPrices = {
      free: 0,
      basic: 9999,
      premium: 19999,
      enterprise: 29999
    };

    const price = planPrices[plan] || 0;
    const commissionRate = 0.3; // 30%
    return price * months * commissionRate;
  }
}

export default new ReferralService();