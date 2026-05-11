# パーソナルジム口コミジェネレーター

パーソナルジムに特化したGoogle口コミ自動生成Webアプリです。
10個の質問にステップ形式で答え、最後に自分の言葉を入力するだけで、ChatGPT(OpenAI API)が自然な口コミ文を生成します。

## 主な機能

- ステップ式UIで10個の質問に回答（入会動機・目標 / トレーニング内容・効果 / トレーナーの質・指導 / 施設・サービス・継続意向 の4カテゴリ）
- 最後に自分の言葉を自由入力できる欄あり（口コミの核として最重要視）
- ChatGPT API(OpenAI)で自然な日本語口コミを生成
- ワンクリックでクリップボードにコピー
- 「もう一度生成」で別パターンの文章を再生成可能
- 院名を任意で指定可能（文中で自然に1回触れる）

---

## セットアップ手順

### 1. Node.js のインストール

`Node.js 18以上` が必要です。  
未インストールの場合は [Node.js公式サイト](https://nodejs.org/) からLTS版をインストールしてください。

### 2. 依存パッケージのインストール

このフォルダで以下を実行:

```bash
npm install
```

### 3. OpenAI APIキーの設定

`.env.example` をコピーして `.env.local` を作成し、APIキーをセットします。

```bash
cp .env.example .env.local
```

`.env.local` を開いて以下を編集:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

APIキーは [OpenAIのダッシュボード](https://platform.openai.com/api-keys) から取得できます。

### 4. ローカル起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて動作確認してください。

### 5. 本番ビルド

```bash
npm run build
npm run start
```

---

## デプロイ（Vercel推奨）

Next.jsの開発元であるVercelに最も簡単にデプロイできます。

1. このフォルダをGitHubにpush
2. [Vercel](https://vercel.com) でリポジトリをインポート
3. 環境変数に `OPENAI_API_KEY`（必須）と `OPENAI_MODEL`（任意）を設定
4. Deployボタンを押すだけで公開URLが発行されます

---

## ファイル構成

```
口コミ生成ビルダーを作りたい/
├─ app/
│  ├─ api/
│  │  └─ generate/
│  │     └─ route.js        # OpenAI APIを呼び出すサーバールート
│  ├─ globals.css           # Tailwindベース＋カラー定義
│  ├─ layout.js             # 共通レイアウト
│  └─ page.js               # メインUI（ステップフォーム）
├─ lib/
│  └─ questions.js          # 10問の質問データ（編集はここ）
├─ .env.example             # 環境変数テンプレート
├─ .gitignore
├─ jsconfig.json
├─ next.config.js
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
└─ README.md
```

---

## カスタマイズ

### 質問項目を変えたい場合

`lib/questions.js` を編集します。1問は以下の構造です:

```js
{
  id: "symptom",                  // 一意のID
  category: "来院理由・症状",       // ステップ上部に表示されるカテゴリ
  label: "主にどのような症状で来院されましたか？",
  type: "multi",                  // "single" (ラジオ) / "multi" (複数選択)
  options: ["肩こり", "腰痛", ...] // 選択肢
}
```

### プロンプト（口コミの文体）を変えたい場合

`app/api/generate/route.js` の `SYSTEM_PROMPT` を編集してください。
文字数・文体・禁止表現などをここで細かく調整できます。

### モデルを変えたい場合

`.env.local` の `OPENAI_MODEL` を変更:

- `gpt-4o-mini` （デフォルト・安価で高速）
- `gpt-4o` （高品質）
- `gpt-4-turbo` 等

---

## 注意事項

- 本ツールが生成する文章は**あくまでテンプレート案**です。
  実際の体験に基づいて編集してから投稿してください。
- Googleのポリシー上、**虚偽のレビューや報酬対価でのレビュー依頼は禁止**されています。  
  運用は必ず患者本人による任意投稿の範囲で行ってください。
- 「治る」「完治」等の医療的断定表現は薬機法・景品表示法の観点から避けるよう、プロンプト側で抑止しています。
