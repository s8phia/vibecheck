const express = require('express');
const axios = require('axios');

const router = express.Router();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

router.post('/', async (req, res) => {
    try {
        const { subredditData } = req.body;
        
        if (!subredditData || !Array.isArray(subredditData)) {
            return res.status(400).json({ error: 'subredditData array is required' });
        }

        const formattedData = subredditData.map(subreddit => {
            const { name, toxicity_rate, positive_rate, negative_rate, total_texts_analyzed } = subreddit;
            return `r/${name}: ${total_texts_analyzed} texts analyzed, ${toxicity_rate} toxic, ${positive_rate} positive, ${negative_rate} negative`;
        }).join('\n');

        const systemPrompt = `You are a helpful assistant that gives suggestions to better improve the toxicity and sentiment of subreddits for Reddit moderators.

You will be given a list of subreddits and their current toxicity and sentiment scores.

Here are the subreddits and their current toxicity and sentiment scores:
${formattedData}

Please provide specific, actionable suggestions for each subreddit to:
1. Reduce toxicity levels
2. Improve overall sentiment
3. Create a more positive community environment

Focus on practical moderation strategies, community guidelines, and engagement techniques but keep it concise and to the point.`

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Give me suggestions to improve the toxicity and sentiment of the subreddits' }
            ]
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`
            }
        }
    );

        res.json(response.data.choices[0].message.content);
    } catch (error) {
        console.error('Error getting suggestions:', error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
});

module.exports = router;