const express = require('express');
const rp = require('request-promise');

const router = express.Router();

// Route to fetch Reddit data using the token
router.get('/posts/:subreddit', async (req, res) => {
    // Get the token from the request (passed from server.js)
    const redditToken = req.redditToken;
    
    if (!redditToken) {
        return res.status(401).json({ error: 'Please authenticate first by visiting /auth/reddit' });
    }

    const { subreddit } = req.params;
    const { limit = 500 } = req.query;

    try {
        const response = await rp({
            method: 'GET',
            uri: `https://oauth.reddit.com/r/${subreddit}/hot`,
            headers: {
                'Authorization': `Bearer ${redditToken}`,
                'User-Agent': process.env.USER_AGENT || 'VibeCheckApp/1.0.0 (by /u/unknown)'
            },
            qs: {
                limit: limit
            },
            json: true
        });

        res.json(response);
    } catch (error) {
        console.error('Reddit API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch Reddit data: ' + error.message });
    }
});

module.exports = router;
