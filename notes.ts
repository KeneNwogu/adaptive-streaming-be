// console.log(videoInfo)

// convert to 360p and 144p

// ffmpegInfoProcess.on('error', (e) => console.log(e))

// ffmpegInfoProcess.on('exit', (code) => console.log(code))

// split the buffer by half and save as a video and see if it works
// Initial idea to split video
// get the byte subarray from buffer and write it to a new file
// it did not work becase it did not use the video header
// luckily ffmpeg has a utility for this 

// let firstHalf = file.buffer.subarray(0, Math.round(file.buffer.length / 2))
// await fs.writeFile(path.join(__dirname, 'videos', 'half_vid_test.mp4'), firstHalf)
// split video into 5s intervals with for-loop,


// utility for trimming videos
// let ffmpegTrimProcess = spawn('ffmpeg', 
//     ['-y', '-i',
//         path.join(__dirname, 'videos', 'test.mp4'), 
//         '-ss', '20', '-codec', 'copy', '-t', '20', 'trim_test_2.mp4', '-hide_banner'
//     ])

// -y means overwrite file if exists
// -i flag for input
// -ss start time
// -t duration from start time (default of start time is zero)
// -codec 
// output file
// -hide_banner to remove ffmpeg info banner

// ffmpegTrimProcess.stdout.on('data', (data) => console.log(data.toString('utf-8')))
// ffmpegTrimProcess.stderr.on('data', (data) => console.log(data.toString('utf-8')))
// ffmpeg -i input.mp4 -ss 00:00:50 -codec copy -t 50 output.mp4
// ffmpegTrimProcess.st




// basics, upload file, get information of that file
// initial process to get file information before learning about ffprobe
// createWriteStream
// await fs.writeFile(path.join(__dirname, 'videos', file.originalname), file.buffer)

// let ffmpegInfoProcess = spawn('ffmpeg', ['-i', path.join(__dirname, 'videos', 'test.mp4'), '-hide_banner'])

// ffmpegInfoProcess.stdout.on('data', (data: Buffer) => {
//     console.log('data from stdout')
//     console.log(data.toString('utf-8'))
// })

// ffmpegInfoProcess.stderr.on('data', (data) => {
//     // console.log('data from stderror')
//     // parse output to json
//     // get bitrate
//     // get resolution
//     // get duration
//     const bitrateRegex = new RegExp("[B|b]itrate:.((\\d|:)*)");

//     let output = data.toString('utf-8')
//     if (bitrateRegex.test(output)) {
//         let groups = bitrateRegex.exec(output)
//         if(groups?.length){ 
//             let bitrate = parseFloat(groups[1])
//             console.log("bit rate:", groups[1])
//         }
//     }

//     let videoFormatRegex = new RegExp("[V|v]ideo:.*");
//     if(videoFormatRegex.test(output)){
//         let groups = videoFormatRegex.exec(output)
//         console.log(groups)
//         // if(groups?.length) console.log("video format", groups[1])
//     }

//     // console.log(output.split('\r'))
//     let durationRegex = new RegExp("[D|d]uration:.((\\d|:|\\.)*)")
//     if (durationRegex.test(output)) {
//         let groups = durationRegex.exec(output)
//         if (groups?.length) {
//             let duration = groups[1];
//             duration = duration.replace('.', ':')
//             let timepieces = duration.split(':');
//             console.log(totalDurationInSeconds(timepieces))
//         }

//         // 
//         // if (timepieces.Length == 4) {
//         //     input.Duration = new TimeSpan(0, Convert.ToInt16(timepieces[0]), Convert.ToInt16(timepieces[1]), Convert.ToInt16(timepieces[2]), Convert.ToInt16(timepieces[3]));
//         // }
//     }
// })

// exec(`ffprobe -v error -select_streams v:0 -show_entries stream=height,duration,bit_rate -of csv=p=0 videos/test.mp4`,
//     (err, output) => {
//         if(err) throw err;

//         const [height, duration, bitrate] = output.split(',');
//         console.log(height)
//         console.log(duration)
//         console.log(bitrate)
//     }
// )