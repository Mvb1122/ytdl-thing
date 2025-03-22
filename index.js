const fs = require('fs');
const ytdl = require("@distube/ytdl-core");
const { spawn } = require('child_process');
const sanitize = require('sanitize-filename');

const green = '\x1b[32m';
const reset = '\x1b[0m';

function dl(url, doVideo) {
    return new Promise(async res => {
        const info = await ytdl.getInfo(url);
        const formatType = doVideo ? "video" : "audio";
        const format = info.formats.find(v => (v.mimeType ?? "").includes(formatType));
        const outputFormat = doVideo ? ".mp4" : `.mp3`;
        
        
        console.log(`Downloading ${green}${info.videoDetails.title}${reset} in format ${format.container}`);

        const tempPath = "./output/" + sanitize(`Temp_${info.videoDetails.title}.${format.container}`);
        const path = "./output/" + sanitize(`${info.videoDetails.title}`) + outputFormat;
        
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

if (!fs.existsSync(`./output/`)) fs.mkdirSync("./output/");

rl.question(`Please enter the URL to download:${green} `, async URL => {
    let video = await new Promise(res => {
        rl.question(`${white}Video? (Y/N)${green} `, ans => {
            res(ans.toLowerCase().includes("y"));
        })
    })

    await dl(URL, video);
    console.log("Finished downloading!")
    rl.close();
    process.exit(0);
});