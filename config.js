// API設定ファイル
// 本番環境では環境変数から読み込み、開発環境では直接設定

const API_CONFIG = {
    // メインAPI: Gemini
    GEMINI: {
        API_KEY: 'AIzaSyDCQ8Zik-G0IG_e_B8EItEAtN8VhynPLhQ',
        ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
        MAX_REQUESTS_PER_MINUTE: 60,
        ENABLED: true
    },
    
    // 代替API 1: OpenAI GPT-3.5-turbo
    OPENAI: {
        API_KEY: 'YOUR_OPENAI_API_KEY_HERE',
        ENDPOINT: 'https://api.openai.com/v1/chat/completions',
        MODEL: 'gpt-3.5-turbo',
        MAX_REQUESTS_PER_MINUTE: 60,
        ENABLED: false // 初期は無効、必要時に有効化
    },
    
    // 代替API 2: Claude
    CLAUDE: {
        API_KEY: 'YOUR_CLAUDE_API_KEY_HERE',
        ENDPOINT: 'https://api.anthropic.com/v1/messages',
        MODEL: 'claude-3-haiku-20240307',
        MAX_REQUESTS_PER_MINUTE: 50,
        ENABLED: false // 初期は無効、必要時に有効化
    },
    
    // システム設定
    SYSTEM: {
        DEFAULT_API: 'GEMINI',
        FALLBACK_ENABLED: true,
        REQUEST_TIMEOUT: 10000, // 10秒
        RETRY_COUNT: 2
    }
};

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

// 環境変数からの設定読み込み（Node.js環境用）
function loadFromEnvironment() {
    if (typeof process !== 'undefined' && process.env) {
        API_CONFIG.GEMINI.API_KEY = process.env.GEMINI_API_KEY || API_CONFIG.GEMINI.API_KEY;
        API_CONFIG.OPENAI.API_KEY = process.env.OPENAI_API_KEY || API_CONFIG.OPENAI.API_KEY;
        API_CONFIG.CLAUDE.API_KEY = process.env.CLAUDE_API_KEY || API_CONFIG.CLAUDE.API_KEY;
    }
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

// 初期化
loadFromEnvironment();

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