import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, School, MapPin, Save, Check, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    school: '',
    location: '',
    bio: ''
  });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">Profile Settings</h2>
        <p className="text-[#7A8A76]">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-6 text-center">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-[#E4DFD5]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#2D5A27] flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <h3 className="font-heading font-bold text-xl text-[#1A2E16]">{user?.name}</h3>
            <p className="text-[#7A8A76] text-sm mb-4">{user?.email}</p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2EFE8] rounded-full">
              <span className={`w-2 h-2 rounded-full ${user?.subscription_status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-sm font-medium text-[#4A5B46]">
                {user?.subscription_status === 'active' ? 'Pro Member' : 'Free Account'}
              </span>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-6 bg-white border border-[#E4DFD5] rounded-xl p-6">
            <h4 className="font-medium text-[#1A2E16] mb-4">Account Actions</h4>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-6">
            <h3 className="font-heading font-semibold text-[#1A2E16] mb-6">Edit Profile</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#4A5B46] mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-[#E4DFD5] rounded-lg focus:outline-none focus:border-[#2D5A27]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4A5B46] mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  disabled
                  className="w-full p-3 border border-[#E4DFD5] rounded-lg bg-[#F8F8F8] text-[#7A8A76] cursor-not-allowed"
                />
                <p className="text-xs text-[#A0A0A0] mt-1">Email cannot be changed (linked to Google account)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4A5B46] mb-2">
                  <School className="w-4 h-4 inline mr-2" />
                  School/Institution
                </label>
                <input
                  type="text"
                  name="school"
                  value={profile.school}
                  onChange={handleChange}
                  placeholder="Enter your school name"
                  className="w-full p-3 border border-[#E4DFD5] rounded-lg focus:outline-none focus:border-[#2D5A27]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4A5B46] mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="e.g., Dar es Salaam, Tanzania"
                  className="w-full p-3 border border-[#E4DFD5] rounded-lg focus:outline-none focus:border-[#2D5A27]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4A5B46] mb-2">
                  Bio / About
                </label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full p-3 border border-[#E4DFD5] rounded-lg focus:outline-none focus:border-[#2D5A27] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E4DFD5]">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors ${
                    saved
                      ? 'bg-green-500 text-white'
                      : 'bg-[#2D5A27] text-white hover:bg-[#21441C]'
                  }`}
                >
                  {saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved!
                    </>
                  ) : saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
