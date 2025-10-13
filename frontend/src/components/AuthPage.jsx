const AuthPage = () => {

    const handleRedditLogin = () => {
        window.location.href = 'http://localhost:3000/auth/reddit';
    }
    return (
        <div>
          <h1>VibeCheck</h1>
          <p>Analyze subreddit toxicity and get moderation suggestions</p>
          <button onClick={handleRedditLogin}>
            Login with Reddit
          </button>
        </div>
      );
}

export default AuthPage;