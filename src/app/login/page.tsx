'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('LoginPage: Component mounted - checking authentication state...');

    const handleAuthentication = async () => {
      try {
        // Primero verificar si hay un resultado de redirección pendiente
        console.log('LoginPage: Checking for redirect result...');
        const result = await getRedirectResult(auth);
        console.log('LoginPage: getRedirectResult returned:', result);

        if (result) {
          // Procesar resultado de redirección
          console.log('LoginPage: Processing redirect result...');
          const user = result.user;
          console.log('LoginPage: User authenticated via redirect:', user?.email);

          // Obtener token de Firebase
          const token = await user.getIdToken();
          console.log('LoginPage: Token obtained, length:', token?.length);
          localStorage.setItem('token', token);

          // Extraer datos del perfil de Google
          const displayName = user.displayName || 'Usuario';
          const email = user.email;
          const username = email?.split('@')[0] || 'user';

          console.log('LoginPage: Syncing with backend...');
          console.log('LoginPage: API URL:', process.env.NEXT_PUBLIC_API_URL);

          // Sincronizar con backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sync-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              firebase_uid: user.uid,
              email: email,
              username: username,
              full_name: displayName
            })
          });

          console.log('LoginPage: Backend response status:', response.status);

          if (response.ok) {
            const userData = await response.json();
            console.log('LoginPage: Backend sync successful, user data:', userData);
            console.log('LoginPage: Redirecting to dashboard...');
            router.push('/dashboard');
            return; // Salir para no ejecutar la verificación de usuario actual
          } else {
            const errorData = await response.json();
            console.error('LoginPage: Backend sync error:', errorData);

            if (errorData.detail && errorData.detail.includes('email ya está registrado')) {
              setError('Esta cuenta de Google ya está registrada. Intenta iniciar sesión.');
            } else {
              setError(errorData.detail || 'Error al sincronizar con el servidor');
            }

            // Cerrar sesión de Firebase si hay error
            await auth.signOut();
            localStorage.removeItem('token');
            return;
          }
        }

        // Si no hay resultado de redirección, verificar usuario actual
        console.log('LoginPage: No redirect result, checking current user...');
        const currentUser = auth.currentUser;
        const storedToken = localStorage.getItem('token');
        console.log('LoginPage: Current user:', currentUser?.email || 'None');
        console.log('LoginPage: Stored token exists:', !!storedToken);

        if (currentUser && storedToken) {
          console.log('LoginPage: User already authenticated, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('LoginPage: No authenticated user, staying on login page');
        }

      } catch (error: any) {
        console.error('LoginPage: Error in authentication:', error);
        console.error('LoginPage: Error code:', error.code);
        console.error('LoginPage: Error message:', error.message);

        if (error.code !== 'auth/redirect-cancelled-by-user') {
          setError('Error al iniciar sesión: ' + error.message);
        } else {
          console.log('LoginPage: User cancelled redirect');
        }
      }
    };

    handleAuthentication();
  }, [router]);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    console.log('LoginPage: Starting Google login process...');

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      console.log('LoginPage: Calling signInWithRedirect...');
      await signInWithRedirect(auth, provider);
      console.log('LoginPage: signInWithRedirect completed - should redirect now');
      // La redirección se maneja en useEffect cuando el usuario regresa
    } catch (error: any) {
      console.error('LoginPage: Error in signInWithRedirect:', error);
      console.error('LoginPage: Error code:', error.code);
      console.error('LoginPage: Error message:', error.message);
      setError('Error al iniciar sesión: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">Iniciar Sesión</h1>
        <p className="text-center text-gray-600 mb-8">
          Usa tu cuenta de Google para acceder
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 bg-white rounded p-0.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <p className="text-center text-gray-500 text-sm mt-8">
          Al continuar, aceptas nuestros términos y condiciones
        </p>

        <p className="text-center mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-green-600 hover:text-green-700 font-medium">
            Regístrate aquí
          </Link>
        </p>

        <p className="text-center mt-4">
          <Link href="/" className="text-gray-600 hover:text-gray-700">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
