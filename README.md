# YouTube MP3 Web Downloader

ブラウザから操作できるYouTube MP3ダウンローダーです。

![Screenshot](screenshot.png)

## 機能

- YouTube動画のURLからMP3をダウンロード
- 動画タイトルの自動取得
- シンプルで使いやすいWebインターフェース

## 必要要件

- Node.js 16以上
- yt-dlp
- ffmpeg

## インストール

### 1. 必要なツールのインストール

```bash
# macOS
brew install yt-dlp ffmpeg

# Ubuntu/Debian
sudo apt install yt-dlp ffmpeg

# Windows
# yt-dlp: https://github.com/yt-dlp/yt-dlp/releases
# ffmpeg: https://ffmpeg.org/download.html
```

### 2. リポジトリのクローン

```bash
git clone https://github.com/yourusername/youtube-mp3-web.git
cd youtube-mp3-web
```

### 3. 依存パッケージのインストール

```bash
npm install
```

## 使い方

### 1. サーバーを起動

```bash
npm start
```

以下のように表示されます：

```
🚀 Server is running on http://localhost:3001
📁 Downloads: /path/to/youtube-mp3-web/downloads
```

### 2. ブラウザでアクセス

http://localhost:3001 を開く

### 3. URLを入力して変換

1. YouTubeのURLを入力欄に貼り付け
2. 「MP3に変換」ボタンをクリック
3. 変換完了後、ダウンロードボタンが表示される

## ダウンロードしたファイルの場所

変換されたMP3ファイルは `downloads/` フォルダに保存されます。

## ポート番号の変更

環境変数 `PORT` で変更できます：

```bash
PORT=8080 npm start
```

## トラブルシューティング

### エラー: "yt-dlp: command not found"

yt-dlpがインストールされていません。上記のインストール手順を参照してください。

### エラー: "ffmpeg not found"

ffmpegがインストールされていません。上記のインストール手順を参照してください。

### 変換が遅い

動画の長さによっては時間がかかります。処理中はページを閉じないでください。

## 注意事項

- ダウンロードしたコンテンツは個人的な使用に限定してください
- 著作権法を遵守してください
- YouTubeの利用規約に従ってください

## ライセンス

MIT License
