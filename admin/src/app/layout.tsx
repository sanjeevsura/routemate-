'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuthToken } from '../lib/api';
import { 
  ShieldAlert, 
  Users, 
  MapPin, 
  Activity, 
  Compass, 
  LogOut, 
  LayoutDashboard 
} from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') {
    return (
      <html lang="en">
        <body className="bg-slate-900 text-slate-100 min-h-screen">
          {children}
        </body>
      </html>
    );
  }

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Guide Verification', href: '/guides', icon: Users },
    { label: 'Live Sessions', href: '/sessions', icon: Activity },
    { label: 'Route Memory', href: '/route-memory', icon: Compass },
    { label: 'SOS & Safety', href: '/safety', icon: ShieldAlert },
  ];

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 min-h-screen fixed left-0 top-0 bottom-0">
          <div>
            <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/30">
                R
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">RouteMate</h1>
                <span className="text-xs text-blue-400 font-medium tracking-wider uppercase">Admin Portal</span>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="ml-64 flex-1 p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
