const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execPromise = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// ダウンロードディレクトリの作成
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// 静的ファイルの提供
app.use('/downloads', express.static(downloadsDir));
app.use(express.static(__dirname));

// ファイル名のサニタイズ
function sanitizeFilename(filename) {
    return filename
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 200);
}

// 動画情報を取得
app.post('/api/get-info', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URLが必要です' });
    }

    try {
        const { stdout } = await execPromise(`yt-dlp --print title "${url}"`);
        const title = stdout.trim();
        
        res.json({ title });
    } catch (error) {
        console.error('Error getting info:', error);
        res.status(500).json({ error: '動画情報の取得に失敗しました' });
    }
});

// MP3に変換
app.post('/api/convert', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URLが必要です' });
    }

    try {
        // タイトルを取得
        const { stdout: titleOutput } = await execPromise(`yt-dlp --print title "${url}"`);
        const title = titleOutput.trim();
        const safeFilename = sanitizeFilename(title);
        const outputPath = path.join(downloadsDir, `${safeFilename}.mp3`);

        // ダウンロードと変換
        const command = `yt-dlp -x --audio-format mp3 --audio-quality 192K -o "${outputPath.replace('.mp3', '.%(ext)s')}" "${url}"`;
        
        console.log(`Converting: ${title}`);
        await execPromise(command);

        // ファイルが存在するか確認
        if (!fs.existsSync(outputPath)) {
            throw new Error('変換されたファイルが見つかりません');
        }

        res.json({
            success: true,
            filename: `${safeFilename}.mp3`,
            downloadUrl: `/downloads/${encodeURIComponent(safeFilename)}.mp3`
        });

    } catch (error) {
        console.error('Error converting:', error);
        res.status(500).json({ error: 'MP3への変換に失敗しました' });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📁 Downloads: ${downloadsDir}`);
    console.log(`\n使い方:`);
    console.log(`  1. ブラウザで http://localhost:${PORT} を開く`);
    console.log(`  2. YouTubeのURLを入力して変換`);
});
