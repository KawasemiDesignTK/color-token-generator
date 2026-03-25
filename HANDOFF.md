# カラーパレット生成アプリ 引き継ぎドキュメント

## プロジェクト概要

デザイントークン設計に特化したカラーパレット生成ツール。コーポレートカラー（Primary）を起点に、Secondary・Accentカラーを自動導出し、WCAG準拠のアクセシビリティチェック、セマンティックトークン生成、グラデーション作成、複数フォーマットへのエクスポートまでを一貫して行う React 単一ファイルアプリ。

**制作背景**: フリーランスデザイナー（印刷・Web・eコマース専門）が中小企業クライアント向けにデザインシステム設計を行う際の実務ツールとして開発。WordPress theme.json / Figma Variables との連携を特に重視。

---

## ファイル構成

```
color-token-generator.jsx   メインアプリ（単一ファイル・約1400行）
HANDOFF.md                  本ドキュメント
```

---

## 技術スタック

- **React** (useState, useCallback, useMemo)
- **外部依存なし**（CSS-in-JS はインラインスタイルのみ）
- **フォント**: Google Fonts — DM Sans + DM Mono
- **実行環境**: Claude.ai Artifacts (React JSX)

---

## アーキテクチャ概要

```
App (main)
├── カラー計算ユーティリティ      純粋関数群
├── スケール生成                  generateScale / generateNeutral
├── ハーモニーパターン             getHarmonyPatterns
├── セマンティックトークン生成     generateSemanticTokens (light/dark)
├── グラデーション生成             makePresetGradients / buildGradientCSS
├── エクスポートビルダー          buildExport / buildGradientExport
├── UIテーマ定数                  THEMES {dark, light}
└── UIコンポーネント
    ├── ScaleRow + WcagBadge
    ├── ScaleContrastMatrix
    ├── PatternCard
    ├── RoleMappingEditor
    ├── SemanticDualPreview
    ├── SemanticGroupDisplay
    ├── StepSelector
    └── GradientTab
```

---

## 機能一覧

### 1. カラー入力

| 項目 | 詳細 |
|------|------|
| Primary | カラーピッカー + HEX直打ち。変更時に Secondary・Accent を自動再導出 |
| Secondary | 3パターン（補色180°・類似色+30°・分裂補色+150°）からカード選択 または カスタム指定 |
| Accent | 3パターン（三角配色+120°・四角配色+90°・分裂補色+210°）からカード選択 または カスタム指定 |
| カスタム固定 | 手動指定後は Primary 変更時の自動更新を停止。リセットボタンで解除 |

### 2. スケール段階数

| 選択肢 | ステップ | 想定用途 |
|--------|---------|---------|
| 4段階（簡易版）| 100・300・500・700 | LP・小規模サイト |
| **6段階（標準・デフォルト）** | 50・100・300・500・700・900 | 中小規模サイト |
| 10段階（フル）| 50〜900全ステップ | デザインシステム・Tailwind互換 |

内部は常に10ステップで保持。表示・エクスポート時に絞り込み。

### 3. タブ構成（5タブ）

#### タブ1: スケール
- Primary / Secondary / Accent / Neutral の全スケール表示
- **各スウォッチに WCAG バッジ**（W=白テキスト / B=黒テキスト、AAA/AA/✕）
- **Surface・Background 対比マトリクス**（300〜700 × 2背景色）

#### タブ2: セマンティック
- **ライト/ダーク サイドバイサイドプレビュー**（実際のUI見え方確認）
- **ロールマッピングエディタ**（subtle/chip/light/base/hover/dark の各ステップを変更可能）
- **デフォルトマッピング**: subtle=50 / chip=100 / light=300 / base=500 / hover=700 / dark=800
- ダークモードは自動反転生成（subtle→900, chip→800, light→600, base→400, hover→300, dark→200）
- Light / Dark 切り替えでトークン一覧表示

#### タブ3: コントラスト
- WCAG 2.1 コントラスト比チェック（8ペア）
- Light / Dark モード切り替え対応
- 判定: AAA（緑）/ AA（青）/ Large AA（黄）/ 失敗（赤）

#### タブ4: グラデーション
- **プリセット12種**（同色系3×3 / カラー間3 / 3色1 / フェード2 / Radial1）
- カテゴリフィルター
- **エディタ**: タイプ（linear/radial/conic）・方向（8方向+角度数値入力）・カラーストップ編集
- **パレットピッカー**: ストップごとに 🎨 ボタンでパネル展開
  - スケールタブ: Primary/Secondary/Accent の全10ステップから選択
  - セマンティックタブ: ライトモードのセマンティックトークン全件から選択
- 保存リストへの追加・削除
- グラデーション専用エクスポート（CSS Variables / SCSS / theme.json / JSON）

#### タブ5: エクスポート
- **フォーマット**: CSS Variables / SCSS / Tailwind / JSON / Figma Variables
- **セマンティック出力モード**: ☀️ Light のみ / 🌙 Dark のみ / ◑ 両方
- CSS Variables: `:root` に Light、`[data-theme="dark"]` に Dark
- Figma Variables: Primitive + Semantic（Light/Dark 2モード対応）

### 4. UI テーマ

右上ボタンでアプリ自体のライト/ダーク切り替え。`THEMES` オブジェクトで全カラーを一元管理。

---

## 主要な状態（App コンポーネント）

```js
primaryHex        // Primary カラー HEX
secondaryHex      // Secondary（computed: patterns or customSec）
accentHex         // Accent（computed: patterns or customAcc）
steps             // スケール段階数: 4 | 6 | 10
roleSteps         // セマンティックロールのステップマッピング
tab               // アクティブタブ: 0〜4
exportFormat      // エクスポートフォーマット
exportThemeMode   // "light" | "dark" | "both"
uiDark            // UI テーマ: true=dark / false=light
semPreviewMode    // セマンティック/コントラスト表示モード: "light" | "dark"
```

---

## セマンティックトークン一覧

### Base / Surface
- `color-background` `color-surface` `color-surface-variant`
- `color-on-surface` `color-on-surface-muted`
- `color-border` `color-border-strong`

### Primary（Secondary・Accent も同構成）
- `color-primary-subtle` (50)
- `color-primary-chip` (100)
- `color-primary-light` (300)
- `color-primary` (500) ← base
- `color-primary-hover` (700)
- `color-primary-dark` (800)
- `color-on-primary`

### Status
- `color-success` `color-warning` `color-error` `color-info`

---

## エクスポート形式の詳細

### CSS Variables
```css
:root {
  /* Primitive (6-step) */
  --color-primary-50: #e8f0fd;
  /* ... */
  /* Semantic · Light Mode */
  --color-primary: #1A6FDB;
}
[data-theme="dark"] {
  /* Semantic · Dark Mode */
  --color-primary: #60a0f0;
}
```

### Figma Variables JSON
Primitive コレクション + Semantic コレクション（Light/Dark 2モード）。
「Variables Import Export JSON」プラグインで読み込み可能。

### theme.json（グラデーションのみ）
```json
{
  "settings": {
    "color": {
      "gradients": [
        { "name": "Primary Tonal", "slug": "primary-tonal", "gradient": "linear-gradient(135deg, ...)" }
      ]
    }
  }
}
```

---

## 既知の制限・TODO候補

### 現在の制限
- セッション間の状態保持なし（リロードでリセット）
- グラデーションのダークモード自動反転なし（Light固定）
- カラーブラインドシミュレーション未実装
- APCA コントラスト計算未対応（WCAG 2.1 のみ）

### ブラッシュアップ候補（優先度高）
1. **状態の永続化**: localStorage または URL params での設定保存
2. **プロジェクト名・クライアント名の入力**: エクスポートファイルのコメントヘッダーに反映
3. **カラーブラインドシミュレーション**: Deuteranopia / Protanopia / Tritanopia プレビュー
4. **theme.json フル出力**: プリミティブカラーを WordPress palette 形式で出力（slug・name 付き）
5. **グラデーションのダークモード対応**: Dark セマンティックトークンを参照するグラデーション自動生成
6. **Neutral スケールの色相微調整UI**: Primary の色相ズレを手動補正
7. **コピーライト/クレジット行のエクスポートオプション**
8. **モバイルレスポンシブ改善**: スウォッチグリッドのブレークポイント調整

### ブラッシュアップ候補（優先度中）
9. **APCA コントラスト対応**: WCAG 2.1 と並行して Accessible Perceptual Contrast Algorithm 表示
10. **undo/redo**: 色変更・マッピング変更の履歴管理
11. **インポート機能**: HEX値のテキスト貼り付けや既存 CSS Variables の読み込み
12. **パレット共有 URL**: 設定を URL クエリに encode してシェア可能に

---

## 開発者向けメモ

### カラー計算の流れ
```
hexToHsl(primary)
  → generateScale() で全10ステップを HSL ベースで生成
  → filterScale() でステップ数に応じて絞り込み
  → generateSemanticTokens() で roleSteps を参照しトークン生成
  → buildSemanticSet() でライト用・ダーク用それぞれ生成
```

### ダークモードトークン生成ロジック
ライトモードの roleSteps を元に、スケールを反転参照する固定マッピング（`DARK_ROLE_STEPS`）を適用。  
subtle: 50→900 / chip: 100→800 / light: 300→600 / base: 500→400 / hover: 700→300 / dark: 800→200

### グラデーションエクスポートのトークン名
`--gradient-{slug}` の形式。slug はプリセット名からケバブケースで生成。カスタム保存時は `custom-{timestamp下4桁}` 。

### UIテーマの拡張方法
`THEMES` オブジェクトに新しいキーを追加し、各コンポーネントで `T.newKey` として参照するだけで全コンポーネントに適用される。

---

## Claude Code での作業開始手順

```bash
# 1. ファイルを適当なディレクトリに配置
cp color-token-generator.jsx ~/projects/color-token/src/App.jsx

# 2. Vite + React でセットアップする場合
npm create vite@latest color-token -- --template react
cd color-token
cp ../color-token-generator.jsx src/App.jsx

# 3. 起動
npm install && npm run dev
```

> Claude Code への指示例:  
> 「HANDOFF.md を読んで、TODO候補の1番（localStorage 永続化）を実装してください」  
> 「HANDOFF.md の構成を参考に、theme.json フル出力（候補4番）を追加してください」

---

*作成日: 2026-03-23*  
*ツール: Claude Sonnet 4.6 (claude.ai Artifacts)*
