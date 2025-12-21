'use client';

import Link from 'next/link';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useNatilleraIdFromPath } from '@/lib/useNatilleraIdFromPath';
import { fetchAPI } from '@/lib/api';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  children?: React.ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const natilleraId = useNatilleraIdFromPath();

  const handleLogout = async () => {
    try {
      // Llamar logout frontend (firebase)
      await logout();
      // Llamar logout backend si existe endpoint
      try {
        await fetchAPI('/auth/logout', { method: 'POST' });
      } catch {}
      setShowMenu(false);
      router.push('/');
    } catch (e) {
      setShowMenu(false);
      // Opcional: mostrar un toast de error
    }
  };

  if (!user) return null;

  return (
    <nav className="navbar-fixed-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-white hover:text-emerald-200 transition-all duration-300 transform hover:scale-105" title="Inicio">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-semibold hidden sm:block">Inicio</span>
            </Link>
            <div className="h-8 w-px bg-white/30"></div>
            <Link
              href={natilleraId ? `/natilleras/${natilleraId}` : '/dashboard'}
              className="flex items-center gap-2 text-white hover:text-emerald-200 transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-xl font-bold">Natillera</span>
            </Link>
          </div>

          {/* Enlaces rápidos solo si estamos en /natilleras/[id] o subrutas */}
          {natilleraId && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-white/20">
              <Link
                href={`/natilleras/${natilleraId}/aportes`}
                className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-white/20 hover:text-white transition-all duration-300 group"
                title="Aportes"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-xs font-semibold mt-1">Aportes</span>
              </Link>
              {children}
            </div>
          )}

          <div className="flex items-center space-x-4">
            {natilleraId && <NotificationBell />}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 text-white hover:text-emerald-200 transition-all duration-300 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-white/20"
              >
                <div className="w-8 h-8 bg-emerald-200/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </span>
                </div>
                <span className="font-medium hidden sm:block">{user?.full_name ?? ''}</span>
                <svg className={`w-4 h-4 transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-600">
                          {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user?.full_name ?? ''}</p>
                        <p className="text-xs text-gray-600">{user?.email ?? ''}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
