## Mindful Sites

対象サイトの利用を「セッション制」にして、意図的な行動をサポートする **Chrome拡張機能**です。
対象サイトを開くと、まず「利用セッション開始」画面に誘導し、指定した時間だけ閲覧できます。時間切れになると **振り返り入力が必須**になり、入力するまで対象サイトへ戻れません。

## できること

- **セッション制の利用**
  - 対象サイトを開くと「セッション開始」画面へ誘導
  - プリセット（例: 1/5/10/20分）またはカスタム分数でセッション開始
- **残り時間のオーバーレイ表示**
  - 対象サイト上に残り時間（MM:SS）と進捗バーを常時表示
- **時間切れで振り返り強制**
  - セッション終了時に「振り返り」画面へ遷移
  - 振り返りを保存すると履歴に記録され、セッションがクリアされる
- **サイトごとの1日上限**
  - サイト別の日次上限（分）を設定
  - 上限に達すると新規セッション開始ができない
- **ダッシュボード**
  - サイト別の今日の利用状況（残り/使用/セッション数）
  - 直近の日別利用時間グラフ（複数サイトを同時表示）
  - セッション履歴（振り返り + favicon）

## 使い方（ユーザー向け）

### インストール（開発版の読み込み）

1. 依存関係をインストール:

```bash
pnpm install
```

2. 開発ビルドを起動:

```bash
pnpm dev
```

3. Chromeで `chrome://extensions` を開き、**デベロッパーモード**をON
4. **「パッケージ化されていない拡張機能を読み込む」**をクリック
5. 本リポジトリの `build/chrome-mv3-dev` を選択

### 基本フロー

1. 対象サイトを開く
2. セッションが未開始なら `options.html?view=start-session&siteId=...` に誘導される
3. 分数を選んでセッション開始 → 自動で対象サイトへ遷移
4. 対象サイト上に残り時間が表示される
5. 時間切れになると `options.html?view=reflection` に遷移
6. 振り返りを保存するとダッシュボードへ戻る

## 仕様（挙動の詳細）

### 制限対象URL

- **対象**: 設定した正規表現にマッチするURL
- **除外**: 「全体除外URL」の正規表現にマッチするURL

### タイマーの動き（重要）

- タイマーは **background** で 1秒ごとにカウントダウンします。
- セッション開始後に対象サイトでタイマーが起動すると、**対象サイト以外のページへ移動しても基本的にカウントダウンは継続**します（セッションが `isActive: false` になる/クリアされるまで）。

### 日付切り替わり時の扱い

- **ローカルTZの0:00** でセッションをリセットし、対象サイトのタブがあれば「セッション開始」画面へ誘導します。
- フォールバックとして 1分ごとの日付変化チェックも行います。

## 設定

`tabs/settings.html` から変更できます（変更後に保存ボタンを押します）。

- **セッション開始プリセット（分）**: `presetMinutes`（重複不可・少なくとも1件必須）
- **全体除外URL（正規表現・複数行）**: `globalExcludePatterns`
- **サイトルール**:
  - サイト名 / 対象URL（正規表現・複数行） / 日次上限 / 代表URL

## データ保存（ローカルのみ）

`@plasmohq/storage` を利用して拡張機能の `storage` に保存します。

- **設定**: `settings`
  - `{ presetMinutes: number[], globalExcludePatterns: string[], siteRules: SiteRule[] }`
- **現在のセッション**: `currentSession`
  - `{ id, startTime, durationMinutes, remainingSeconds, isActive, siteId, siteUrl? }`
- **日次利用**: `dailyUsage`
  - `Record<YYYY-MM-DD, { date, siteUsage }>`
  - `siteUsage` はサイト別の合計・セッション記録を保持

※ 本拡張は、現状コード上は外部サーバへ送信しません（データはブラウザ内に保存されます）。

## 開発（コマンド）

```bash
pnpm dev      # 開発
pnpm build    # 本番ビルド（build/chrome-mv3-prod）
pnpm package  # 配布用パッケージ作成
pnpm lint     # oxlint
pnpm format   # oxfmt
pnpm fix      # format + lint:fix
```

## ディレクトリ構成（抜粋）

- `src/background/index.ts`: タブ監視・タイマー・リダイレクト・日付リセット
- `src/background/messages/*`: start/end/reflection等のメッセージハンドラ
- `src/contents/timer-display.tsx`: 対象サイト上の残り時間オーバーレイ
- `src/options.tsx`: ダッシュボード / セッション開始 / 振り返り（view切り替え）
- `src/popup.tsx`: ポップアップ（今日の状況・ダッシュボード/設定への導線）
- `src/tabs/settings.tsx`: 設定画面

## 権限

`package.json` の `manifest` 設定:

- `permissions`: `storage`, `tabs`
- `host_permissions`: `<all_urls>`
