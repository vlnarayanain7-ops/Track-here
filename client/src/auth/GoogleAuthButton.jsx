import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export function GoogleAuthButton({ buttonText = 'Continue with Google' }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const btnContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    let mounted = true;
    const interval = setInterval(() => {
      if (window.google?.accounts?.id && btnContainerRef.current && mounted) {
        clearInterval(interval);
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              if (!response?.credential) return;
              try {
                setLoading(true);
                const user = await googleLogin(response.credential);
                toast.success('Signed in with Google!');
                if (!user?.ageBand) {
                  navigate('/complete-profile', { replace: true });
                } else if (!user?.subjects || user.subjects.length === 0) {
                  navigate('/onboarding', { replace: true });
                } else {
                  navigate('/', { replace: true });
                }
              } catch (err) {
                let msg = err.response?.data?.message;
                if (!msg) {
                  if (!err.response) {
                    msg = 'Backend server is unreachable. Please ensure "npm run dev" is running in your terminal.';
                  } else if (err.response.status === 503) {
                    msg = 'Backend server is initializing. Please try again in a few seconds.';
                  } else if (err.response.status === 500) {
                    msg = 'Backend server is reconnecting. Please try again.';
                  } else {
                    msg = err.message || 'Google authentication failed';
                  }
                }
                toast.error(msg);
              } finally {
                setLoading(false);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          btnContainerRef.current.innerHTML = '';
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          window.google.accounts.id.renderButton(btnContainerRef.current, {
            type: 'standard',
            shape: 'rectangular',
            theme: isDark ? 'filled_black' : 'outline',
            text: 'continue_with',
            size: 'large',
            width: '100%',
          });
          setGsiReady(true);
        } catch (e) {
          console.error('[Google GSI Error]', e);
          setGsiReady(false);
        }
      }
    }, 150);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [clientId, googleLogin, navigate]);

  function handleFallbackClick() {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  }

  if (!clientId) return null;
  return (
    <>
      <div className="w-full">
        {/* Render container for official Google Identity Services iframe */}
        <div
          ref={btnContainerRef}
          className={clientId && gsiReady ? 'w-full flex justify-center min-h-[44px]' : 'hidden'}
        />

        {/* Fallback button when GSI button is not yet rendered or during loading */}
        {(!gsiReady || loading) && (
          <button
            type="button"
            onClick={handleFallbackClick}
            disabled={loading}
            className="w-full h-11 px-4 border border-[var(--ln)] rounded-lg bg-[var(--sf)] hover:bg-[var(--sf2)] text-[var(--ink)] font-medium text-sm flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-50"
            aria-label={buttonText}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="var(--google-blue)"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="var(--google-green)"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="var(--google-yellow)"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="var(--google-red)"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Signing in...' : buttonText}</span>
          </button>
        )}
      </div>

      {/* Quick Setup Modal if Client ID is missing */}
    </>
  );
}

export default GoogleAuthButton;

