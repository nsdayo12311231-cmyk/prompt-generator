// Vercel Serverless Function for OpenAI Translation API calls
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    // OpenAI API Key from environment variables (server-side)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    console.log('DEBUG: Translation Environment OPENAI_API_KEY exists:', !!openaiApiKey);
    console.log('DEBUG: Translation Environment OPENAI_API_KEY length:', openaiApiKey?.length || 0);
    
    if (!openaiApiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Translation prompt
    const translationPrompt = `以下の英語のStable Diffusionプロンプトを自然な日本語に翻訳してください。技術的な用語は適切な日本語に置き換えてください。

英語: "${text}"

日本語:`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional translator specializing in Stable Diffusion prompts. Translate English prompts to natural Japanese.'
                    },
                    {
                        role: 'user',
                        content: translationPrompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ 
                error: `OpenAI API error: ${response.status}`,
                details: error 
            });
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const translatedText = data.choices[0].message.content.trim();
            return res.status(200).json({ translation: translatedText });
        } else {
            return res.status(500).json({ error: 'OpenAI翻訳APIからの応答が不正です' });
        }
    } catch (error) {
        console.error('OpenAI Translation API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}