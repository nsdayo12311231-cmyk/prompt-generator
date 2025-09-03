// API Manager初期化
let apiManager = null;

// プロンプト生成関数
async function generatePrompts() {
    const keywordInput = document.getElementById('keyword-input');
    const keyword = keywordInput.value.trim();
    
    if (!keyword) {
        showError('キーワードを入力してください');
        return;
    }
    
    // API Managerの初期化確認
    if (!apiManager) {
        try {
            apiManager = new APIManager();
        } catch (error) {
            showError('APIシステムの初期化に失敗しました。設定を確認してください。');
            return;
        }
    }
    
    const generateBtn = document.querySelector('.generate-btn');
    const resultSection = document.getElementById('result-section');
    const promptsContainer = document.getElementById('prompts-container');
    
    // ローディング状態
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
    resultSection.style.display = 'block';
    promptsContainer.innerHTML = '<div class="loading">プロンプトを生成中...</div>';
    
    try {
        const prompts = await apiManager.generatePrompt(keyword);
        await displayPrompts(prompts);
    } catch (error) {
        showError(getErrorMessage(error));
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '生成';
    }
}

// エラーメッセージの生成
function getErrorMessage(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('タイムアウト')) {
        return '応答時間が長すぎます。少し時間をおいて再試行してください。';
    }
    
    if (message.includes('rate limit') || message.includes('制限')) {
        return '使用制限に達しました。しばらくお待ちください。';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
        return '通信エラーが発生しました。インターネット接続を確認してください。';
    }
    
    if (message.includes('全てのapi')) {
        return 'システムに不具合が起きています。時間をおいてお試しください。';
    }
    
    if (message.includes('api') || message.includes('server')) {
        return 'サーバーエラーが発生しました。しばらくお待ちください。';
    }
    
    return 'プロンプト生成に失敗しました。もう一度お試しください。';
}

// プロンプト表示（日本語訳付き）
async function displayPrompts(prompts) {
    const promptsContainer = document.getElementById('prompts-container');
    promptsContainer.innerHTML = '';
    
    // 各プロンプトを順次処理（並列処理でAPI負荷軽減）
    const translationPromises = prompts.map(async (prompt, index) => {
        const promptCard = document.createElement('div');
        promptCard.className = 'prompt-card';
        
        // 一時的に翻訳中表示
        promptCard.innerHTML = `
            <div class="prompt-content">
                <div class="prompt-text">${prompt.trim()}</div>
                <div class="prompt-translation">翻訳中...</div>
            </div>
            <button class="copy-btn" onclick="copyToClipboard('${prompt.trim().replace(/'/g, "\\'")}', this)">
                コピー
            </button>
        `;
        promptsContainer.appendChild(promptCard);
        
        try {
            // 日本語訳を生成（非同期）
            const japaneseTranslation = await translateToJapanese(prompt.trim());
            
            // 翻訳完了後に更新
            promptCard.innerHTML = `
                <div class="prompt-content">
                    <div class="prompt-text">${prompt.trim()}</div>
                    <div class="prompt-translation">${japaneseTranslation}</div>
                </div>
                <button class="copy-btn" onclick="copyToClipboard('${prompt.trim().replace(/'/g, "\\'")}', this)">
                    コピー
                </button>
            `;
        } catch (error) {
            // 翻訳エラー時は元の単語を表示
            promptCard.querySelector('.prompt-translation').textContent = `(${prompt.trim()})`;
        }
    });
    
    // すべての翻訳完了を待機
    await Promise.all(translationPromises);
}

// 英語プロンプトを日本語に翻訳（辞書+API）
async function translateToJapanese(englishPrompt) {
    // 高品質翻訳辞書（自然な表現重視）
    const translations = {
        // 基本情感
        'happy': '幸せそうな人', 'sad': '悲しんでいる人', 'angry': '怒っている人', 
        'scared': '怖がっている人', 'surprised': '驚いている人', 'thinking': '考えている人',
        'calm': '穏やかな人', 'tired': '疲れた人', 'confused': '困っている人',
        
        // 身体部位・姿勢
        'face': '顔', 'head': '頭部', 'hair': '髪型', 'eyes': '目元',
        'portrait': '人物画', 'closeup': 'クローズアップ', 'profile': '横顔',
        
        // 美しさ・魅力
        'beautiful': '美しい人', 'cute': '可愛い人', 'pretty': 'きれいな人',
        'young': '若い人', 'attractive': '魅力的な人',
        
        // 表情・感情
        'smile': '笑顔', 'smiling': '笑っている人', 'crying': '泣いている人',
        'blushing': '頬を赤らめている人', 'shy': '恥ずかしがっている人',
        'embarrassed': '恥ずかしい思いをしている人',
        
        // 特定の状況・行動  
        'troubled man': '悩んでいる男性', 'distressed man': '苦悩している男性',
        'worried man': '心配している男性', 'anxious man': '不安に思っている男性',
        'upset man': '落ち込んでいる男性', 'despondent man': '絶望している男性',
        'man in despair': '絶望の中にいる男性', 'man in trouble': '困っている男性'
    };
    
    const result = englishPrompt.toLowerCase().trim();
    
    // 辞書で完全一致をチェック
    if (translations[result]) {
        return translations[result];
    }
    
    // 単語レベルで辞書チェック
    const words = result.split(/\s+/);
    const translatedWords = words.map(word => {
        const cleanWord = word.replace(/[^\w-]/g, '');
        return translations[cleanWord] || cleanWord;
    });
    
    const dictionaryResult = translatedWords.join(' ');
    
    // API翻訳が必要か判定（英単語が残っているまたは不自然な翻訳）
    const hasUntranslated = translatedWords.some(word => 
        /^[a-z]+$/i.test(word) && word.length > 2
    ) || dictionaryResult.includes('の') && !result.includes('face') && !result.includes('eyes');
    
    if (hasUntranslated && apiManager) {
        try {
            const apiTranslation = await translateWithAPI(englishPrompt);
            if (apiTranslation && apiTranslation !== englishPrompt) {
                return apiTranslation;
            }
        } catch (error) {
            // API失敗時は辞書結果を使用
        }
    }
    
    return dictionaryResult || `(${englishPrompt})`;
}

// API翻訳機能（GPT級の高品質翻訳）
async function translateWithAPI(englishPrompt) {
    if (!apiManager) {
        return null;
    }
    
    const translationPrompt = `あなたはStable Diffusion画像生成に精通した翻訳の専門家です。
以下の英語プロンプトを、SD初心者にもわかりやすい自然な日本語に翻訳してください。

翻訳ルール:
- 画像生成の文脈を考慮して翻訳
- 初心者向けに分かりやすい表現を使用
- 不自然な「の」の連続は避ける
- 感情や状態は「〜な人」「〜している人」など自然な表現にする
- 翻訳結果のみを出力（説明は不要）

英語プロンプト: ${englishPrompt}

日本語翻訳:`;
    
    try {
        const result = await apiManager.callTranslationAPI(translationPrompt);
        // 「日本語翻訳:」がある場合は除去
        return result.replace(/^.*日本語翻訳:\s*/i, '').trim();
    } catch (error) {
        throw error;
    }
}


// クリップボードにコピー
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'コピー済み!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = 'コピー';
            button.classList.remove('copied');
        }, 2000);
    } catch (error) {
        console.error('コピーに失敗:', error);
        // フォールバック: テキスト選択
        selectText(text);
    }
}

// テキスト選択（フォールバック）
function selectText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('テキストがコピーされました');
}

// エラー表示
function showError(message) {
    const promptsContainer = document.getElementById('prompts-container');
    promptsContainer.innerHTML = `<div class="error">${message}</div>`;
}

// Enter キー対応
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        generatePrompts();
    }
}


// 初期化
document.addEventListener('DOMContentLoaded', function() {
    // 初期化完了
});