// API設定ファイル
// 本番環境では環境変数から読み込み、開発環境では直接設定

const API_CONFIG = {
    // メインAPI: Gemini
    GEMINI: {
        API_KEY: 'AIzaSyDCQ8Zik-G0IG_e_B8EItEAtN8VhynPLhQ',
        ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
        MAX_REQUESTS_PER_MINUTE: 15,
        ENABLED: true
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
    
    
    return results;
}

// 環境変数からの設定読み込み（Node.js環境用）
function loadFromEnvironment() {
    if (typeof process !== 'undefined' && process.env) {
        API_CONFIG.GEMINI.API_KEY = process.env.GEMINI_API_KEY || API_CONFIG.GEMINI.API_KEY;
    }
}

// 設定情報の取得（キー情報は隠蔽）
function getConfigInfo() {
    return {
        gemini: {
            enabled: API_CONFIG.GEMINI.ENABLED,
            hasKey: API_CONFIG.GEMINI.API_KEY !== 'YOUR_GEMINI_API_KEY_HERE'
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