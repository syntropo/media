import express from 'express'
import { ProbeRequest } from './declarations';

const app = express()

app.use(express.json())


app.post('/probe', function (req, res) {
  const request: ProbeRequest = req.body
  res.send('Hello World!')
})

app.listen(process.env.MEDIA_PORT || 3000)