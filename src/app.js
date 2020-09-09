const express = require('express')
const dataRouter = require('./routes/data')

const bodyParser = require('body-parser')

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.raw('application/octet-stream'))

app.use('/v1/data', dataRouter);

app.listen(process.env.HTTP_PORT, () => 
    console.log(`App started to listen for HTTP on ${process.env.HTTP_PORT}`),
);