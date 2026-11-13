import { useState } from 'react';
import ProfileSettings from './ProfileSettings';
import StudySettings from './StudySettings';
import NotificationSettings from './NotificationSettings';
import { User, Target, Bell } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'study', label: 'Study Goals', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="w-full max-w-[880px] space-y-4 animate-fade-in">
      {/* Calm Header */}
      <div>
        <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--text)]">Settings</h1>
      </div>

      {/* Calm Tabs */}
      <div className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tb ${activeTab === tab.id ? 'on' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div key={activeTab} className="pt-2 animate-fade-in">
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'study' && <StudySettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
      </div>
    </div>
  );
}
