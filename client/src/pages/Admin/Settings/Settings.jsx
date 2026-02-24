/**
 * Frontend page: Settings
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Save, RefreshCcw, Shield, Settings2, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/services/api';

function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
        <Icon className="h-5 w-5 text-gray-700" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {desc ? <p className="text-sm text-gray-600 mt-1">{desc}</p> : null}
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const res = await api.getAdminSettings();
      const s = res?.settings || {};
      setSettings(s);
      setDraft(JSON.parse(JSON.stringify(s)));
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const dirty = useMemo(() => {
    try {
      return JSON.stringify(settings || {}) !== JSON.stringify(draft || {});
    } catch {
      return false;
    }
  }, [settings, draft]);

  const update = (path, value) => {
    setDraft((prev) => {
      const next = prev ? { ...prev } : {};
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        cur[k] = { ...(cur[k] || {}) };
        cur = cur[k];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      // Only send allowed sections (backend validates too)
      const payload = {
        branding: draft.branding,
        contact: draft.contact,
        features: draft.features,
        security: draft.security,
      };
      const res = await api.updateAdminSettings(payload);
      const s = res?.settings || draft;
      setSettings(s);
      setDraft(JSON.parse(JSON.stringify(s)));
      setStatus('Settings saved successfully.');
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure platform-level options for ShasthoAI (stored in Firestore).</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading || saving}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button onClick={save} disabled={!dirty || loading || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}
      {status ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{status}</div> : null}

      {loading || !draft ? (
        <div className="text-gray-600">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Branding */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <SectionHeader
                icon={Settings2}
                title="Branding"
                desc="Display name and tagline used across the platform."
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>App name</Label>
                  <Input
                    value={draft.branding?.appName || ''}
                    onChange={(e) => update('branding.appName', e.target.value)}
                    placeholder="ShasthoAI"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Tagline</Label>
                  <Input
                    value={draft.branding?.tagline || ''}
                    onChange={(e) => update('branding.tagline', e.target.value)}
                    placeholder="AI-powered fracture detection and telemedicine-ready workflows"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card>
            <CardHeader>
              <SectionHeader
                icon={Shield}
                title="Security & maintenance"
                desc="Operational switches for admin use."
              />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">Maintenance mode</div>
                  <div className="text-sm text-gray-600 mt-1">
                    When enabled, you can use this flag in UI/logic to show maintenance banners.
                  </div>
                </div>
                <Switch
                  checked={!!draft.security?.maintenanceMode}
                  onCheckedChange={(v) => update('security.maintenanceMode', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <SectionHeader
                icon={Mail}
                title="Support contact"
                desc="These values can be used in footer pages or contact widgets."
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Support email
                  </Label>
                  <Input
                    type="email"
                    value={draft.contact?.supportEmail || ''}
                    onChange={(e) => update('contact.supportEmail', e.target.value)}
                    placeholder="support@shasthoai.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone
                  </Label>
                  <Input
                    value={draft.contact?.phone || ''}
                    onChange={(e) => update('contact.phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </Label>
                  <Input
                    value={draft.contact?.address || ''}
                    onChange={(e) => update('contact.address', e.target.value)}
                    placeholder="123 Medical Center Drive, Healthcare City, HC 12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature flags */}
          <Card>
            <CardHeader>
              <SectionHeader
                icon={Settings2}
                title="Feature flags"
                desc="Turn modules on/off (stored; enforcement depends on your app logic)."
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[{
                  key: 'telemedicine',
                  label: 'Telemedicine workflows',
                }, {
                  key: 'doctorPanel',
                  label: 'Doctor panel',
                }, {
                  key: 'pharmacyPanel',
                  label: 'Pharmacy panel',
                }, {
                  key: 'store',
                  label: 'Store & orders',
                }, {
                  key: 'messaging',
                  label: 'Messaging',
                }].map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                    <Switch
                      checked={!!draft.features?.[item.key]}
                      onCheckedChange={(v) => update(`features.${item.key}`, v)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                These settings are stored in Firestore (<code className="px-1 bg-gray-100 rounded">platform_settings/main</code>). They are safe to
                edit and won’t modify existing business logic unless you choose to read these values elsewhere.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700">
                Tip: You can use feature flags to conditionally hide modules in the UI (Store, Pharmacy, Messaging) without changing your core
                architecture. If you want, tell me which modules should be enforced and I can wire these flags into route guards safely.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
