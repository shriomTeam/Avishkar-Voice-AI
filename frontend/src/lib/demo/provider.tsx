'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { DemoCommand, DemoState } from '@/lib/types';
import { mockDashboardService } from '@/lib/services/mock-dashboard';
const Context = createContext<{
  state: DemoState | null;
  run: (command: DemoCommand, message?: string) => Promise<boolean>;
  notify: (message: string) => void;
  busy: boolean;
  error: string | null;
  retry: () => void;
} | null>(null);
// State intentionally lasts until refresh; no browser persistence/authentication claim.
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null);
  const current = useRef<DemoState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const lock = useRef(false);
  const load = () => {
    setError(null);
    mockDashboardService
      .load()
      .then((s) => {
        current.current = s;
        setState(s);
      })
      .catch(() => setError('Could not load the demo workspace. Please retry.'));
  };
  useEffect(() => {
    let cancelled = false;
    mockDashboardService
      .load()
      .then((s) => {
        if (!cancelled) {
          current.current = s;
          setState(s);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the demo workspace. Please retry.');
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  async function run(command: DemoCommand, message = 'Saved in this demo') {
    if (lock.current || !current.current) return false;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await mockDashboardService.execute(current.current, command);
      current.current = next;
      setState(next);
      setToast(message);
      return true;
    } catch {
      setError('The change could not be saved. Please try again.');
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ state, run, notify: setToast, busy, error, retry: load }}>
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error('DemoProvider is required');
  return value;
}
