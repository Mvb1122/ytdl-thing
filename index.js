const fs = require('fs');
const ytdl = require("@distube/ytdl-core");
const { spawn } = require('child_process');
const green = '\x1b[32m';
const reset = '\x1b[0m';

function dl(url) {
    return new Promise(async res => {
        const info = await ytdl.getInfo(url);
        const format = info.formats.find(v => (v.mimeType ?? "").includes("audio"));
        console.log(`Downloading ${green}${info.videoDetails.title}${reset} in format ${format.container}`);

        const tempPath = `Temp_${info.videoDetails.title}.${format.container}`;
        const path = `${info.videoDetails.title}.mp3`;
        ytdl(url, { format: format })
            .pipe(fs.createWriteStream(tempPath))
            .on('close', () => {
                // Recode to MP3 with FFMPEG.
                const ffmpeg = spawn('ffmpeg', ["-i", tempPath, path, '-y'])
                ffmpeg.stderr.on('close', (e) => {
                    // Resolve.
                    res();

                    // remove original file.
                    fs.unlinkSync(tempPath)
                });

                ffmpeg.stderr.on('data', (d) => console.log(d.toString()));
            });
    })
}

const readline = require('node:readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question(`Please enter the URL to download: ${green}`, URL => {
    dl(URL).then(() => {
        console.log("Finished downloading!")
        rl.close();
        process.exit(0);
    });
});