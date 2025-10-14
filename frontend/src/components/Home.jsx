import { useState } from 'react';

const Home = () => {
    const [subreddit, setSubreddit] = useState('');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reddit/posts/${subreddit}`);
            if(!response.ok){
                throw new Error('Failed to fetch posts');
            }
            const data = await response.json();
            setPosts(data.data.children); // Set the posts data
        } catch(error){
            setError(error.message);
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }


    }
    return (
        <div>
            <div>Enter a subreddit to get started</div>
            <form onSubmit={handleSubmit}>
                <input 
                type="text" 
                placeholder="Subreddit" 
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Analyze'}
                </button>
            </form>
            
            {error && <div style={{color: 'red', marginTop: '10px'}}>Error: {error}</div>}
            
            {posts.length > 0 && (
                <div style={{marginTop: '20px'}}>
                    <h3>Posts from r/{subreddit}:</h3>
                    {posts.map((post, index) => (
                        <div key={index} style={{border: '1px solid #ccc', margin: '10px 0', padding: '10px'}}>
                            <h4>{post.data.title}</h4>
                            <p>Score: {post.data.score} | Comments: {post.data.num_comments}</p>
                            <p>{post.data.selftext}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

}

export default Home;