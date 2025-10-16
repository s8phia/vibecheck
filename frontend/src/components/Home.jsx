import { useState } from 'react';

const Home = () => {
    const [subreddit, setSubreddit] = useState('');
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);

    const handleAnalyze = async () => {
        if (!subreddit.trim()) return;
        
        setAnalysisLoading(true);
        setAnalysisError(null);
        setAnalysisData(null);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/comments/analyze-subreddit/${subreddit}?limit=5&comments_limit=20`);
            if (!response.ok) {
                throw new Error('Failed to analyze subreddit');
            }
            const data = await response.json();
            setAnalysisData(data);
        } catch (error) {
            setAnalysisError(error.message);
            console.error('Error analyzing subreddit:', error);
        } finally {
            setAnalysisLoading(false);
        }
    }
    return (
        <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
            <h1>VibeCheck - Reddit Analysis</h1>
            <div style={{marginBottom: '20px'}}>
                <div style={{marginBottom: '10px'}}>Enter a subreddit to analyze its vibe</div>
                <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                    <input 
                        type="text" 
                        placeholder="Enter subreddit name (e.g., AskReddit)" 
                        value={subreddit}
                        onChange={(e) => setSubreddit(e.target.value)}
                        disabled={analysisLoading}
                        style={{flex: 1, padding: '10px', fontSize: '16px'}}
                    />
                    <button 
                        type="button" 
                        onClick={handleAnalyze} 
                        disabled={analysisLoading || !subreddit.trim()}
                        style={{padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px'}}
                    >
                        {analysisLoading ? 'Analyzing...' : 'AI Analyze'}
                    </button>
                </div>
            </div>
            
            {analysisError && <div style={{color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px'}}>Analysis Error: {analysisError}</div>}
            
            {/* AI Analysis Results */}
            {analysisData && (
                <div style={{marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
                    <h2>🤖 AI Analysis Results for r/{analysisData.subreddit}</h2>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px'}}>
                        <div style={{padding: '15px', backgroundColor: 'white', borderRadius: '6px', textAlign: 'center'}}>
                            <h3 style={{margin: '0 0 10px 0', color: '#333'}}>Texts Analyzed</h3>
                            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#4CAF50'}}>{analysisData.analysis_summary.total_texts_analyzed}</div>
                        </div>
                        <div style={{padding: '15px', backgroundColor: 'white', borderRadius: '6px', textAlign: 'center'}}>
                            <h3 style={{margin: '0 0 10px 0', color: '#333'}}>Toxicity Rate</h3>
                            <div style={{fontSize: '24px', fontWeight: 'bold', color: analysisData.analysis_summary.toxicity_rate > '10%' ? '#f44336' : '#4CAF50'}}>
                                {analysisData.analysis_summary.toxicity_rate}
                            </div>
                        </div>
                        <div style={{padding: '15px', backgroundColor: 'white', borderRadius: '6px', textAlign: 'center'}}>
                            <h3 style={{margin: '0 0 10px 0', color: '#333'}}>Positive Rate</h3>
                            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#4CAF50'}}>{analysisData.analysis_summary.positive_rate}</div>
                        </div>
                        <div style={{padding: '15px', backgroundColor: 'white', borderRadius: '6px', textAlign: 'center'}}>
                            <h3 style={{margin: '0 0 10px 0', color: '#333'}}>Negative Rate</h3>
                            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#f44336'}}>{analysisData.analysis_summary.negative_rate}</div>
                        </div>
                    </div>
                    
                    <div style={{marginTop: '20px'}}>
                        <h3>📊 Detailed Analysis</h3>
                        {analysisData.data.map((postData, index) => (
                            <div key={index} style={{border: '1px solid #ddd', margin: '15px 0', padding: '15px', backgroundColor: 'white', borderRadius: '6px'}}>
                                <h4 style={{margin: '0 0 10px 0', color: '#333'}}>{postData.post.title}</h4>
                                <div style={{display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '14px', color: '#666'}}>
                                    <span>Score: {postData.post.score}</span>
                                    <span>Comments: {postData.post.num_comments}</span>
                                    <span>Author: u/{postData.post.author}</span>
                                </div>
                                
                                {/* Post Analysis */}
                                <div style={{marginBottom: '15px'}}>
                                    <strong>Post Analysis:</strong>
                                    {postData.analysis.title && (
                                        <div style={{marginLeft: '10px', fontSize: '14px'}}>
                                            <div>Title Sentiment: {postData.analysis.title.sentiment?.[0]?.[0]?.label || 'Unknown'} 
                                                ({postData.analysis.title.sentiment?.[0]?.[0]?.score ? (postData.analysis.title.sentiment[0][0].score * 100).toFixed(1) + '%' : 'N/A'})
                                            </div>
                                            <div>Toxicity: {postData.analysis.title.toxicity?.[0]?.[0]?.score ? (postData.analysis.title.toxicity[0][0].score * 100).toFixed(1) + '%' : 'N/A'}</div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Comments Analysis */}
                                {postData.analysis.comments.length > 0 && (
                                    <div>
                                        <strong>Top Comments Analysis ({postData.analysis.comments.length} analyzed):</strong>
                                        <div style={{maxHeight: '200px', overflowY: 'auto', marginTop: '10px'}}>
                                            {postData.analysis.comments.slice(0, 5).map((comment, commentIndex) => (
                                                <div key={commentIndex} style={{border: '1px solid #eee', margin: '5px 0', padding: '8px', fontSize: '12px', backgroundColor: '#fafafa'}}>
                                                    <div style={{fontWeight: 'bold', marginBottom: '5px'}}>u/{comment.author} (Score: {comment.score})</div>
                                                    <div style={{marginBottom: '5px'}}>{comment.body.substring(0, 100)}{comment.body.length > 100 ? '...' : ''}</div>
                                                    <div style={{color: '#666'}}>
                                                        Sentiment: {comment.analysis.sentiment?.[0]?.[0]?.label || 'Unknown'} | 
                                                        Toxicity: {comment.analysis.toxicity?.[0]?.[0]?.score ? (comment.analysis.toxicity[0][0].score * 100).toFixed(1) + '%' : 'N/A'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

}

export default Home;