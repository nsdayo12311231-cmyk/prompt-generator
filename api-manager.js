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
        
        // OpenAI API
        if (API_CONFIG.OPENAI.ENABLED) {
            this.apis.push(new OpenAIAPI());
        }
        
        // Claude API  
        if (API_CONFIG.CLAUDE.ENABLED) {
            this.apis.push(new ClaudeAPI());
        }
        
    }
    
    // メインのプロンプト生成関数（フォールバック機能付き）
    async generatePrompt(keyword) {
        let lastError = null;
        
        // 全てのAPIを順番に試行
        for (let i = 0; i < this.apis.length; i++) {
            const api = this.apis[this.currentAPIIndex];
            
            try {
                const result = await this.callWithRetry(api, keyword);
                
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
    async callWithRetry(api, keyword) {
        let retryCount = 0;
        const maxRetries = API_CONFIG.SYSTEM.RETRY_COUNT;
        
        while (retryCount <= maxRetries) {
            try {
                // レート制限チェック
                if (!this.checkRateLimit(api.name)) {
                    throw new Error('レート制限に達しています');
                }
                
                // API呼び出し実行
                const result = await Promise.race([
                    api.generatePrompt(keyword),
                    this.timeoutPromise(API_CONFIG.SYSTEM.REQUEST_TIMEOUT)
                ]);
                
                // リクエスト数をカウント
                this.incrementRequestCount(api.name);
                
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
    
    async generatePrompt(keyword) {
        const prompt = this.buildSystemPrompt(keyword);
        
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
    
    buildSystemPrompt(keyword) {
        return `日本語キーワードをStable Diffusion用の英語単語・短文に変換してください。

キーワード: ${keyword}

要件:
- 3-8個の候補を出力
- 簡潔な単語または短文のみ
- 改行で区切る
- 説明不要

例:
頭 → head, portrait, face, hair, expression, closeup
悲しい → sad, crying, melancholy, tears, depressed, sorrow, emotional`;
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
    
}



// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIManager, GeminiAPI };
} else {
    window.APIManager = APIManager;
    window.GeminiAPI = GeminiAPI;
}