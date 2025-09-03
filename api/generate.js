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
        systemPrompt = `「${keyword}」を1つの英単語に変換してから、その単語をベースにしたシンプルなStable Diffusion プロンプトを5-8個作成してください。

## 変換ルール:
1. 「${keyword}」→ 1つの核となる英単語 (例: 可愛い子 → cute)
2. その1単語 + 基本的なSDタグのみで構成
3. 長い説明文は不要、単語の羅列のみ

## 出力形式:
各プロンプトは以下の構造:
[核となる英単語], 1girl/1boy, [基本タグ2-3個], [スタイルタグ]

## 例:
可愛い子 → 核単語"cute"
- cute, 1girl, masterpiece, anime
- cute, 1girl, smile, soft_lighting
- cute, 1girl, portrait, detailed

シンプルで実用的なプロンプト5-8個を生成:`;
    } else {
        systemPrompt = `「${keyword}」を1つの英単語に変換してから、その単語をベースにしたシンプルなSD 1.5プロンプトを5-8個作成してください。

## 変換ルール:
1. 「${keyword}」→ 1つの核となる英単語 (例: 可愛い子 → cute)
2. その1単語 + 基本的なSDタグのみで構成
3. 長い説明文は不要、単語の羅列のみ

## 出力形式:
各プロンプトは以下の構造:
[核となる英単語], [基本タグ2-3個], [スタイルタグ]

## 例:
可愛い子 → 核単語"cute"
- cute, portrait, photorealistic, detailed
- cute, girl, soft_lighting, natural
- cute, face, cinematic, high_quality

シンプルで実用的なプロンプト5-8個を生成:`;
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