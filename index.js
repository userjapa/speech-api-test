const app = require('express')()
const bodyParser = require('body-parser')
const cors = require('cors')
const serveStatic = require('serve-static')
const path = require('path')
const fs = require('fs')
const textToSpeech = require('@google-cloud/text-to-speech')

const PORT = process.env.PORT || 4200

// Get Client
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, 'minds-ead-final-30c2bb4d4c0a.json')
})

// Set Request Default Body
const request = {
  voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
  audioConfig: { audioEncoding: 'MP3' },
}

// Set SynthesizeSpeech Callback
const synthesizeSpeech = word => {
  return new Promise((resolve, reject) => {
    const body = { input: { text: word }, ...request }
    const filePath = path.join(__dirname, 'static', `${word}.mp3`)
    if (fs.existsSync(filePath)) resolve({ path: filePath, word: word })
    client.synthesizeSpeech(body, (error, response) => {
      if (error) reject(error)
      fs.writeFile(filePath, response.audioContent, 'binary', err => {
        if (err) reject(err)
        else resolve({ path: filePath, word: word })
      })
    })
  })
}

// Set MiddleWares
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors({
  origin: '*',
  methods: 'GET, POST, PUT, DELETE',
  allowedHeaders: ['Content-Type']
}))
app.use(serveStatic(path.join(__dirname, 'src')))

// Set Routes
app.get('/speech/:word', async (req, res) => {
  const word = req.params.word
  const stream = fs.createReadStream(path.join(__dirname, 'static', `${word}.mp3`))
  stream.pipe(res)
})

app.post('/speech/:word', async (req, res) => {
  const word = req.params.word
  const response = { valid: true }
  try {
    response.data = await synthesizeSpeech(word)
  } catch (error) {
    console.log(error);
    response.valid = false
    response.error = error
  } finally {
    res.json(response)
  }
})

// Set Server
app.listen(PORT, () => {
  console.log(`Listening at ${PORT}`);
})
