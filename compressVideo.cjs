const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const inputPath = path.join(__dirname, '..', 'Cardekho_recording.mp4');
const outputPath = path.join(__dirname, '..', 'Cardekho_recording_compressed.mp4');

console.log('Starting compression...');
console.log('Input:', inputPath);
console.log('Output:', outputPath);

ffmpeg(inputPath)
  .videoCodec('libx264')
  .addOption('-crf', '28')        // Quality: 0 (lossless) to 51 (worst). 28 is good balance.
  .addOption('-preset', 'fast')    // Fast encoding, slightly larger file, same quality
  .audioCodec('aac')
  .audioBitrate('128k')
  .on('start', (cmd) => {
    console.log('FFmpeg command:', cmd);
  })
  .on('progress', (progress) => {
    if (progress.percent) {
      process.stdout.write(`\rProgress: ${progress.percent.toFixed(1)}%`);
    }
  })
  .on('end', () => {
    console.log('\nCompression complete!');
    console.log('Output saved to:', outputPath);
  })
  .on('error', (err) => {
    console.error('Error during compression:', err.message);
  })
  .save(outputPath);
