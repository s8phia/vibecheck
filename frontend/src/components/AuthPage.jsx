import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
    const { checkAuthStatus, isAuthenticated } = useAuth();

    const handleRedditLogin = () => {
        window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/reddit`;
    }

    // Check if user is already authenticated when component mounts
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // Redirect to home if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            window.location.href = '/home';
        }
    }, [isAuthenticated]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h1 style={{marginBottom: '20px', color: '#333'}}>VibeCheck</h1>
            <p style={{marginBottom: '30px', fontSize: '18px', color: '#666', maxWidth: '500px'}}>
                Analyze subreddit toxicity and sentiment with AI-powered insights. 
                Login with Reddit to get started!
            </p>
            <button 
                onClick={handleRedditLogin}
                style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#FF4500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                Login with Reddit
            </button>
            <p style={{marginTop: '20px', fontSize: '14px', color: '#999'}}>
                You'll be redirected to Reddit to authorize the app
            </p>
        </div>
    );
}

export default AuthPage;