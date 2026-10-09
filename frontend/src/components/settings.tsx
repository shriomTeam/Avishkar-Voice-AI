'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useDemo } from '@/lib/demo/provider';
import { dateLabel } from '@/lib/format';
import { Heading, Tabs, Field, Select, Switch, Badge, ResetDemo, FormError } from './ui';
import type { Workspace } from '@/lib/types';
export function WorkspaceForm({ onboarding = false }: { onboarding?: boolean }) {
  const { state, run, busy } = useDemo();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  if (!state) return null;
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = String(data.get('name')).trim();
        const phone = String(data.get('phone')).trim();
        if (!name || !/^\+[1-9]\d{6,14}$/.test(phone)) {
          setError('Enter a workspace name and valid E.164 callback number.');
          return;
        }
        setError('');
        const workspace = {
          ...state.workspace,
          name,
          timezone: String(data.get('timezone')),
          address: onboarding ? state.workspace.address : String(data.get('address')).trim(),
          phone,
        };
        if (
          await run(
            { type: 'save-workspace', workspace },
            onboarding ? 'Demo workspace ready' : 'Workspace settings saved',
          )
        )
          setDone(true);
      }}
    >
      <div className="formtwo">
        <Field
          label="Workspace name"
          name="name"
          required
          maxLength={80}
          pattern=".*\S.*"
          defaultValue={state.workspace.name}
        />
        <Select label="Timezone" name="timezone" defaultValue={state.workspace.timezone}>
          {['America/Los_Angeles', 'Asia/Kolkata', 'UTC'].map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </Select>
      </div>
      {!onboarding && (
        <Field label="Practice address" name="address" defaultValue={state.workspace.address} />
      )}
      <Field
        label="Callback number (E.164)"
        name="phone"
        type="tel"
        required
        pattern="\+[1-9][0-9]{6,14}"
        defaultValue={state.workspace.phone}
      />
      <FormError message={error} />
      <div className="actions">
        <button className="primary" disabled={busy}>
          {onboarding ? 'Create demo workspace' : 'Save changes'}
        </button>
        {done && onboarding && (
          <Link className="button" href="/dashboard/agents">
            Create your first agent →
          </Link>
        )}
      </div>
    </form>
  );
}
function PrivacyForm({ workspace }: { workspace: Workspace }) {
  const { run, busy } = useDemo();
  const [privacy, setPrivacy] = useState(workspace);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void run(
          {
            type: 'save-workspace',
            workspace: {
              ...workspace,
              recordCalls: privacy.recordCalls,
              transcriptRetention: privacy.transcriptRetention,
              recordingRetention: privacy.recordingRetention,
            },
          },
          'Privacy preferences saved in demo',
        );
      }}
    >
      <h2>Call data settings</h2>
      <Switch
        label="Store call recordings"
        description="Only enable after reviewing consent and provider agreements."
        checked={privacy.recordCalls}
        onChange={(recordCalls) => setPrivacy({ ...privacy, recordCalls })}
      />
      <div className="formtwo spaced">
        <Select
          label="Transcript retention"
          value={privacy.transcriptRetention}
          onChange={(e) => setPrivacy({ ...privacy, transcriptRetention: e.target.value })}
        >
          {['30 days', '90 days', '180 days'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Select
          label="Recording retention"
          value={privacy.recordingRetention}
          onChange={(e) => setPrivacy({ ...privacy, recordingRetention: e.target.value })}
        >
          {['7 days', '30 days', '90 days'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
      </div>
      <div className="note">
        These demo preferences do not configure real recording or retention. Existing sample call
        fixtures remain unchanged.
      </div>
      <button className="primary spaced" disabled={busy}>
        Save preferences
      </button>
    </form>
  );
}
export function Settings() {
  const { state } = useDemo();
  const [tab, setTab] = useState('Workspace');
  if (!state) return null;
  return (
    <>
      <Heading
        title="Settings"
        description="Your workspace, team and call data preferences."
        actions={
          <>
            <ResetDemo />
          </>
        }
      />
      <section
        className="panel settings-panel"
        aria-label="Your account"
        style={{ marginBottom: 24 }}
      >
        <div className="panelHead" style={{ marginBottom: 0 }}>
          <div className="inline">
            <div className="avatar dark">JD</div>
            <div>
              <h2>Jamie Davis</h2>
              <small>jamie@example.com · Workspace owner · Demo account</small>
            </div>
          </div>
          <Link className="button" href="/login">
            Sign out
          </Link>
        </div>
      </section>
      <Tabs
        tabs={['Workspace', 'Team', 'Privacy & retention', 'Audit log']}
        value={tab}
        onChange={setTab}
      />
      <section className="panel settings-panel" role="tabpanel" aria-label={tab}>
        {tab === 'Workspace' && (
          <>
            <h2>Workspace details</h2>
            <p className="form-intro">Practice information used across your agents.</p>
            <WorkspaceForm key={JSON.stringify(state.workspace)} />
          </>
        )}
        {tab === 'Team' && (
          <>
            <h2>Workspace team</h2>
            <p>Sample workspace members. Role permissions will be enforced by the backend.</p>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      Jamie Davis<small>jamie@example.com</small>
                    </td>
                    <td>Owner</td>
                    <td>
                      <Badge>Active</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Robin Parker<small>robin@example.com</small>
                    </td>
                    <td>Viewer</td>
                    <td>
                      <Badge>Active</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === 'Privacy & retention' && (
          <PrivacyForm key={JSON.stringify(state.workspace)} workspace={state.workspace} />
        )}
        {tab === 'Audit log' && (
          <>
            <h2>Recent workspace activity</h2>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Actor</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {state.audit.map((event) => (
                    <tr key={event.id}>
                      <td>{event.event}</td>
                      <td>{event.actor}</td>
                      <td>{dateLabel(event.at, state.workspace.timezone)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
