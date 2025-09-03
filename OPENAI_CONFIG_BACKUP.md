# OpenAI設定バックアップ（GPT復帰用）

## 現在の設定（2025-09-03）

### 1. api/generate.js設定
```javascript
model: 'gpt-4o'  // GPT-4o使用
temperature: 0.2
max_tokens: 1000
```

### 2. システムプロンプト（Illustrious XL）
```
「${keyword}」を1つの英単語に変換してから、その単語をベースにしたシンプルなStable Diffusion プロンプトを5-8個作成してください。

## 変換ルール:
1. 「${keyword}」→ 1つの核となる英単語 (例: 可愛い子 → cute)
2. その1単語 + 基本的なSDタグのみで構成
3. 長い説明文は不要、単語の羅列のみ

## 出力形式:
各プロンプトは以下の構造:
[核となる英単語], 1girl/1boy, [基本タグ2-3個], [スタイルタグ]

## 例:
可愛い子 → 核単語"cute"
- cute, 1girl, masterpiece, anime
- cute, 1girl, smile, soft_lighting
- cute, 1girl, portrait, detailed

シンプルで実用的なプロンプト5-8個を生成:
```

### 3. 環境変数
- `OPENAI_API_KEY`: 設定済み（Vercel）

### 4. 復帰手順
1. api/generate.js でmodelを 'gpt-4o-mini' または 'gpt-4o' に戻す
2. 翻訳も必要ならapi/translate.jsも同様に
3. git commit & push
4. 環境変数OPENAI_API_KEYが有効であることを確認

### 5. ファイル状況
- api/generate.js: OpenAI専用
- api/translate.js: OpenAI専用  
- 古いapi-manager.js: 存在するが使用停止中