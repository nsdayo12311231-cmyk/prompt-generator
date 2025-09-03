// Vercel Serverless Function for OpenAI API calls
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

    const { keyword, modelType = 'sd15' } = req.body;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    // OpenAI API Key from environment variables (server-side)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Build system prompt based on model type
    let systemPrompt;
    if (modelType === 'illustrious') {
        systemPrompt = `Generate 3-8 high-quality Stable Diffusion prompts optimized for Illustrious XL model (anime/illustration style).

Keyword: ${keyword}

Rules:
- Illustrious XL specialized (anime/illustration style)
- Include quality tags: masterpiece, best quality, amazing quality
- Include count tags like 1girl, 1boy when appropriate
- Use anime-specific expressions
- Output prompts only (no explanations)

Examples:
beautiful woman → masterpiece, best quality, 1girl, beautiful, anime style, detailed face
smile → smile, happy, cheerful, bright expression, anime, cute`;
    } else {
        systemPrompt = `Generate 3-8 high-quality Stable Diffusion prompts optimized for SD 1.5 models (realistic/anime mixed).

Keyword: ${keyword}

Rules:
- SD 1.5 optimization for realistic and anime styles
- Include quality tags: photorealistic, cinematic, aesthetic
- Consider Japanese/Asian specialization
- Output prompts only (no explanations)

Examples:
beautiful woman → beautiful woman, photorealistic, detailed face, cinematic lighting, portrait
smile → smile, happy expression, natural lighting, aesthetic, joyful`;
    }

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
                        content: 'You are an expert Stable Diffusion prompt generator.'
                    },
                    {
                        role: 'user',
                        content: systemPrompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
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
            const generatedText = data.choices[0].message.content;
            const prompts = generatedText
                .split(/[\n,]+/)
                .map(prompt => prompt.trim())
                .filter(prompt => prompt.length > 0 && !prompt.includes('Keyword') && !prompt.includes('Example'));
            
            if (prompts.length === 0) {
                return res.status(500).json({ error: '有効なプロンプトが生成されませんでした' });
            }
            
            return res.status(200).json({ prompts });
        } else {
            return res.status(500).json({ error: 'OpenAI APIからの応答が不正です' });
        }
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}