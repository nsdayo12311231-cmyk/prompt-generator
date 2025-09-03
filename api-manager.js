// API統合管理システム
class APIManager {
    constructor() {
        this.apis = [];
        this.currentAPIIndex = 0;
        this.requestCount = {};
        this.lastRequestTime = {};
        
        this.initializeAPIs();
    }
    
    // API初期化
    initializeAPIs() {
        // Gemini API
        if (API_CONFIG.GEMINI.ENABLED) {
            this.apis.push(new GeminiAPI());
        }
        
    }
    
    // 翻訳専用API呼び出し
    async callTranslationAPI(translationPrompt) {
        if (this.apis.length === 0) {
            throw new Error('利用可能なAPIがありません');
        }
        
        const api = this.apis[this.currentAPIIndex];
        
        // レート制限チェック
        if (!this.checkRateLimit(api.name)) {
            throw new Error('翻訳API制限に達しています');
        }
        
        // リクエスト数をカウント
        this.incrementRequestCount(api.name);
        
        try {
            const result = await api.translateText(translationPrompt);
            return result;
        } catch (error) {
            throw error;
        }
    }
    
    // メインのプロンプト生成関数（フォールバック機能付き）
    async generatePrompt(keyword, modelType = 'sd15') {
        let lastError = null;
        
        // 全てのAPIを順番に試行
        for (let i = 0; i < this.apis.length; i++) {
            const api = this.apis[this.currentAPIIndex];
            
            try {
                const result = await this.callWithRetry(api, keyword, modelType);
                
                // 成功した場合
                return result;
                
            } catch (error) {
                lastError = error;
                
                // 次のAPIに切り替え
                this.currentAPIIndex = (this.currentAPIIndex + 1) % this.apis.length;
            }
        }
        
        // 全てのAPIが失敗した場合
        throw new Error(`全てのAPIが利用できません: ${lastError?.message || '不明なエラー'}`);
    }
    
    // リトライ機能付きAPI呼び出し
    async callWithRetry(api, keyword, modelType = 'sd15') {
        let retryCount = 0;
        const maxRetries = API_CONFIG.SYSTEM.RETRY_COUNT;
        
        while (retryCount <= maxRetries) {
            try {
                // レート制限チェック
                if (!this.checkRateLimit(api.name)) {
                    throw new Error('レート制限に達しています');
                }
                
                // リクエスト数をカウント（API呼び出し前）
                this.incrementRequestCount(api.name);
                
                // API呼び出し実行
                const result = await Promise.race([
                    api.generatePrompt(keyword, modelType),
                    this.timeoutPromise(API_CONFIG.SYSTEM.REQUEST_TIMEOUT)
                ]);
                
                return result;
                
            } catch (error) {
                retryCount++;
                
                if (retryCount > maxRetries) {
                    throw error;
                }
                
                // 指数バックオフでリトライ
                const delay = Math.pow(2, retryCount) * 1000;
                await this.sleep(delay);
            }
        }
    }
    
    // タイムアウト処理
    timeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('リクエストタイムアウト'));
            }, timeout);
        });
    }
    
    // レート制限チェック
    checkRateLimit(apiName) {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        
        // 1分前より古い記録を削除
        if (this.requestCount[apiName]) {
            this.requestCount[apiName] = this.requestCount[apiName].filter(
                time => time > oneMinuteAgo
            );
        } else {
            this.requestCount[apiName] = [];
        }
        
        // 制限チェック
        const config = this.getAPIConfig(apiName);
        return this.requestCount[apiName].length < config.MAX_REQUESTS_PER_MINUTE;
    }
    
    // リクエスト数カウント
    incrementRequestCount(apiName) {
        const now = Date.now();
        if (!this.requestCount[apiName]) {
            this.requestCount[apiName] = [];
        }
        this.requestCount[apiName].push(now);
        this.lastRequestTime[apiName] = now;
    }
    
    // API設定取得
    getAPIConfig(apiName) {
        switch (apiName.toLowerCase()) {
            case 'gemini': return API_CONFIG.GEMINI;
            case 'openai': return API_CONFIG.OPENAI;
            case 'claude': return API_CONFIG.CLAUDE;
            default: return null;
        }
    }
    
    // スリープ関数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    
    // 統計情報取得
    getStats() {
        const stats = {};
        this.apis.forEach(api => {
            const count = this.requestCount[api.name] ? this.requestCount[api.name].length : 0;
            const lastRequest = this.lastRequestTime[api.name] || null;
            
            stats[api.name] = {
                requestCount: count,
                lastRequest: lastRequest ? new Date(lastRequest).toISOString() : null
            };
        });
        
        return {
            currentAPI: this.apis[this.currentAPIIndex]?.name || 'none',
            totalAPIs: this.apis.length,
            stats
        };
    }
}

// Gemini API実装
class GeminiAPI {
    constructor() {
        this.name = 'Gemini';
        this.config = API_CONFIG.GEMINI;
    }
    
    async generatePrompt(keyword, modelType = 'sd15') {
        const prompt = this.buildSystemPrompt(keyword, modelType);
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };
        
        const response = await fetch(`${this.config.ENDPOINT}?key=${this.config.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API エラー: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return this.parseResponse(data);
    }
    
    buildSystemPrompt(keyword, modelType = 'sd15') {
        if (modelType === 'illustrious') {
            return `あなたはIllustrious XLモデルのエキスパートです。アニメ・イラストスタイルに特化した最適プロンプトを生成してください。

キーワード: ${keyword}

生成ルール:
- 3-8個の高品質プロンプトを出力
- Illustrious XL特化（アニメ・イラストスタイル）
- 品質タグ: masterpiece, best quality, amazing quality
- 1girl, 1boyなどの数量タグを含める
- アニメ特有の表現を使用
- プロンプトのみ出力（説明無し）

Illustrious XL例示:
美しい女性 → masterpiece, best quality, 1girl, beautiful, anime style, detailed face
笑顔 → smile, happy, cheerful, bright expression, anime, cute
髪型 → beautiful hair, long hair, flowing hair, detailed hair, anime style`;
        } else {
            // SD 1.5用
            return `あなたはSD 1.5モデルのエキスパートです。特に写実系モデル（Beautiful Realistic Asians、ReV Animated等）に最適化したプロンプトを生成してください。

キーワード: ${keyword}

生成ルール:
- 3-8個の高品質プロンプトを出力
- SD 1.5用リアル系・アニメ系最適化
- photorealistic, cinematic, aestheticなどの品質タグ
- 日本人・アジア人特化も考慮
- プロンプトのみ出力（説明無し）

SD 1.5例示:
美しい女性 → beautiful woman, photorealistic, detailed face, cinematic lighting, portrait
笑顔 → smile, happy expression, natural lighting, aesthetic, joyful
日本人女性 → japanese woman, asian beauty, realistic, detailed face, natural makeup`;
        }
    }
    
    parseResponse(data) {
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const generatedText = data.candidates[0].content.parts[0].text;
            const prompts = generatedText
                .replace(/→.*$/gm, '')
                .split(/[\n,]+/)
                .map(prompt => prompt.trim())
                .filter(prompt => prompt.length > 0 && !prompt.includes('キーワード') && !prompt.includes('例:'));
            
            if (prompts.length === 0) {
                throw new Error('有効なプロンプトが生成されませんでした');
            }
            
            return prompts;
        } else {
            throw new Error('Gemini APIからの応答が不正です');
        }
    }
    
    // 翻訳専用メソッド
    async translateText(translationPrompt) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: translationPrompt
                }]
            }]
        };
        
        const response = await fetch(`${this.config.ENDPOINT}?key=${this.config.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Gemini翻訳APIエラー: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const translatedText = data.candidates[0].content.parts[0].text.trim();
            return translatedText;
        } else {
            throw new Error('翻訳APIからの応答が不正です');
        }
    }
    
}



// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIManager, GeminiAPI };
} else {
    window.APIManager = APIManager;
    window.GeminiAPI = GeminiAPI;
}