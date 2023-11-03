# Audio Transcriber and Summarizer

This Node.js script allows you to transcribe local audio files or YouTube videos using OpenAI's Whisper ASR model. Additionally, it can summarize the content of the transcript using ChatGPT. Please follow the instructions below to get started.

## Prerequisites

Make sure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (version 12 or higher)
- [npm](https://www.npmjs.com/) (Node.js package manager)

## Installation

1. Clone the repository to your local machine:

   ```
   git clone https://github.com/Pdbz199/audio-transcriber-summarizer
   ```

2. Navigate to the project directory:

   ```
   cd audio-transcriber-summarizer
   ```

3. Install the required npm packages:

   ```
   npm install
   ```

4. Create a `.env` file in the root directory of the project and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Replace `your_openai_api_key_here` with your actual OpenAI API key.

## Usage

Run the script with the following command:

```
npx ts-node transcribe <AUDIO_FILE_OR_URL> --summarize=<true/false> --gpt-model=<gpt3_5/gpt4>
```

Replace `<AUDIO_FILE_OR_URL>` with the local file path or YouTube video URL you want to transcribe.

Optional arguments:

- `--summarize=<true/false>`: Specify whether to summarize the transcript using ChatGPT. Set to `true` if you want to enable summarization, or `false` if you want only the transcription.
- `--gpt-model=<gpt3_5/gpt4>`: Choose the ChatGPT model to use for summarization. Options are `gpt3_5` and `gpt4`.

**Note:** Depending on the length of the transcript, summarization may fail for very long content.

## Example

Transcribe a YouTube video and summarize the content:

```
npm run transcribe -- https://www.youtube.com/watch?v=examplevideo --summarize=true --gpt-model=gpt3_5
```
