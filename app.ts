import multer from 'multer';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { spawn, exec } from "child_process"

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


class VideoResource {
    bitrate: number
    duration: number

    constructor(bitrate: number, duration: number) {
        this.bitrate = bitrate
        this.duration = duration
    }
}

function totalDurationInSeconds(timepieces: string[]) {
    let hours = parseFloat(timepieces[0])
    let minutes = parseFloat(timepieces[1])
    let seconds = parseFloat(timepieces[2])
    let hundrethSeconds = parseFloat(timepieces[3])

    return (hours * 3600) + (minutes * 60) + seconds + (hundrethSeconds / 100)
}

async function spawnToPromise(command: string, args: string[]) {
    return new Promise((resolve, reject) => {
        spawn(command, args)
            .on('exit', (code) => {
                if (code == 1) reject("error processing command")
                resolve("completed process")
            })
    })
}

async function execToPromise(command: string) {
    return new Promise((resolve, reject) => {
        exec(command, (err, output) => {
            if (err) reject(err)
            resolve(output)
        })
    })
}

async function extractVideoInfo(filePath: string): Promise<{
    height: number
    duration: number
    bitrate: number
}> {
    return new Promise((resolve, reject) => {
        exec(`ffprobe -v error -select_streams v:0 -show_entries stream=height,duration,bit_rate -of csv=p=0 ${filePath}`,
            (err, output) => {
                if (err) reject(err);

                const [height, duration, bitrate] = output.split(',');
                resolve({
                    height: parseFloat(height),
                    duration: parseFloat(duration),
                    bitrate: parseFloat(bitrate)
                })
            }
        )
    })
}

app.post('/upload', upload.single('file'), async (req, res) => {
    let file = req.file
    if (!file) { res.status(400).end(); return; }

    let fileName = path.parse(file.originalname).name;
    let fileExtension = path.parse(file.originalname).ext;

    let inputPath = path.join(__dirname, 'videos', `${fileName}${fileExtension}`);
    await fs.writeFile(inputPath, file.buffer);
    
    let { height, duration } = await extractVideoInfo(inputPath)

    let outputPath720 = `videos/${fileName}_720p${fileExtension}`;
    let outputPath360 = `videos/${fileName}_360p${fileExtension}`;
    let outputPath144 = `videos/${fileName}_144p${fileExtension}`;

    // let commands = []
    if(height !== 720) {res.status(400).json({message: "only 720p videos are allowed"}); return;}

    if (height == 720) {
        // create a copy of the file
        // TODO: optimize this
        await fs.copyFile(inputPath, outputPath720);
        // commands.push(`ffmpeg -y -i ${inputPath} -vf scale=-1:720 ${outputPath720}`);
    }

    if (height > 360) {
        console.log("converting to 360p")
        await execToPromise(`ffmpeg -y -i ${inputPath} -vf scale=-1:360 ${outputPath360}`);
    }

    if (height > 144) {
        console.log("converting to 144p")
        await execToPromise(`ffmpeg -y -i ${inputPath} -vf scale=-1:144 ${outputPath144}`);
    }

    // split into 8 second chunks for each video=
    const splitDuration = 8

    // create folders for file, 720,360,144p chunks
    const BASE_PATH = path.join(__dirname, 'videos', file.originalname.split('.')[0])

    // assumption file is 720p
    const _720_PATH = path.join(BASE_PATH, '720p')
    const _360_PATH = path.join(BASE_PATH, '360p')
    const _144_PATH = path.join(BASE_PATH, '144p')

    console.log("creating directories")
    await fs.mkdir(BASE_PATH)
    await fs.mkdir(_720_PATH)
    await fs.mkdir(_360_PATH)
    await fs.mkdir(_144_PATH)

    for (let i = 0; i < duration; i += splitDuration) {
        // for each 720,360,144 video
        console.log(`processing ${i}th chunk out of ${Math.round(duration)}`)

        let chunkOutput720 = `720p_chunk_${i}.mp4`;
        let chunkOutput360 = `360p_chunk_${i}.mp4`;
        let chunkOutput144 = `144p_chunk_${i}.mp4`;

        await execToPromise(
            `ffmpeg -y -i ${outputPath360} -ss ${i} -codec copy -t ${splitDuration} ${path.join(_360_PATH, chunkOutput360)} -hide_banner`
        );

        await execToPromise(
            `ffmpeg -y -i ${outputPath144} -ss ${i} -codec copy -t ${splitDuration} ${path.join(_144_PATH, chunkOutput144)} -hide_banner`
        );

        await execToPromise(
            `ffmpeg -y -i ${outputPath720} -ss ${i} -codec copy -t ${splitDuration} ${path.join(_720_PATH, chunkOutput720)} -hide_banner`
        )
    }

    res.send('File processed successfully');
});

app.use('/playlists', express.static('playlists'))
app.use('/videos', express.static('videos'))

app.listen(4000, () => console.log("Application started at port", 4000))