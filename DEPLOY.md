# 🚀 Vercelデプロイガイド

## 1. デプロイ前準備

### 1-1. APIキーの準備
以下のAPIキーを取得してください（最低1つは必要）：

**Gemini API（推奨・無料枠あり）**
```
1. https://makersuite.google.com/ にアクセス
2. 「Get API Key」→「Create API key」
3. AIzaで始まるキーをコピー
```

**OpenAI API（代替・有料）**
```
1. https://platform.openai.com/ にアクセス
2. API Keys → Create new secret key
3. sk-で始まるキーをコピー
```

### 1-2. config.jsの更新
デプロイ前に`config.js`でAPIキーを設定：
```javascript
GEMINI: {
    API_KEY: 'AIzaSyC...',  // 実際のキーを入力
    ENABLED: true
}
```

## 2. Vercelデプロイ方法

### 方法A: Vercel CLI（推奨）

```bash
# 1. Vercel CLIインストール
npm install -g vercel

# 2. プロジェクトフォルダで実行
cd /path/to/your/project
vercel

# 3. 初回セットアップ質問
# - Set up and deploy? → Y
# - Which scope? → 自分のアカウント選択
# - Link to existing project? → N
# - What's your project's name? → prompt-generator
# - In which directory is your code located? → ./

# 4. デプロイ完了
# → URLが表示されます
```

### 方法B: GitHub連携

```bash
# 1. Gitリポジトリ作成
git init
git add .
git commit -m "Initial commit: プロンプト出力くん"

# 2. GitHubリポジトリ作成（GitHub.comで）
# - 新しいリポジトリを作成
# - リポジトリ名：prompt-generator

# 3. GitHubにプッシュ
git remote add origin https://github.com/あなたのユーザー名/prompt-generator.git
git branch -M main
git push -u origin main

# 4. Vercel Dashboard
# - https://vercel.com/dashboard にアクセス
# - 「Import Project」をクリック
# - GitHubリポジトリを選択
# - 「Deploy」をクリック
```

## 3. 環境変数設定（セキュリティ強化）

### 3-1. Vercel Dashboard設定
```
1. プロジェクト → Settings → Environment Variables
2. 以下を追加：

Name: GEMINI_API_KEY
Value: AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
Environment: Production, Preview, Development

（必要に応じて）
Name: OPENAI_API_KEY  
Value: sk-1234567890abcdefghijklmnopqrstuvwxyz
Environment: Production, Preview, Development
```

### 3-2. 本番用config.jsの使用
デプロイ後、より安全にするため：
```bash
# config.jsを本番用に置き換え
cp config.prod.js config.js
```

## 4. カスタムドメイン設定（オプション）

### 4-1. 独自ドメインの設定
```
1. Vercel Dashboard → Domains
2. 「Add Domain」をクリック
3. ドメイン名を入力（例：prompt-generator.com）
4. DNS設定に従って設定：
   - Type: A
   - Name: @
   - Value: 76.76.19.61
   
   - Type: CNAME  
   - Name: www
   - Value: cname.vercel-dns.com
```

## 5. 動作確認

### 5-1. デプロイ直後のテスト
```
1. 提供されたURLにアクセス
2. 「嬉しい顔」で動作テスト
3. コピー機能の確認
4. レスポンシブ表示の確認
```

### 5-2. エラー時のデバッグ
```
# Vercel Function Logsで確認
vercel logs

# または Vercel Dashboardで
Project → Functions → View Function Logs
```

## 6. 継続的デプロイ

### 6-1. 自動デプロイ設定
GitHub連携の場合、以下で自動デプロイ：
```bash
# コード修正後
git add .
git commit -m "機能改善: 翻訳辞書を拡充"
git push origin main

# → 自動的にVercelデプロイが開始
```

### 6-2. プレビューデプロイ
```bash
# ブランチごとにプレビュー環境作成
git checkout -b feature/new-translation
git add .
git commit -m "新機能テスト"
git push origin feature/new-translation

# → プレビューURLが生成される
```

## 7. 監視・メンテナンス

### 7-1. パフォーマンス監視
```
- Vercel Analytics で使用状況確認
- API使用量をGemini/OpenAIコンソールで監視
- エラー率の定期チェック
```

### 7-2. 定期メンテナンス
```
- 月1回：API使用量確認
- 月1回：新しい翻訳語彙の追加
- 四半期：セキュリティアップデート確認
```

## 8. トラブルシューティング

### よくある問題

**1. デプロイ後「APIキーが設定されていません」エラー**
```
解決策：
- config.jsでAPIキーが正しく設定されているか確認
- 環境変数が正しく設定されているか確認
```

**2. 「全てのAPIが利用できません」エラー**  
```
解決策：
- APIキーの有効性を確認
- API使用制限に達していないか確認
- ネットワーク接続を確認
```

**3. デプロイが失敗する**
```
解決策：
- package.jsonの構文エラーを確認
- vercel.jsonの設定を確認  
- ファイルサイズが制限内か確認
```

**4. カスタムドメインが反映されない**
```
解決策：
- DNS設定の伝播を24-48時間待つ
- DNS設定値を再確認
- Vercel Dashboardでドメイン状態を確認
```

## 9. セキュリティ考慮事項

### 9-1. APIキー保護
```
✅ DO:
- 環境変数でAPIキーを管理
- .gitignoreでconfig.jsを除外
- 定期的にAPIキーをローテーション

❌ DON'T:
- APIキーをコードにハードコード
- APIキーをGitHubにコミット
- 同じAPIキーを複数サービスで共有
```

### 9-2. アクセス制御
```
- 必要に応じてBasic認証を追加
- Rate Limitingの実装検討
- ログ監視の設定
```

## 10. コスト管理

### 10-1. API使用料金の監視
```
Gemini API（無料枠）：
- 月1,500回まで無料
- 超過後：入力$0.075/1K、出力$0.30/1K

OpenAI API：
- GPT-3.5-turbo：入力$0.50/1M、出力$1.50/1M

想定コスト（月200ユーザー）：
- Gemini のみ：無料
- OpenAI 追加：約$5
```

### 10-2. コスト最適化
```
- 主にGemini APIを使用（無料枠活用）
- OpenAI/Claudeは代替専用
- 不要なAPIの無効化
```

---

**🎉 デプロイ完了後のURL例**
- `https://prompt-generator-abc123.vercel.app`
- `https://your-custom-domain.com` （カスタムドメイン設定時）