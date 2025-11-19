const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execPromise = promisify(exec);
const app = express();
const PORT = 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use('/downloads', express.static('downloads'));

// ダウンロードディレクトリの作成
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// ファイル名のサニタイズ
function sanitizeFilename(filename) {
  return filename
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

// 動画情報を取得
app.post('/api/get-info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URLが必要です' });
    }

    console.log('📝 動画情報取得:', url);

    const { stdout } = await execPromise(
      `yt-dlp --get-title --no-playlist --no-warnings "${url}"`,
      { timeout: 30000 }
    );
    
    const title = stdout.trim();
    console.log('✅ タイトル:', title);
    
    res.json({
      title: title || 'Unknown Title',
      sanitizedFilename: sanitizeFilename(title)
    });
    
  } catch (error) {
    console.error('❌ Error fetching video info:', error.message);
    res.status(500).json({ 
      error: '動画情報の取得に失敗しました',
      details: error.message 
    });
  }
});

// バランス型高速MP3変換
app.post('/api/convert', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URLが必要です' });
    }

    const startTime = Date.now();
    console.log('🚀 高速変換開始:', url);

    // タイトル取得
    const { stdout: titleOutput } = await execPromise(
      `yt-dlp --get-title --no-playlist --no-warnings "${url}"`,
      { timeout: 30000 }
    );
    
    const title = titleOutput.trim();
    const sanitizedTitle = sanitizeFilename(title);
    const outputPath = path.join(downloadsDir, `${sanitizedTitle}.mp3`);
    
    console.log('📝 タイトル:', title, `(${Date.now() - startTime}ms)`);

    // 既存ファイルがあれば削除
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    // ⚡ バランス型高速設定
    const command = `yt-dlp \
      -f "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio" \
      -x --audio-format mp3 \
      --audio-quality 7 \
      --no-playlist \
      --no-warnings \
      --no-check-certificates \
      --concurrent-fragments 3 \
      --no-part \
      --buffer-size 16K \
      --socket-timeout 30 \
      --postprocessor-args "ffmpeg:-ar 32000 -ac 2 -b:a 96k" \
      -o "${outputPath.replace('.mp3', '.%(ext)s')}" \
      "${url}"`;
    
    console.log('⚡ 変換実行中...');
    
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 1024 * 1024 * 50,
      timeout: 300000
    });

    if (stderr) {
      console.log('stderr:', stderr);
    }

    const elapsed = Date.now() - startTime;
    console.log(`✅ 変換完了: ${elapsed}ms (${(elapsed/1000).toFixed(1)}秒)`);

    if (!fs.existsSync(outputPath)) {
      throw new Error('MP3ファイルの作成に失敗しました');
    }

    const stats = fs.statSync(outputPath);
    console.log(`📦 ファイルサイズ: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

    res.json({
      success: true,
      filename: `${sanitizedTitle}.mp3`,
      downloadUrl: `/downloads/${encodeURIComponent(sanitizedTitle)}.mp3`,
      title: title,
      processingTime: `${(elapsed/1000).toFixed(1)}秒`,
      fileSize: `${(stats.size / 1024 / 1024).toFixed(2)}MB`
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stderr) {
      console.error('stderr:', error.stderr);
    }
    res.status(500).json({ 
      error: 'MP3への変換に失敗しました',
      details: error.message 
    });
  }
});

// ファイルのクリーンアップ
app.delete('/api/cleanup/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(downloadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'ファイルを削除しました' });
    } else {
      res.status(404).json({ error: 'ファイルが見つかりません' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'ファイルの削除に失敗しました' });
  }
});

// 古いファイルを自動削除（1時間以上前のファイル）
setInterval(() => {
  try {
    const files = fs.readdirSync(downloadsDir);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > 3600000) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  古いファイルを削除: ${file}`);
      }
    });
  } catch (error) {
    console.error('クリーンアップエラー:', error);
  }
}, 600000);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📁 Downloads: ${downloadsDir}`);
  console.log(`⚡ バランスモード: ステレオ 32kHz 96kbps`);
  console.log(`🎵 品質: 音楽鑑賞可能レベル`);
});
