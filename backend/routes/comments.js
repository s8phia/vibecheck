const express = require('express');
const rp = require('request-promise');
const { analyzeText } = require('../utils/aiAnalysis');

const router = express.Router();

router.get('/posts-with-comments/:subreddit', async (req, res) => {
    const redditToken = req.redditToken;
    
    if (!redditToken) {
        return res.status(401).json({ error: 'Please authenticate first by visiting /auth/reddit' });
    }

    const { subreddit } = req.params;
    const { limit = 10, comments_limit = 50, sort = 'hot' } = req.query;

    try {
        const postsResponse = await rp({
            method: 'GET',
            uri: `https://oauth.reddit.com/r/${subreddit}/${sort}`,
            headers: {
                'Authorization': `Bearer ${redditToken}`,
                'User-Agent': process.env.USER_AGENT || 'VibeCheckApp/1.0.0 (by /u/unknown)'
            },
            qs: {
                limit: limit
            },
            json: true
        });

        const posts = postsResponse.data.children;
        const postsWithComments = [];

        for (const post of posts) {
            try {
                const commentsResponse = await rp({
                    method: 'GET',
                    uri: `https://oauth.reddit.com/comments/${post.data.id}`,
                    headers: {
                        'Authorization': `Bearer ${redditToken}`,
                        'User-Agent': process.env.USER_AGENT || 'VibeCheckApp/1.0.0 (by /u/unknown)'
                    },
                    qs: {
                        limit: comments_limit,
                        depth: 2,
                        sort: 'top'
                    },
                    json: true
                });

                postsWithComments.push({
                    post: post.data,
                    comments: commentsResponse[1] ? commentsResponse[1].data.children : []
                });
            } catch (commentError) {
                console.error(`Failed to fetch comments for post ${post.data.id}:`, commentError.message);
                postsWithComments.push({
                    post: post.data,
                    comments: [],
                    commentError: commentError.message
                });
            }
        }

        res.json({
            subreddit: subreddit,
            sort: sort,
            posts_count: postsWithComments.length,
            analysis_date: new Date().toISOString(),
            data: postsWithComments
        });

    } catch (error) {
        console.error('Reddit Posts with Comments API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch posts with comments: ' + error.message });
    }
});

router.get('/analyze-subreddit/:subreddit', async (req, res) => {
    const redditToken = req.redditToken;
    
    if (!redditToken) {
        return res.status(401).json({ error: 'Please authenticate first by visiting /auth/reddit' });
    }

    const { subreddit } = req.params;
    const { limit = 10, comments_limit = 50, sort = 'hot' } = req.query;

    try {
        console.log(`Starting analysis for r/${subreddit}...`);
        
        // Fetch posts
        const postsResponse = await rp({
            method: 'GET',
            uri: `https://oauth.reddit.com/r/${subreddit}/${sort}`,
            headers: {
                'Authorization': `Bearer ${redditToken}`,
                'User-Agent': process.env.USER_AGENT || 'VibeCheckApp/1.0.0 (by /u/unknown)'
            },
            qs: {
                limit: limit
            },
            json: true
        });

        const posts = postsResponse.data.children;
        const analyzedPosts = [];

        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            console.log(`Analyzing post ${i + 1}/${posts.length}: ${post.data.title.substring(0, 50)}...`);
            
            try {
                // Fetch comments for this post
                const commentsResponse = await rp({
                    method: 'GET',
                    uri: `https://oauth.reddit.com/comments/${post.data.id}`,
                    headers: {
                        'Authorization': `Bearer ${redditToken}`,
                        'User-Agent': process.env.USER_AGENT || 'VibeCheckApp/1.0.0 (by /u/unknown)'
                    },
                    qs: {
                        limit: comments_limit,
                        depth: 2,
                        sort: 'top'
                    },
                    json: true
                });

                const comments = commentsResponse[1] ? commentsResponse[1].data.children : [];
                
                // Analyze post title
                const postTitleAnalysis = await analyzeText(post.data.title);
                
                // Analyze post selftext (if exists)
                const postSelftextAnalysis = post.data.selftext ? 
                    await analyzeText(post.data.selftext) : null;

                // Analyze all comments
                const analyzedComments = [];
                for (const comment of comments) {
                    if (comment.data.body && comment.data.body !== '[deleted]' && comment.data.body !== '[removed]') {
                        const commentAnalysis = await analyzeText(comment.data.body);
                        if (commentAnalysis) {
                            analyzedComments.push({
                                id: comment.data.id,
                                author: comment.data.author,
                                body: comment.data.body,
                                score: comment.data.score,
                                created_utc: comment.data.created_utc,
                                analysis: commentAnalysis
                            });
                        }
                    }
                }

                analyzedPosts.push({
                    post: {
                        id: post.data.id,
                        title: post.data.title,
                        selftext: post.data.selftext,
                        author: post.data.author,
                        score: post.data.score,
                        upvote_ratio: post.data.upvote_ratio,
                        num_comments: post.data.num_comments,
                        created_utc: post.data.created_utc,
                        url: post.data.url,
                        permalink: post.data.permalink
                    },
                    analysis: {
                        title: postTitleAnalysis,
                        selftext: postSelftextAnalysis,
                        comments: analyzedComments
                    }
                });

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (commentError) {
                console.error(`Failed to fetch comments for post ${post.data.id}:`, commentError.message);
                analyzedPosts.push({
                    post: {
                        id: post.data.id,
                        title: post.data.title,
                        selftext: post.data.selftext,
                        author: post.data.author,
                        score: post.data.score,
                        upvote_ratio: post.data.upvote_ratio,
                        num_comments: post.data.num_comments,
                        created_utc: post.data.created_utc,
                        url: post.data.url,
                        permalink: post.data.permalink
                    },
                    analysis: {
                        title: await analyzeText(post.data.title),
                        selftext: post.data.selftext ? await analyzeText(post.data.selftext) : null,
                        comments: [],
                        error: commentError.message
                    }
                });
            }
        }

        // Calculate overall statistics
        const allTexts = [];
        analyzedPosts.forEach(post => {
            if (post.analysis.title) allTexts.push(post.analysis.title);
            if (post.analysis.selftext) allTexts.push(post.analysis.selftext);
            post.analysis.comments.forEach(comment => {
                if (comment.analysis) allTexts.push(comment.analysis);
            });
        });

        const totalAnalyzed = allTexts.length;
        const toxicCount = allTexts.filter(t => t.toxicity && t.toxicity[0] && t.toxicity[0][0] && t.toxicity[0][0].score > 0.5).length;
        const positiveCount = allTexts.filter(t => t.sentiment && t.sentiment[0] && t.sentiment[0][0] && t.sentiment[0][0].label === 'positive').length;
        const negativeCount = allTexts.filter(t => t.sentiment && t.sentiment[0] && t.sentiment[0][0] && t.sentiment[0][0].label === 'negative').length;

        res.json({
            subreddit: subreddit,
            sort: sort,
            analysis_summary: {
                total_posts: analyzedPosts.length,
                total_texts_analyzed: totalAnalyzed,
                toxic_texts: toxicCount,
                positive_texts: positiveCount,
                negative_texts: negativeCount,
                toxicity_rate: totalAnalyzed > 0 ? (toxicCount / totalAnalyzed * 100).toFixed(2) + '%' : '0%',
                positive_rate: totalAnalyzed > 0 ? (positiveCount / totalAnalyzed * 100).toFixed(2) + '%' : '0%',
                negative_rate: totalAnalyzed > 0 ? (negativeCount / totalAnalyzed * 100).toFixed(2) + '%' : '0%'
            },
            analysis_date: new Date().toISOString(),
            data: analyzedPosts
        });

    } catch (error) {
        console.error('Subreddit Analysis Error:', error.message);
        res.status(500).json({ error: 'Failed to analyze subreddit: ' + error.message });
    }
});

module.exports = router; 