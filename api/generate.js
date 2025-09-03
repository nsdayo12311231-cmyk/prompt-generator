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
    
    console.log('DEBUG: Environment OPENAI_API_KEY exists:', !!openaiApiKey);
    console.log('DEBUG: Environment OPENAI_API_KEY length:', openaiApiKey?.length || 0);
    console.log('DEBUG: Received keyword:', keyword);
    console.log('DEBUG: Model type:', modelType);
    
    if (!openaiApiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Build system prompt based on model type
    let systemPrompt;
    if (modelType === 'illustrious') {
        systemPrompt = `あなたは実用的なStable Diffusion (amanatsu対応) プロンプト生成の専門家です。

日本語キーワード「${keyword}」から実用的なIllustrious XLプロンプトを5-8個作成してください。

## 作成手順:
1. キーワード「${keyword}」の核となる英語表現を特定
2. 関連する具体的なタグを組み合わせる
3. 実際のSD生成で効果的な単語のみを使用

## 必須要素:
- 基本タグ: 1girl/1boy, masterpiece, best quality
- 具体的な視覚描写 (表情・ポーズ・服装・背景等)
- キーワードに対応する専門用語

## タグ例参考:
**表情**: seductive smile, smirk, half-closed eyes, confident expression
**ポーズ**: side glance, looking back, over the shoulder, scratching head
**背景**: beach, ocean, sandy beach, horizon, blue sky

実際にSDで生成可能な具体的プロンプト5-8個を出力:`;
    } else {
        systemPrompt = `あなたは実用的なStable Diffusion 1.5プロンプト生成の専門家です。

日本語キーワード「${keyword}」から実用的なSD 1.5プロンプトを5-8個作成してください。

## 作成手順:
1. キーワード「${keyword}」の核となる英語表現を特定
2. リアル系・アニメ系の両方に対応する具体的なタグを組み合わせる
3. 実際のSD 1.5生成で効果的な単語のみを使用

## 必須要素:
- 基本タグ: photorealistic/anime style, detailed, high quality
- 具体的な視覚描写 (構図・照明・スタイル等)
- キーワードに対応する専門用語

## タグ例参考:
**人物**: young girl, cute face, soft features, natural lighting
**風景**: landscape photography, natural scenery, outdoor view, scenic composition
**照明**: soft lighting, natural lighting, cinematic lighting

実際にSD 1.5で生成可能な具体的プロンプト5-8個を出力:`;
    }

    console.log('DEBUG: Generated system prompt:', systemPrompt);

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
                temperature: 0.2
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
            console.log('DEBUG: OpenAI生成テキスト:', generatedText);
            
            const prompts = generatedText
                .split(/\n/)
                .map(prompt => prompt.trim())
                .filter(prompt => prompt.length > 0 && !prompt.includes('Keyword') && !prompt.includes('Example'))
                .map(prompt => prompt.replace(/^\d+\.\s*[""]?/, '').replace(/[""]?$/, ''))
                .filter(prompt => prompt.length > 10)
                .slice(0, 10);
            
            if (prompts.length === 0) {
                return res.status(500).json({ error: '有効なプロンプトが生成されませんでした' });
            }
            
            console.log('DEBUG: 処理後プロンプト配列:', prompts);
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