const express = require('express');
const scrapper = require('./src/scrapper/Scrapper');

const app = express();
const port = 8080;

app.get('/api/data', async function(req, res) {
    const url = decodeURIComponent(req.query.url);
    
    try {
        console.log(`requisição iniciada`);
        await scrapper.navegar(url);
        const data = await scrapper.getData();
        res.send({
            'data': data
        })

    } catch (err) {
        res.send({
            'erro': err.message
        })
    }
});

app.get('/api/buscarelampago/busca', async function(req, res) {
    try {
        console.log('busca iniciada');
        scrapper.buscaOfertasRelampago();
        res.send({
            'data': 1
        })
    } catch (err) {
        res.send({
            'erro': err.message
        })
    }
});

app.get('/api/buscarelampago/results', async function(req, res) {
    try {
        console.log('verifica se concluiu');
        const concluida = await scrapper.isBuscaConcluida();
        if (concluida) {
            const data = await scrapper.getDataBuscaRelampago();
            res.send({
                'concluida': concluida,
                'data': data
            })
        } else {
            res.send({
                'data': concluida
            })
        }
    } catch (err) {
        res.send({
            'erro': err.message
        })
    }
});

app.listen(port);
console.log(`Server started`);