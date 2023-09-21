import dotenv from 'dotenv'
dotenv.config()

import { ArgumentParser } from 'argparse'
import { execSync } from 'child_process'
import fs from 'fs'
import { Configuration, OpenAIApi } from 'openai'
import ytdl from 'ytdl-core'

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)

// Parse input params
const parser = new ArgumentParser({ description: 'Transcribe some audio files or YouTube URLs' })
parser.add_argument('file_names_or_urls', {
    type: 'str',
    nargs: '+',
    help: 'Audio file names or YouTube video URLs'
})
parser.add_argument('--summarize', {
    type: x => x.toLowerCase() === 'true',
    default: true,
    nargs: '?',
    const: true,
    help: 'Whether to summarize the audio transcript or not (default: true)'
})
const args = parser.parse_args()

/** Split an audio file into smaller chunks */
function splitAudioFile(audioFileName: string) {
    try {
        const command = `ffmpeg -i ${audioFileName} -f segment -segment_time 200 -c:a libmp3lame out%03d.mp3`
        execSync(command, { stdio: 'inherit' })
    } catch (error: any) {
        console.error(`Error splitting audio: ${error.stderr ? error.stderr.toString() : error.message}`)
    }
}

/** Clean up chunked audio files created during transcript generation */
function cleanupAudioChunks() {
    let i = 0
    let fileName = `out${String(i).padStart(3, '0')}.mp3`
    while (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName)

        fileName = `out${String(++i).padStart(3, '0')}.mp3`
    }
}

/** Transcribe small audio file using OpenAI's whisper */
async function transcribeSmallAudioFile(audioFileName: string) {
    try {
        // @ts-ignore Can't figure out where the File object is supposed to come from
        const resp = await openai.createTranscription(fs.createReadStream(audioFileName), 'whisper-1')
        return resp.data.text // Adjust based on actual response structure
    } catch (error: any) {
        console.error(`Error transcribing: ${error.message}`)
        return null
    }
}

/** The main function to process files and aggregate transcriptions */
async function transcribeLargeAudioFile(audioFileName: string) {
    // Split the audio file into smaller chunks as needed
    splitAudioFile(audioFileName)

    // Transcribe each audio chunk
    let aggregatedTranscription = ''
    let i = 0
    let fileName = `out${String(i).padStart(3, '0')}.mp3`
    while (fs.existsSync(fileName)) {
        console.log(`Processing file: ${fileName}`)
        const transcription = await transcribeSmallAudioFile(fileName)
        fileName = `out${String(++i).padStart(3, '0')}.mp3`

        if (transcription === undefined) {
            console.error(`Failed to transcribe ${fileName}.`)
            continue
        }

        aggregatedTranscription += transcription + '\n\n'
        console.log(`Transcription for ${fileName} added.`)
    }

    // Delete the chunks after processing
    cleanupAudioChunks()

    // Ensure that transcript is not empty
    if (aggregatedTranscription === '') {
        console.error('No transcriptions were processed.')
        return
    }

    // Save transcription to file
    const outputFile = audioFileName.replace('.mp3', '.txt')
    fs.writeFileSync(outputFile, aggregatedTranscription, 'utf8')
    console.log(`All transcriptions aggregated and saved to ${outputFile}.`)

    // Attempt to summarize if requested
    if (args.summarize) {
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: 'Please give me a summary of the following transcript. Be sure to outline any big ideas\n' +
                                `\`\`\`${aggregatedTranscription}\`\`\``
                }
            ]
        })
        console.log(response.data.choices[0].message.content)
    }
}

/** Function to download audio from YouTube */
async function downloadAudioFromYouTube(youtubeLink: string) {
    // Get audio details from YouTube
    const videoInfo = await ytdl.getInfo(youtubeLink)
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, { filter: 'audioonly' })

    // Extract the video code from the YouTube link
    const videoCode = new URL(youtubeLink).searchParams.get('v')
    const outputFileName = `${videoCode}.mp3`

    // Confirm that there is a defined audio format fom YouTube
    if (audioFormat === undefined) {
        console.error(`Couldn't find an audio-only format for ${videoCode}`)
        return
    }

    // Download audio from YouTube into output file
    ytdl(youtubeLink, { format: audioFormat })
        .pipe(fs.createWriteStream(outputFileName))
        .on('finish', () => {
            console.log(`Audio downloaded and saved as ${outputFileName}`)
            transcribeLargeAudioFile(outputFileName) // Process the downloaded audio
        })
}

async function main() {
    // Loop through all inputs and transcribe
    for (const fileNameOrUrl of args.file_names_or_urls) {
        // Determine if the input is a YouTube link or a local file, and proceed accordingly
        if (fileNameOrUrl.startsWith('https://www.youtube.com/')) {
            downloadAudioFromYouTube(fileNameOrUrl)
        } else if (fileNameOrUrl.endsWith('.mp3')) {
            transcribeLargeAudioFile(fileNameOrUrl)
        } else {
            console.error('Invalid input. Please provide an mp3 file.')
        }
    }
}

main()