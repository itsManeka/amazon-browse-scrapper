const express = require('express');
const scrapper = require('./src/scrapper/Scrapper');

const app = express();
const port = 8080;

app.get('/api/data', async function(req, res) {
    const url = decodeURIComponent(req.query.url);

    try {
        await scrapper.navegar(url);
        const data = await scrapper.getData();
        res.send({
            'data': data
        })

    } catch (err) {
        res.send({
            'erro': err
        })
    }
});

app.listen(port);
console.log('Server started');