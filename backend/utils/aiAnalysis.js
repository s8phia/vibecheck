const fetch = require('node-fetch');

const HF_TOKEN = process.env.HF_TOKEN;

async function callHFModel(model, text) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (HF_TOKEN) {
        headers['Authorization'] = `Bearer ${HF_TOKEN}`;
    }
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ inputs: text }),
    });
    return response.json();
}

async function analyzeText(text) {
    if (!text || text.trim().length === 0) {
        return null;
    }

    try {
        const [toxicity, sentiment] = await Promise.all([
            callHFModel("unitary/toxic-bert", text),
            callHFModel("cardiffnlp/twitter-roberta-base-sentiment-latest", text)
        ]);

        return {
            text: text,
            toxicity: toxicity,
            sentiment: sentiment,
            analyzed_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error analyzing text:', error);
        return {
            text: text,
            error: 'Failed to analyze text',
            analyzed_at: new Date().toISOString()
        };
    }
}

module.exports = {
    analyzeText,
    callHFModel
};
