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
        console.error('API呼び出しエラー:', error);
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
            console.warn('翻訳エラー:', error);
            // エラー時は元の単語を表示
            promptCard.querySelector('.prompt-translation').textContent = `(${prompt.trim()})`;
        }
    });
    
    // すべての翻訳完了を待機
    await Promise.all(translationPromises);
}

// 英語プロンプトを日本語に翻訳（辞書優先 + API補完）
async function translateToJapanese(englishPrompt) {
    // より包括的な翻訳辞書
    const translations = {
        // 喜び・幸せ系
        'happy': '幸せな',
        'smile': '笑顔',
        'smiling': '笑っている',
        'joyful': '喜びの',
        'cheerful': '明るい',
        'delighted': '嬉しそうな',
        'excited': '興奮した',
        'pleased': '満足した',
        'content': '満足した',
        'radiant': '輝いている',
        'gleeful': '大喜びの',
        
        // 悲しみ系
        'sad': '悲しい',
        'crying': '泣いている',
        'tears': '涙の',
        'melancholy': '憂鬱な',
        'depressed': '落ち込んだ',
        'sorrowful': '悲嘆の',
        'tearful': '涙ぐんだ',
        'heartbroken': '心が折れた',
        'grief-stricken': '深い悲しみの',
        'mournful': '嘆いている',
        
        // 怒り系
        'angry': '怒った',
        'furious': '激怒した',
        'mad': '怒った',
        'irritated': 'イライラした',
        'annoyed': 'うんざりした',
        'frustrated': '苛立った',
        'enraged': '激怒した',
        
        // 恐怖・不安系
        'scared': '怖がった',
        'afraid': '恐れた',
        'fearful': '恐怖の',
        'terrified': '恐怖した',
        'nervous': '緊張した',
        'anxious': '不安な',
        'worried': '心配な',
        'panicked': 'パニックの',
        
        // 驚き系
        'surprised': '驚いた',
        'shocked': 'ショックの',
        'amazed': '驚嘆した',
        'astonished': '仰天した',
        'stunned': '唖然とした',
        
        // 思考・集中系
        'thinking': '考えている',
        'contemplating': '熟考している',
        'pensive': '物思いにふけった',
        'thoughtful': '思慮深い',
        'pondering': '思案している',
        'concentrated': '集中している',
        'focused': '集中した',
        'serious': '真剣な',
        
        // 顔・表情
        'face': '顔',
        'expression': '表情',
        'eyes': '目',
        'gaze': '視線',
        'look': '表情',
        'countenance': '表情',
        'visage': '顔',
        
        // 頭部・髪
        'head': '頭',
        'portrait': 'ポートレート',
        'hair': '髪',
        'closeup': 'クローズアップ',
        'profile': '横顔',
        'bust': '胸像',
        
        // 美しさ・魅力
        'beautiful': '美しい',
        'pretty': 'きれいな',
        'cute': 'かわいい',
        'lovely': '愛らしい',
        'gorgeous': 'ゴージャスな',
        'stunning': '魅力的な',
        'attractive': '魅力的な',
        'charming': '魅力的な',
        'elegant': '上品な',
        'graceful': '優雅な',
        
        // 年齢・性別
        'young': '若い',
        'old': '年老いた',
        'child': '子どもの',
        'adult': '大人の',
        'elderly': '高齢の',
        'teenage': '10代の',
        'middle-aged': '中年の',
        'boy': '男の子の',
        'girl': '女の子の',
        'man': '男性の',
        'woman': '女性の',
        'male': '男性の',
        'female': '女性の',
        
        // その他の感情・状態
        'calm': '穏やかな',
        'peaceful': '平和な',
        'relaxed': 'リラックスした',
        'tired': '疲れた',
        'sleepy': '眠そうな',
        'bored': '退屈な',
        'confused': '困惑した',
        'curious': '好奇心旺盛な',
        'confident': '自信のある',
        'shy': '恥ずかしがりの',
        'embarrassed': '恥ずかしい',
        'guilty': '罪悪感のある',
        'proud': '誇らしい',
        
        // 恥ずかしさ・内気系
        'blushing': '頬を赤らめた',
        'bashful': '内気な',
        'sheepish': 'きまりが悪い',
        'modest': '控えめな',
        'timid': '臆病な',
        'coy': 'はにかんだ',
        'self-conscious': '自意識過剰な',
        'awkward': 'ぎこちない',
        'uncomfortable': '居心地悪い',
        'flustered': 'あわてた',
        
        // 追加の表情・感情
        'dreamy': '夢見がちな',
        'wistful': '物憂げな',
        'longing': '憧れの',
        'nostalgic': '懐かしい',
        'hopeful': '希望に満ちた',
        'optimistic': '楽観的な',
        'pessimistic': '悲観的な',
        'cynical': '皮肉な',
        'skeptical': '懐疑的な',
        'determined': '決意した',
        'resolute': '断固とした',
        'stubborn': '頑固な',
        'defiant': '反抗的な',
        'rebellious': '反抗的な',
        'mischievous': 'いたずらっぽい',
        'playful': 'ふざけた',
        'teasing': 'からかう',
        'flirtatious': 'いちゃつく',
        'seductive': '誘惑的な',
        'sultry': '官能的な',
        'mysterious': '神秘的な',
        'enigmatic': '謎めいた',
        'aloof': 'よそよそしい',
        'distant': '距離を置いた',
        'cold': '冷たい',
        'warm': '温かい',
        'kind': '優しい',
        'gentle': '穏やかな',
        'tender': '優しい',
        'compassionate': '思いやりのある',
        'sympathetic': '同情的な',
        'empathetic': '共感的な'
    };
    
    // 複合語の特別処理
    const compoundTranslations = {
        // 基本的な顔の表情
        'happy face': '幸せな顔',
        'sad face': '悲しい顔',
        'smiling face': '笑顔',
        'crying face': '泣いている顔',
        'angry face': '怒った顔',
        'surprised face': '驚いた顔',
        'thinking face': '考えている顔',
        'shy face': '恥ずかしがりの顔',
        'embarrassed face': '恥ずかしい顔',
        'blushing face': '頬を赤らめた顔',
        'bashful face': '内気な顔',
        'modest face': '控えめな顔',
        'sheepish face': 'きまりが悪い顔',
        'awkward face': 'ぎこちない顔',
        
        // 表情の種類
        'joyful expression': '喜びの表情',
        'sorrowful expression': '悲しみの表情',
        'peaceful expression': '穏やかな表情',
        'determined expression': '決意した表情',
        'confident expression': '自信のある表情',
        'mysterious expression': '神秘的な表情',
        'gentle expression': '優しい表情',
        'cold expression': '冷たい表情',
        'warm expression': '温かい表情',
        
        // 笑顔の種類
        'cheerful smile': '明るい笑顔',
        'gentle smile': '優しい笑顔',
        'bright smile': '明るい笑顔',
        'warm smile': '温かい笑顔',
        'sweet smile': '甘い笑顔',
        'shy smile': '恥ずかしそうな笑顔',
        'mischievous smile': 'いたずらっぽい笑顔',
        'playful smile': 'ふざけた笑顔',
        'mysterious smile': '神秘的な笑顔',
        
        // 目の表現
        'dreamy eyes': '夢見がちな目',
        'tired eyes': '疲れた目',
        'bright eyes': '輝く目',
        'sad eyes': '悲しい目',
        'happy eyes': '幸せな目',
        'mysterious eyes': '神秘的な目',
        'gentle eyes': '優しい目',
        'cold eyes': '冷たい目',
        
        // 感情状態
        'feeling shy': '恥ずかしがっている',
        'feeling embarrassed': '恥ずかしがっている',
        'feeling bashful': '内気になっている',
        'feeling awkward': 'ぎこちなく感じている',
        'feeling uncomfortable': '居心地悪く感じている',
        'feeling self-conscious': '自意識過剰になっている'
    };
    
    let result = englishPrompt.toLowerCase().trim();
    
    // 複合語を最初に処理
    Object.keys(compoundTranslations).forEach(compound => {
        const japanese = compoundTranslations[compound];
        if (result === compound) {
            result = japanese;
            return;
        }
    });
    
    // 複合語にマッチしなかった場合、単語単位で翻訳
    if (result === englishPrompt.toLowerCase().trim()) {
        const words = result.split(/\s+/);
        const translatedWords = words.map(word => {
            // ハイフン付き単語の処理
            const cleanWord = word.replace(/[^\w-]/g, '');
            
            // ハイフン付きの単語をチェック
            if (translations[cleanWord]) {
                return translations[cleanWord];
            }
            
            // ハイフンを除去した単語もチェック  
            const wordWithoutHyphen = cleanWord.replace(/-/g, '');
            if (translations[wordWithoutHyphen]) {
                return translations[wordWithoutHyphen];
            }
            
            return translations[cleanWord] || cleanWord;
        });
        result = translatedWords.join(' ');
    }
    
    // API翻訳は現在停止中（テスト段階のため）
    // 必要時に有効化可能
    /*
    const untranslatedWords = result.split(/\s+/).filter(word => {
        const cleanWord = word.replace(/[^\w-]/g, '');
        return cleanWord === cleanWord.toLowerCase() && 
               !translations[cleanWord] && 
               !translations[cleanWord.replace(/-/g, '')] &&
               cleanWord.length > 2 && 
               !/^[a-z]+$/.test(cleanWord) === false;
    });
    
    if (untranslatedWords.length > 0) {
        try {
            const apiTranslation = await translateWithAPI(untranslatedWords, englishPrompt);
            if (apiTranslation) {
                return apiTranslation;
            }
        } catch (error) {
            console.warn('API翻訳に失敗、辞書翻訳を使用:', error);
        }
    }
    */
    
    // API翻訳に失敗した場合、辞書結果を使用
    if (result === englishPrompt.toLowerCase().trim()) {
        // 一般的なパターンを推測
        if (englishPrompt.includes('face')) {
            return '顔の表情';
        } else if (englishPrompt.includes('expression')) {
            return '表情';
        } else if (englishPrompt.includes('eyes')) {
            return '目の表現';
        } else if (englishPrompt.includes('hair')) {
            return '髪の表現';
        } else if (englishPrompt.includes('smile')) {
            return '笑顔';
        } else {
            return `(${englishPrompt})`;
        }
    }
    
    return result;
}

// API翻訳補完機能（辞書で翻訳できない単語のみ）
async function translateWithAPI(untranslatedWords, originalPrompt) {
    if (!apiManager) {
        return null;
    }
    
    const translationPrompt = `以下の英語プロンプトを自然な日本語に翻訳してください（翻訳のみ、説明不要）:
${originalPrompt}

※特に以下の未翻訳語に注意: ${untranslatedWords.join(', ')}`;
    
    try {
        // 翻訳専用の短いプロンプトでAPI呼び出し
        const translatedResult = await apiManager.callTranslationAPI(translationPrompt);
        return translatedResult;
    } catch (error) {
        console.warn('翻訳API呼び出し失敗:', error);
        return null;
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

// システム状態表示
function showSystemStatus() {
    const configInfo = getConfigInfo();
    console.log('プロンプト出力くん - システム状態:');
    console.log('- Gemini API:', configInfo.gemini.enabled ? (configInfo.gemini.hasKey ? '✓' : '✗ キー未設定') : '無効');
    console.log('- OpenAI API:', configInfo.openai.enabled ? (configInfo.openai.hasKey ? '✓' : '✗ キー未設定') : '無効');
    console.log('- Claude API:', configInfo.claude.enabled ? (configInfo.claude.hasKey ? '✓' : '✗ キー未設定') : '無効');
    
    const hasValidAPI = (configInfo.gemini.enabled && configInfo.gemini.hasKey) ||
                       (configInfo.openai.enabled && configInfo.openai.hasKey) ||
                       (configInfo.claude.enabled && configInfo.claude.hasKey);
    
    if (!hasValidAPI) {
        console.warn('利用可能なAPIがありません。config.jsでAPIキーを設定してください。');
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('プロンプト出力くん - 初期化開始');
    
    // システム状態確認
    showSystemStatus();
    
    console.log('初期化完了');
});