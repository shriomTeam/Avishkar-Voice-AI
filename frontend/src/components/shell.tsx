'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  Phone,
  List,
  Mic,
  Code,
  Brackets,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { Brand, DemoBoundary } from './ui';
import { useDemo } from '@/lib/demo/provider';
export const navigation = [
  { path: '/dashboard', name: 'Overview', icon: LayoutDashboard },
  { path: '/dashboard/agents', name: 'Voice agents', icon: Bot },
  { path: '/dashboard/numbers', name: 'Phone numbers', icon: Phone },
  { path: '/dashboard/calls', name: 'Call history', icon: List },
  { path: '/dashboard/test', name: 'Test studio', icon: Mic },
  { path: '/dashboard/tools', name: 'Tools', icon: Code },
  { path: '/dashboard/variables', name: 'Variables', icon: Brackets },
  { path: '/dashboard/settings', name: 'Settings', icon: Settings },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state } = useDemo();
  const active = navigation.find((item) =>
    item.path === '/dashboard' ? pathname === item.path : pathname.startsWith(item.path),
  );
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="workspace">
          <div className="avatar">{state?.workspace.name[0] || 'B'}</div>
          <div>
            <strong>{state?.workspace.name || 'Voice workspace'}</strong>
            <small>Voice workspace</small>
          </div>
        </div>
        <div className="navlabel">WORKSPACE</div>
        <nav aria-label="Workspace navigation">
          {navigation.map(({ path, name, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              className={active?.path === path ? 'active' : ''}
              aria-current={active?.path === path ? 'page' : undefined}
            >
              <Icon size={19} />
              {name}
            </Link>
          ))}
        </nav>
        <div className="sidebottom">
          <div className="pilot">
            <strong>V1 design prototype</strong>
            <p>Sample data · simulated actions</p>
          </div>
          <Link className="profile" href="/dashboard/settings">
            <div className="avatar dark">JD</div>
            <div>
              <strong>Jamie Davis</strong>
              <small>Workspace owner</small>
            </div>
          </Link>
        </div>
      </aside>
      <div className="shell">
        <header>
          <span className="breadcrumb">
            Workspace <ChevronRight size={13} /> <strong>{active?.name || 'Page guide'}</strong>
          </span>
          <div className="headerRight">
            <span className="badge pale">Design preview</span>
            <Link className="button" href="/dashboard/test">
              <Mic size={15} />
              Test agent
            </Link>
          </div>
        </header>
        <main id="main-content">
          <DemoBoundary>{children}</DemoBoundary>
        </main>
        <footer>
          Avishkar Voice <span>Demo workspace · No real calls or patient data</span>
          <Link href="/dashboard/guide">Page guide</Link>
        </footer>
      </div>
    </>
  );
}
