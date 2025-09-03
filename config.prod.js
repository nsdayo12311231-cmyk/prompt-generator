// 本番環境用API設定ファイル
// VercelのEnvironment Variablesから設定を取得

const API_CONFIG = {
    // メインAPI: Gemini
    GEMINI: {
        API_KEY: getEnvVar('GEMINI_API_KEY') || 'YOUR_GEMINI_API_KEY_HERE',
        ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
        MAX_REQUESTS_PER_MINUTE: 60,
        ENABLED: true
    },
    
    // 代替API 1: OpenAI GPT-3.5-turbo
    OPENAI: {
        API_KEY: getEnvVar('OPENAI_API_KEY') || 'YOUR_OPENAI_API_KEY_HERE',
        ENDPOINT: 'https://api.openai.com/v1/chat/completions',
        MODEL: 'gpt-3.5-turbo',
        MAX_REQUESTS_PER_MINUTE: 60,
        ENABLED: false // 環境変数があれば有効化
    },
    
    // 代替API 2: Claude
    CLAUDE: {
        API_KEY: getEnvVar('CLAUDE_API_KEY') || 'YOUR_CLAUDE_API_KEY_HERE',
        ENDPOINT: 'https://api.anthropic.com/v1/messages',
        MODEL: 'claude-3-haiku-20240307',
        MAX_REQUESTS_PER_MINUTE: 50,
        ENABLED: false // 環境変数があれば有効化
    },
    
    // システム設定
    SYSTEM: {
        DEFAULT_API: 'GEMINI',
        FALLBACK_ENABLED: true,
        REQUEST_TIMEOUT: 10000, // 10秒
        RETRY_COUNT: 2
    }
};

// 環境変数取得関数（本番環境用）
function getEnvVar(name) {
    // Vercel等のクライアントサイド環境変数は `VITE_` や `NEXT_PUBLIC_` プレフィックスが必要
    // しかし、APIキーは通常サーバーサイドで処理すべき
    // ここでは開発用として直接設定を使用
    return null;
}

// APIキー存在チェックと有効化
if (API_CONFIG.OPENAI.API_KEY !== 'YOUR_OPENAI_API_KEY_HERE') {
    API_CONFIG.OPENAI.ENABLED = true;
}

if (API_CONFIG.CLAUDE.API_KEY !== 'YOUR_CLAUDE_API_KEY_HERE') {
    API_CONFIG.CLAUDE.ENABLED = true;
}

// APIキー検証関数
function validateAPIKeys() {
    const results = {
        valid: [],
        invalid: [],
        warnings: []
    };
    
    // Gemini API キー検証
    if (API_CONFIG.GEMINI.ENABLED) {
        if (API_CONFIG.GEMINI.API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            results.warnings.push('Gemini APIキーが設定されていません');
        } else if (API_CONFIG.GEMINI.API_KEY.length > 10) {
            results.valid.push('Gemini');
        } else {
            results.invalid.push('Gemini');
        }
    }
    
    // OpenAI API キー検証
    if (API_CONFIG.OPENAI.ENABLED) {
        if (API_CONFIG.OPENAI.API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
            results.warnings.push('OpenAI APIキーが設定されていません');
        } else if (API_CONFIG.OPENAI.API_KEY.startsWith('sk-')) {
            results.valid.push('OpenAI');
        } else {
            results.invalid.push('OpenAI');
        }
    }
    
    // Claude API キー検証
    if (API_CONFIG.CLAUDE.ENABLED) {
        if (API_CONFIG.CLAUDE.API_KEY === 'YOUR_CLAUDE_API_KEY_HERE') {
            results.warnings.push('Claude APIキーが設定されていません');
        } else if (API_CONFIG.CLAUDE.API_KEY.length > 10) {
            results.valid.push('Claude');
        } else {
            results.invalid.push('Claude');
        }
    }
    
    return results;
}

// 設定情報の取得（キー情報は隠蔽）
function getConfigInfo() {
    return {
        gemini: {
            enabled: API_CONFIG.GEMINI.ENABLED,
            hasKey: API_CONFIG.GEMINI.API_KEY !== 'YOUR_GEMINI_API_KEY_HERE'
        },
        openai: {
            enabled: API_CONFIG.OPENAI.ENABLED,
            hasKey: API_CONFIG.OPENAI.API_KEY !== 'YOUR_OPENAI_API_KEY_HERE'
        },
        claude: {
            enabled: API_CONFIG.CLAUDE.ENABLED,
            hasKey: API_CONFIG.CLAUDE.API_KEY !== 'YOUR_CLAUDE_API_KEY_HERE'
        },
        system: API_CONFIG.SYSTEM
    };
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    // Node.js環境
    module.exports = {
        API_CONFIG,
        validateAPIKeys,
        getConfigInfo
    };
} else {
    // ブラウザ環境
    window.API_CONFIG = API_CONFIG;
    window.validateAPIKeys = validateAPIKeys;
    window.getConfigInfo = getConfigInfo;
}