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
        systemPrompt = `日本語キーワード「${keyword}」に基づいて、Illustrious XL用のStable Diffusionプロンプトを5-8個作成してください。

重要な指示:
1. 「${keyword}」を適切な英語のSD用語に翻訳する
2. コンセプトに焦点を当てた現実的で使用可能なプロンプトを作成する
3. 適切なSD構文と実証済みの効果的なタグを使用する

ルール:
- 日本語キーワードを1-2個の核となる英単語に翻訳
- その核となる用語を中心にシンプルで効果的なプロンプトを構築
- 基本的なSD要素を含める: キャラクター数、スタイル、主要な視覚的特徴
- 品質タグ: masterpiece, best quality (控えめに使用)
- プロンプトを簡潔で焦点を絞ったものにする

変換例:
可愛い子 → 核となる単語 "cute" → "1girl, cute, anime style, soft features"
笑顔 → 核となる単語 "smile" → "1girl, smile, happy expression, anime"

実用的なSDプロンプトを5-8個生成してください:`;
    } else {
        systemPrompt = `日本語キーワード「${keyword}」に基づいて、SD 1.5用のStable Diffusionプロンプトを5-8個作成してください。

重要な指示:
1. 「${keyword}」を適切な英語のSD用語に翻訳する
2. コンセプトに焦点を当てた現実的で使用可能なプロンプトを作成する
3. 適切なSD 1.5構文と実証済みの効果的なタグを使用する

ルール:
- 日本語キーワードを1-2個の核となる英単語に翻訳
- その核となる用語を中心にシンプルで効果的なプロンプトを構築
- 基本的なSD要素を含める: スタイル、構図、照明
- 品質タグ: photorealistic, detailed (控えめに使用)
- プロンプトを簡潔で焦点を絞ったものにする

変換例:
可愛い子 → 核となる単語 "cute" → "cute girl, soft lighting, portrait"
風景 → 核となる単語 "landscape" → "landscape, natural scenery, outdoor"

実用的なSDプロンプトを5-8個生成してください:`;
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