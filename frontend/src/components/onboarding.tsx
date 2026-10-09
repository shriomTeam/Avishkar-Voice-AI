'use client';
import Link from 'next/link';
import { Brand, DemoBoundary } from './ui';
import { WorkspaceForm } from './settings';
export function Onboarding() {
  return (
    <main className="onboarding-page">
      <Brand />
      <div className="auth onboarding">
        <span className="badge pale">Workspace setup · 1 of 1</span>
        <h1 className="spaced">Let’s meet your practice.</h1>
        <p className="form-intro">
          Your agents use these details to greet callers. Sample information only.
        </p>
        <section className="panel">
          <DemoBoundary>
            <WorkspaceForm onboarding />
          </DemoBoundary>
        </section>
        <Link className="backlink spaced" href="/login">
          ← Back to sign-in
        </Link>
      </div>
    </main>
  );
}
