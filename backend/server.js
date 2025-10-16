require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rp = require('request-promise')
const redditRoutes = require('./routes/reddit.js')
const commentRoutes = require('./routes/comments.js')

const app = express()
const port = 3000;

let redditToken = null;

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))

// Parse JSON bodies
app.use(express.json())

// Middleware to pass redditToken to reddit routes
app.use('/reddit', (req, res, next) => {
    req.redditToken = redditToken;
    next();
});

app.use('/comments', (req, res, next) => {
    req.redditToken = redditToken;
    next();
});

// Mount reddit routes
app.use('/reddit', redditRoutes);
app.use('/comments', commentRoutes);

app.get('/auth/reddit', (req, res) => {
    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&state=RANDOM&redirect_uri=${process.env.REDIRECT_URI}&duration=permanent&scope=read submit`;
    res.redirect(authUrl)
})

app.get('/auth/callback', async (req, res) => {
    const {code} = req.query;

    const options = {
        method: 'POST',
        uri:'https://www.reddit.com/api/v1/access_token',
        auth: {
            user:process.env.CLIENT_ID,
            pass:process.env.CLIENT_SECRET
        },
        form:{
            grant_type:'authorization_code',
            code,
            redirect_uri:process.env.REDIRECT_URI
        },
        headers:{
            'User-Agent': process.env.USER_AGENT || 'VibeCheckApp/1.0.0 (by /u/unknown)'
        },
        json:true
    }

    try{
        const response = await rp(options)
        
        if (!response.access_token) {
            return res.status(400).send('Failed to get access token from Reddit');
        }
        
        // Store token in memory instead of file
        redditToken = response.access_token;
        res.redirect(`${process.env.FRONTEND_URL}/home`);
    }catch(error){
        console.error('Authentication failed:', error.message);
        res.status(500).send('Authentication failed: ' + error.message);
    }
})

// Route to get the current token
app.get('/token', (req, res) => {
    if (!redditToken) {
        return res.status(404).json({ error: 'No token available. Please authenticate first.' });
    }
    res.json({ token: redditToken });
})

// Route to clear the token (for logout)
app.post('/logout', (req, res) => {
    redditToken = null;
    res.json({ message: 'Logged out successfully' });
})


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})


