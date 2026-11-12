import { useState } from 'react';
import ProfileSettings from './ProfileSettings';
import StudySettings from './StudySettings';
import NotificationSettings from './NotificationSettings';
import DataSettings from './DataSettings';
import { Settings, User, Target, Bell, Database } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'study', label: 'Study Goals', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Backup', icon: Database },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header */}
      <div className="flex items-start gap-3 pb-3 border-b border-border/60">
        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-border/80 shrink-0">
          <Settings className="w-5 h-5 text-text-secondary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Settings</h1>
          <p className="text-[11px] text-text-muted mt-0.5">
            Manage your account profile, study parameters, notifications and backups
          </p>
        </div>
      </div>

      {/* Premium Tabs */}
      <div className="flex bg-surface/50 p-1 rounded-xl border border-border/60 w-fit overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-card text-text-primary shadow-sm border border-border/80'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div key={activeTab} className="animate-fade-in">
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'study' && <StudySettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'data' && <DataSettings />}
      </div>
    </div>
  );
}
