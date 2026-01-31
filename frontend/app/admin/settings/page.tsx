'use client';

import { API_URL } from '@/lib/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import useAuth from '../hooks/useAuth';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
  assignedEvents?: string[];
  tasks?: string[];
}

interface SettingsState {
  profile: {
    displayName: string;
    contactEmail: string;
    phone: string;
    timezone: string;
  };
  notifications: {
    newRegistrations: boolean;
    paymentAlerts: boolean;
    contactInquiries: boolean;
    dailySummary: boolean;
    capacityWarnings: boolean;
  };
  security: {
    enforceMfa: boolean;
    strongPasswords: boolean;
    sessionTimeout: string;
    allowedIps: string;
  };
  display: {
    projectorMode: boolean;
    compactTables: boolean;
    reduceAnimations: boolean;
  };
  system: {
    logLevel: string;
    dataRetentionDays: string;
    cacheTtlMinutes: string;
  };
  maintenance: {
    backupTime: string;
    backupRetention: string;
  };
}

const defaultSettings: SettingsState = {
  profile: {
    displayName: '',
    contactEmail: '',
    phone: '',
    timezone: 'Asia/Kolkata',
  },
  notifications: {
    newRegistrations: true,
    paymentAlerts: true,
    contactInquiries: true,
    dailySummary: false,
    capacityWarnings: true,
  },
  security: {
    enforceMfa: false,
    strongPasswords: true,
    sessionTimeout: '120',
    allowedIps: '',
  },
  display: {
    projectorMode: false,
    compactTables: false,
    reduceAnimations: false,
  },
  system: {
    logLevel: 'info',
    dataRetentionDays: '180',
    cacheTtlMinutes: '15',
  },
  maintenance: {
    backupTime: '02:00',
    backupRetention: '30',
  },
};

const STORAGE_KEY = 'xianze_admin_settings';

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white/70 p-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const { token, isAdmin } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [savedAt, setSavedAt] = useState<string>('');
  const [siteUrl, setSiteUrl] = useState<string>('');

  // Registration control state
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationSaving, setRegistrationSaving] = useState(false);

  const assignedEventsLabel = useMemo(() => {
    if (!user) return 'Not assigned';
    if (user.assignedEvent) return user.assignedEvent;
    if (user.assignedEvents?.length) return user.assignedEvents.join(', ');
    return 'Not assigned';
  }, [user]);

  // Fetch registration status
  const fetchRegistrationStatus = useCallback(async () => {
    if (!token) return;
    setRegistrationLoading(true);
    try {
      const res = await fetch(`${API_URL}/settings/registration-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrationOpen(data.isOpen);
      }
    } catch {
      // Ignore errors; UI will remain in last known state
    } finally {
      setRegistrationLoading(false);
    }
  }, [token]);

  // Toggle registration status
  const toggleRegistration = async () => {
    if (!token || !isAdmin) return;
    setRegistrationSaving(true);
    try {
      const res = await fetch(`${API_URL}/settings/registration-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOpen: !registrationOpen }),
      });
      if (res.ok) {
        setRegistrationOpen(!registrationOpen);
      }
    } catch {
      // Ignore errors; UI will remain in last known state
    } finally {
      setRegistrationSaving(false);
    }
  };

  useEffect(() => {
    fetchRegistrationStatus();
  }, [fetchRegistrationStatus]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SettingsState;
        setSettings(parsed);
      } catch {
        setSettings(defaultSettings);
      }
    }

    if (typeof window !== 'undefined') {
      setSiteUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setSettings((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        displayName: prev.profile.displayName || user.name,
        contactEmail: prev.profile.contactEmail || `${user.username}@xianze.tech`,
      },
    }));
  }, [user]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (settings.display.projectorMode) {
      root.classList.add('projector-mode');
    } else {
      root.classList.remove('projector-mode');
    }
  }, [settings.display.projectorMode]);

  const handleToggle = (section: keyof SettingsState, key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleInput = (section: keyof SettingsState, key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSavedAt(new Date().toLocaleString());
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
    setSavedAt('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Fine-tune access, notifications, and admin experience for XIANZE."
        actions={
          <>
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </>
        }
      />

      {/* Registration Control - Admin Only */}
      {isAdmin && (
        <Card className="border-2 border-primary-100 bg-primary-50/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Registration Control</h2>
              <p className="text-sm text-gray-500">
                Open or close event registrations for participants.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {registrationLoading ? (
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              ) : (
                <>
                  <Badge variant={registrationOpen ? 'green' : 'red'} className="text-sm px-3 py-1">
                    {registrationOpen ? 'Open' : 'Closed'}
                  </Badge>
                  <Button
                    variant={registrationOpen ? 'danger' : 'primary'}
                    onClick={toggleRegistration}
                    disabled={registrationSaving}
                  >
                    {registrationSaving
                      ? 'Saving...'
                      : registrationOpen
                        ? 'Close Registrations'
                        : 'Open Registrations'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profile & Access</h2>
                <p className="text-sm text-gray-500">
                  Update your admin contact details and view access scope.
                </p>
              </div>
              {user && (
                <Badge variant={user.role} className="text-xs">
                  {user.role}
                </Badge>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Display name"
                value={settings.profile.displayName}
                onChange={(event) => handleInput('profile', 'displayName', event.target.value)}
              />
              <Input
                label="Contact email"
                type="email"
                value={settings.profile.contactEmail}
                onChange={(event) => handleInput('profile', 'contactEmail', event.target.value)}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={settings.profile.phone}
                onChange={(event) => handleInput('profile', 'phone', event.target.value)}
              />
              <Select
                label="Timezone"
                value={settings.profile.timezone}
                onChange={(event) => handleInput('profile', 'timezone', event.target.value)}
                options={[
                  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
                  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
                  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
                  { value: 'Europe/London', label: 'Europe/London (GMT)' },
                  { value: 'America/New_York', label: 'America/New_York (EST)' },
                ]}
              />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Username</p>
                  <p className="text-sm font-semibold text-gray-900">{user?.username || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Assigned events</p>
                  <p className="text-sm font-semibold text-gray-900">{assignedEventsLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Tasks</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.tasks?.length ? user.tasks.join(', ') : 'No tasks assigned'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Changes on this page are stored locally in your browser until backend sync is wired.
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
              <p className="text-sm text-gray-500">Live configuration snapshot for deployment.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Environment</span>
                <span className="font-semibold text-gray-900">
                  {process.env.NEXT_PUBLIC_ENV || 'production'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">API base</span>
                <span className="font-semibold text-gray-900 truncate max-w-[160px]">
                  {API_URL || 'Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Site URL</span>
                <span className="font-semibold text-gray-900 truncate max-w-[160px]">
                  {siteUrl || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">SSL status</span>
                <Badge variant="purple">managed</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs text-gray-500">
              Use <span className="font-semibold text-gray-700">./deploy.sh prod</span> for a safe
              redeploy. Add <span className="font-semibold text-gray-700">--full</span> only when
              you need to restart every container.
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              <p className="text-sm text-gray-500">Choose which alerts reach your inbox.</p>
            </div>
            <div className="space-y-3">
              <ToggleRow
                label="New registrations"
                description="Notify when a participant registers."
                checked={settings.notifications.newRegistrations}
                onChange={(value) => handleToggle('notifications', 'newRegistrations', value)}
              />
              <ToggleRow
                label="Payment alerts"
                description="Get notified when a payment needs verification."
                checked={settings.notifications.paymentAlerts}
                onChange={(value) => handleToggle('notifications', 'paymentAlerts', value)}
              />
              <ToggleRow
                label="Contact inquiries"
                description="Alert the team when a new inquiry arrives."
                checked={settings.notifications.contactInquiries}
                onChange={(value) => handleToggle('notifications', 'contactInquiries', value)}
              />
              <ToggleRow
                label="Daily summary"
                description="Daily rollup of registrations and payments."
                checked={settings.notifications.dailySummary}
                onChange={(value) => handleToggle('notifications', 'dailySummary', value)}
              />
              <ToggleRow
                label="Capacity warnings"
                description="Warn when an event is nearing capacity."
                checked={settings.notifications.capacityWarnings}
                onChange={(value) => handleToggle('notifications', 'capacityWarnings', value)}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Security & Compliance</h2>
              <p className="text-sm text-gray-500">Guardrails for team access and sessions.</p>
            </div>
            <div className="space-y-3">
              <ToggleRow
                label="Enforce MFA"
                description="Require multi-factor authentication for admin roles."
                checked={settings.security.enforceMfa}
                onChange={(value) => handleToggle('security', 'enforceMfa', value)}
              />
              <ToggleRow
                label="Strong passwords"
                description="Require 12+ characters and mixed-case passwords."
                checked={settings.security.strongPasswords}
                onChange={(value) => handleToggle('security', 'strongPasswords', value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Session timeout (minutes)"
                  value={settings.security.sessionTimeout}
                  onChange={(event) =>
                    handleInput('security', 'sessionTimeout', event.target.value)
                  }
                  options={[
                    { value: '30', label: '30 minutes' },
                    { value: '60', label: '1 hour' },
                    { value: '120', label: '2 hours' },
                    { value: '240', label: '4 hours' },
                  ]}
                />
                <Input
                  label="Allowed IP ranges"
                  placeholder="192.168.0.0/24"
                  value={settings.security.allowedIps}
                  onChange={(event) => handleInput('security', 'allowedIps', event.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Display & Experience</h2>
              <p className="text-sm text-gray-500">
                Tune the admin UI for desks, kiosks, or live presentations.
              </p>
            </div>
            <div className="space-y-3">
              <ToggleRow
                label="Projector mode"
                description="Boost font size and contrast for big screens."
                checked={settings.display.projectorMode}
                onChange={(value) => handleToggle('display', 'projectorMode', value)}
              />
              <ToggleRow
                label="Compact tables"
                description="Reduce padding for dense lists."
                checked={settings.display.compactTables}
                onChange={(value) => handleToggle('display', 'compactTables', value)}
              />
              <ToggleRow
                label="Reduce animations"
                description="Minimize motion for low-power devices."
                checked={settings.display.reduceAnimations}
                onChange={(value) => handleToggle('display', 'reduceAnimations', value)}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Maintenance & Data</h2>
              <p className="text-sm text-gray-500">Backup cadence and retention policy.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Log level"
                value={settings.system.logLevel}
                onChange={(event) => handleInput('system', 'logLevel', event.target.value)}
                options={[
                  { value: 'info', label: 'Info' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'error', label: 'Error' },
                  { value: 'debug', label: 'Debug' },
                ]}
              />
              <Input
                label="Data retention (days)"
                type="number"
                min={30}
                value={settings.system.dataRetentionDays}
                onChange={(event) => handleInput('system', 'dataRetentionDays', event.target.value)}
              />
              <Input
                label="Cache TTL (minutes)"
                type="number"
                min={5}
                value={settings.system.cacheTtlMinutes}
                onChange={(event) => handleInput('system', 'cacheTtlMinutes', event.target.value)}
              />
              <Input
                label="Backup time"
                type="time"
                value={settings.maintenance.backupTime}
                onChange={(event) => handleInput('maintenance', 'backupTime', event.target.value)}
              />
              <Input
                label="Backup retention (days)"
                type="number"
                min={7}
                value={settings.maintenance.backupRetention}
                onChange={(event) =>
                  handleInput('maintenance', 'backupRetention', event.target.value)
                }
              />
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs text-gray-500">
              Backups are stored on the server volume. Configure external snapshots if you need
              off-site redundancy.
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
        <span>
          {savedAt ? `Last saved on ${savedAt}` : 'No saved changes yet'} · Settings are stored per
          browser session.
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top
          </Button>
        </div>
      </div>
    </div>
  );
}
