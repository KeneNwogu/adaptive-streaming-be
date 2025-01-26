import { exec } from 'child_process';
import fs from 'fs';

import path from 'path';

async function statToPromise(path: string) {

}

async function retrieveFilesInDirectory(directory: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(directory, (err, files) => {
            if (err) reject(err);

            const filePaths = files.map(file => path.join(directory, file));
            // TODO: make non-blocking
            const onlyFiles = filePaths.filter(filePath => fs.statSync(filePath).isFile())
            resolve(onlyFiles);
        });
    });
}

async function extractVideoInfo(filePath: string): Promise<{
    width: number
    height: number
    duration: number
    bitrate: number
}> {
    return new Promise((resolve, reject) => {
        exec(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,bit_rate -of csv=p=0 ${filePath}`,
            (err, output) => {
                if (err) reject(err);

                const [width, height, duration, bitrate] = output.split(',');
                resolve({
                    width: parseFloat(width),
                    height: parseFloat(height),
                    duration: parseFloat(duration),
                    bitrate: parseFloat(bitrate)
                })
            }
        )
    })
}



async function generatePlaylist(filePath: string) {
    let fileName = path.parse(filePath).name
    let fileExtension = path.parse(filePath).ext

    let _720_PATH = path.join(__dirname, 'videos', `${fileName}_720p${fileExtension}`)
    let _360_PATH = path.join(__dirname, 'videos', `${fileName}_360p${fileExtension}`)
    let _144_PATH = path.join(__dirname, 'videos', `${fileName}_144p${fileExtension}`)

    // check if folder named file name exists in videos
    await new Promise((resolve, reject) =>
        fs.stat(path.join(__dirname, 'videos', fileName), (err, data) => {
            if (err) reject(err);
            resolve(data)
        }))

    // let { width, height, bitrate } = await extractVideoInfo(filePath)
    let videoInfo720 = await extractVideoInfo(_720_PATH);
    let videoInfo360 = await extractVideoInfo(_360_PATH);
    let videoInfo144 = await extractVideoInfo(_144_PATH);

    console.log('720p:', videoInfo720);
    console.log('360p:', videoInfo360);
    console.log('144p:', videoInfo144);

    // console.log(width, height, bitrate)

    const baseUrl = 'http://localhost:3000/playlists/' + fileName;

    const _720_DIRECTORY_PATH = path.join(__dirname, 'videos', fileName, '720p');
    const _360_DIRECTORY_PATH = path.join(__dirname, 'videos', fileName, '360p');
    const _144_DIRECTORY_PATH = path.join(__dirname, 'videos', fileName, '144p');

    const MASTER_PLAYLIST_HEADER = `#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=${videoInfo720.bitrate},RESOLUTION=${videoInfo720.width}x${videoInfo720.height}\n${baseUrl}_720p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=${videoInfo360.bitrate},RESOLUTION=${videoInfo360.width}x${videoInfo360.height}\n${baseUrl}_360p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=${videoInfo144.bitrate},RESOLUTION=${videoInfo144.width}x${videoInfo144.height}\n${baseUrl}_144p.m3u8`;

    const videoResourceBaseUrl = 'http://localhost:3000/videos/segments/' + fileName;

    let _720_FILES = await retrieveFilesInDirectory(_720_DIRECTORY_PATH)
    let _720_FILE_SEGMENTS = _720_FILES.map(file => {
        let fileName = path.parse(file).name
        let fileExtension = path.parse(filePath).ext
        return `#EXTINF:8.0,\n${videoResourceBaseUrl}/${fileName}${fileExtension}`
    })
    .reduce((prev, curr) => prev + "\n" + curr)

    const _720_SUB_PLAYLIST_BASE = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:8\n#EXT-X-MEDIA-SEQUENCE:0\n${_720_FILE_SEGMENTS}\n#EXT-X-ENDLIST`
    let _360_FILES = await retrieveFilesInDirectory(_360_DIRECTORY_PATH);
    let _360_FILE_SEGMENTS = _360_FILES.map(file => {
        let fileName = path.parse(file).name;
        let fileExtension = path.parse(filePath).ext
        return `#EXTINF:8.0,\n${videoResourceBaseUrl}/${fileName}${fileExtension}`;
    }).reduce((prev, curr) => prev + "\n" + curr);

    const _360_SUB_PLAYLIST_BASE = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:8\n#EXT-X-MEDIA-SEQUENCE:0\n${_360_FILE_SEGMENTS}\n#EXT-X-ENDLIST`;

    let _144_FILES = await retrieveFilesInDirectory(_144_DIRECTORY_PATH);
    let _144_FILE_SEGMENTS = _144_FILES.map(file => {
        let fileName = path.parse(file).name;
        let fileExtension = path.parse(filePath).ext
        return `#EXTINF:8.0,\n${videoResourceBaseUrl}/${fileName}${fileExtension}`;
    }).reduce((prev, curr) => prev + "\n" + curr);

    const _144_SUB_PLAYLIST_BASE = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:8\n#EXT-X-MEDIA-SEQUENCE:0\n${_144_FILE_SEGMENTS}\n#EXT-X-ENDLIST`;

    // Write the playlists to files
    fs.writeFileSync(path.join(__dirname, 'playlists', `${fileName}.m3u8`), 
    MASTER_PLAYLIST_HEADER.trimStart().replace("\t", ""));

    fs.writeFileSync(path.join(__dirname, 'playlists', `${fileName}_720p.m3u8`), 
    _720_SUB_PLAYLIST_BASE.replace("\t", ""));

    fs.writeFileSync(path.join(__dirname, 'playlists', `${fileName}_360p.m3u8`), 
    _360_SUB_PLAYLIST_BASE.replace("\t", ""));

    fs.writeFileSync(path.join(__dirname, 'playlists', `${fileName}_144p.m3u8`), 
    _144_SUB_PLAYLIST_BASE.replace("\t", ""));
}


generatePlaylist(path.join(__dirname, 'videos', 'test.mp4'))
    .then(() => console.log("done"))

// fs.stat(path.join(__dirname, 'videos', 'test', '720p'), (err, data) => {
//     console.log(data)
// })