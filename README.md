# プロンプト出力くん

Stable Diffusion用の英語プロンプトを簡単生成するWebアプリケーション

## 🚀 クイックスタート

### 1. APIキーの設定

`config.js` ファイルでAPIキーを設定してください：

```javascript
const API_CONFIG = {
    GEMINI: {
        API_KEY: 'あなたのGemini APIキー', // ← ここを変更
        ENABLED: true
    },
    // 必要に応じて他のAPIも設定
};
```

### 2. APIキーの取得方法

#### Gemini API（推奨・無料枠あり）
1. [Google AI Studio](https://makersuite.google.com/) にアクセス
2. Googleアカウントでログイン
3. 「Get API Key」をクリック
4. 生成されたAPIキーをコピー

#### OpenAI API（代替）
1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウント作成・ログイン
3. 「API Keys」から新しいキーを生成

#### Claude API（代替）
1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. アカウント作成・ログイン  
3. APIキーを生成

### 3. ローカルでの実行

```bash
# HTTPサーバーを起動（Python 3の場合）
python -m http.server 8000

# または Node.js の場合
npx serve .

# ブラウザで http://localhost:8000 にアクセス
```

## 🧪 テスト方法

### 基本機能テスト

1. **単語入力テスト**
   ```
   入力: 頭
   期待結果: head, portrait, face, hair, expression, closeup 等
   ```

2. **感情表現テスト**
   ```
   入力: 悲しい表情
   期待結果: sad, crying, melancholy, tears, depressed 等
   ```

3. **複雑な表現テスト**
   ```
   入力: ちょっと怖い感じ
   期待結果: scary, creepy, dark, mysterious, ominous 等
   ```

### エラーハンドリングテスト

1. **空入力**
   - 何も入力せず生成ボタンを押す
   - 「キーワードを入力してください」が表示される

2. **API未設定**
   - APIキーを設定せずに実行
   - 適切なエラーメッセージが表示される

3. **ネットワークエラー**
   - ネット接続を切って実行
   - 「通信エラーが発生しました」が表示される

### レスポンシブテスト

1. **デスクトップ（1200px+）**
   - 横並びレイアウト
   - コピーボタンが各プロンプトの右上

2. **タブレット（768px-1199px）**
   - 縦並びレイアウト
   - 適切なフォントサイズ

3. **モバイル（767px以下）**
   - フルスクリーン表示
   - コピーボタンが下部に配置
   - タッチしやすいサイズ

### API フォールバック テスト

1. **Gemini API → OpenAI へのフォールバック**
   - Gemini APIキーを無効にする
   - OpenAI APIで生成が継続される

2. **全API無効時**
   - 全てのAPIキーを無効にする
   - 「システムに不具合が起きています」が表示される

## 🔧 設定カスタマイズ

### API優先順位の変更

`config.js` でAPIの有効/無効を切り替え：

```javascript
const API_CONFIG = {
    GEMINI: { ENABLED: false },  // 無効にする
    OPENAI: { ENABLED: true },   // 有効にする
    CLAUDE: { ENABLED: true }    // 有効にする
};
```

### システム設定

```javascript
SYSTEM: {
    DEFAULT_API: 'OPENAI',        // 最初に使用するAPI
    FALLBACK_ENABLED: true,       // フォールバック有効
    REQUEST_TIMEOUT: 10000,       // タイムアウト時間（ms）
    RETRY_COUNT: 2               // リトライ回数
}
```

## 🐛 トラブルシューティング

### よくある問題

1. **「APIキーが設定されていません」エラー**
   - `config.js` でAPIキーを正しく設定しているか確認
   - APIキーの前後にスペースが入っていないか確認

2. **「全てのAPIが利用できません」エラー**
   - 複数のAPIキーを設定してみる
   - インターネット接続を確認
   - APIの利用制限に達していないか確認

3. **プロンプトが表示されない**
   - ブラウザの開発者ツール（F12）でエラーを確認
   - `config.js` の文法エラーがないか確認

4. **モバイルで操作しづらい**
   - ブラウザを最新版に更新
   - プライベートモードで試す

### デバッグ情報の確認

ブラウザのコンソール（F12 → Console）で以下を実行：

```javascript
// API設定確認
console.log(getConfigInfo());

// API統計確認  
if (apiManager) {
    console.log(apiManager.getStats());
}
```

## 🌟 実際のSD生成での確認方法

1. 生成されたプロンプトをコピー
2. Stable Diffusion WebUI等で実際に画像生成
3. 期待通りの画像が生成されるか確認
4. 不適切な結果の場合は、別のプロンプトを試す

### 推奨テストプロンプト

- **人物系**: `頭`, `笑顔`, `悲しい表情`
- **背景系**: `森`, `街`, `夜空`
- **スタイル系**: `アニメ`, `リアル`, `水彩画`
- **複雑系**: `考え込んでる顔`, `ちょっと怖い感じ`, `幻想的な雰囲気`

## 📝 開発者向け情報

### ファイル構成
```
/
├── index.html          # メインHTML
├── config.js          # API設定
├── api-manager.js     # API管理システム
├── script.js          # メインJavaScript  
├── 要件定義書.md      # 要件定義
├── 実装手順書.md      # 実装手順
└── README.md          # このファイル
```

### コード構成
- `APIManager`: 複数API統合管理
- `GeminiAPI`, `OpenAIAPI`, `ClaudeAPI`: 各API実装
- フォールバック機能、リトライ機能、レート制限対応

## 📧 サポート

問題が発生した場合は、以下の情報と共にお知らせください：
- 使用ブラウザとバージョン
- 入力したキーワード  
- エラーメッセージ
- ブラウザコンソールのエラー内容