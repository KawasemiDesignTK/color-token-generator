# Color Token Generator

## プロジェクト概要

デザイントークン設計に特化したカラーパレット生成ツール。
コーポレートカラー（Primary）を起点に、Secondary・Accent を自動導出し、
WCAG 準拠のアクセシビリティチェック、セマンティックトークン生成、
グラデーション作成、複数フォーマットへのエクスポートを一貫して行う。

**対象ユーザー**: フリーランスデザイナー（中小企業クライアント向けデザインシステム設計）
**重視する連携先**: WordPress theme.json / Figma Variables

---

## 技術スタック

| 項目 | 詳細 |
|---|---|
| ビルドツール | Vite 8.0 |
| フレームワーク | React 19（hooks: useState, useCallback, useMemo） |
| 外部依存 | なし（Pure React + インラインスタイル） |
| フォント | Google Fonts（DM Sans + DM Mono） |
| カラー計算 | 純粋 JavaScript（HSL/RGB 変換、WCAG 2.1 コントラスト） |

---

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run preview  # ビルド結果プレビュー
```

---

## ファイル構成

```
src/
├── main.jsx                              # エントリポイント
├── App.jsx                               # メインオーケストレータ（状態管理 + タブ切替）
├── GlobalStyles.jsx                      # フォント読込・スクロールバー等の <style>
├── utils/
│   ├── colorMath.js                      # hexToRgb, hexToHsl, hslToHex, contrastRatio, wcagLevel
│   ├── scale.js                          # generateScale, filterScale, generateNeutral
│   ├── harmony.js                        # getHarmonyPatterns
│   ├── semantic.js                       # generateSemanticTokens, DEFAULT_ROLE_STEPS（24トークン）
│   ├── gradient.js                       # buildGradientCSS, makePresetGradients, buildGradientExport
│   ├── exportBuilders.js                 # buildExport (CSS/SCSS/Tailwind/JSON/Figma Variables)
│   └── urlCodec.js                       # URL encode/decode（状態共有用）
├── constants/
│   └── theme.js                          # THEMES (dark/light UI), TABS
├── hooks/
│   ├── useColorEngine.js                 # 全派生状態を統合するカスタムフック
│   ├── usePersistence.js                 # localStorage + URL params 永続化
│   └── useBreakpoint.js                  # レスポンシブブレークポイント検出
└── components/
    ├── common/
    │   ├── WcagBadge.jsx
    │   └── StepSelector.jsx
    ├── header/
    │   └── Header.jsx
    ├── scale/
    │   ├── ScaleTab.jsx
    │   ├── ScaleRow.jsx
    │   └── ScaleContrastMatrix.jsx
    ├── semantic/
    │   ├── SemanticTab.jsx
    │   ├── SemanticDualPreview.jsx
    │   ├── SemanticGroupDisplay.jsx
    │   └── RoleMappingEditor.jsx
    ├── contrast/
    │   └── ContrastTab.jsx
    ├── gradient/
    │   └── GradientTab.jsx
    ├── export/
    │   └── ExportTab.jsx
    └── PatternCard.jsx
```

---

## 主要機能（5タブ構成）

1. **スケール** — Primary/Secondary/Accent/Neutral の全スケール + WCAG バッジ + コントラストマトリクス
2. **セマンティック** — Light/Dark サイドバイサイドプレビュー + ロールマッピングエディタ
3. **コントラスト** — WCAG 2.1 コントラスト比チェック（8ペア）
4. **グラデーション** — プリセット12種 + エディタ + パレットピッカー + エクスポート
5. **エクスポート** — CSS Variables / SCSS / Tailwind / JSON / Figma Variables

---

## 設計判断

| 判断 | 理由 |
|---|---|
| カスタムフックは1つに統合 | 派生状態が単一の依存チェーンを形成するため |
| インラインスタイル維持 | CSS フレームワーク導入は別タスク。1:1 の動作保証を優先 |
| テーマは props 経由（Context不使用） | コンポーネント数が限定的。Context 化は後続タスクで検討 |

---

## 開発ルール

- **カラー計算は純粋関数で実装**（副作用なし、テスト容易性を確保）
- **WCAG 2.1 準拠**をすべてのカラーペアで保証
- **ダークモード**はライトモードの roleSteps を反転参照する固定マッピング
- **エクスポート形式の追加**時は `buildExport()` にフォーマット分岐を追加

---

## TODO（Phase 8: 設計改善）

### ✅ 8-1. セマンティックカラー整理（完了）
- 32トークン → 24トークンに削減
- CSS Variables に var() 参照を実装（`--color-primary: var(--color-primary-500)`）

### ✅ 8-2. UI/UX 改善（完了）
- **状態永続化**: localStorage + URL params（`usePersistence` + `urlCodec`）
- **レスポンシブ**: `useBreakpoint` フックによる mobile/tablet/desktop 分岐
- **操作フロー**: Light/Dark 切替を共通 `LightDarkToggle` に統一、ヒント折り畳み、ピッカー改善、フェードイン

### ✅ 8-3. エクスポート形式改善（完了）
- **theme.json にグラデーション追加**: `settings.color.gradients`（保存済み or デフォルト6種）
- **ファイルダウンロードボタン**: 全フォーマットで Download ボタン追加
- **グラデーションプリセット削減**: 12種 → 6種（実用的な6種に絞る）
- **savedGradients を App.jsx に集約**: GradientTab で保存したグラデーションを ExportTab の theme.json にも反映
- WP Theme JSON Converter Figma プラグインへの Import に対応

### その他（未着手）
- カラーブラインドシミュレーション
- APCA コントラスト対応

---

*最終更新: 2026-03-25（Phase 8-1・8-2・8-3 完了）*
