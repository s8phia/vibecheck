import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.get('/login', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.REDDIT_CLIENT_ID,
        response_type: 'code',
        state: 'random_state_string',
        redirect_uri: process.env.REDDIT_REDIRECT_URI,
        duration: 'temporary',
        scope: 'read identity',
    });

    res.redirect(`https://www.reddit.com/api/v1/authorize?${params}`);
});

router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code) return res.status(400).send('No code found');

    try {
        const auth = Buffer.from(
            `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
        ).toString('base64');


        const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.REDDIT_REDIRECT_URI,
            }),
        });

        const token = await tokenRes.json();

        const userRes = await fetch('https://oauth.reddit.com/api/v1/me', {
            headers: {
                Authorization: `Bearer ${token.access_token}`,
                'User-Agent': 'vibecheck by YOUR_REDDIT_USERNAME',
            },
        });

        const userInfo = await userRes.json();

        console.log('Authenticated user:', userInfo);

        res.send(`
            <h1>Reddit OAuth Success!</h1>
            <p>Username: ${userInfo.name}</p>
            <p>Access Token: ${token.access_token}</p>
        `);
    } catch (err) {
        console.error('OAuth error:', err);
        res.status(500).send('OAuth failed');
    }
});

export default router;
