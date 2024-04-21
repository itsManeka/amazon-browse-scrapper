require("dotenv").config();

const express = require('express');
const scrapper = require('./src/scrapper/Scrapper');

const app = express();

var port = 0;
if (process.env.NODE_ENV !== 'production') {
    port = 9090;
    console.log('rodando em ambiente de teste.');
} else {
    port = 8080;
    console.log('rodando em ambiente de producão.');
}

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
    var data = {};

    try {
        console.log('verifica se concluiu');

        const concluida = await scrapper.isBuscaConcluida();
        
        data = await scrapper.getDataBuscaRelampago();

        res.send({
            'concluida': concluida,
            'data': data
        })
    } catch (err) {
        data.sucesso = false;
        data.codigo = err.code;
        data.mensagem = err.message;

        res.send({
            'concluida': false,
            'data': data
        })
    }
});

app.get('/api/buscacupom/busca', async function(req, res) {
    const url = decodeURIComponent(req.query.url);

    try {
        console.log('busca iniciada');
        scrapper.buscarItensCupom(url);
        res.send({
            'data': 1
        })
    } catch (err) {
        res.send({
            'erro': err.message
        })
    }
});

app.get('/api/buscacupom/results', async function(req, res) {
    var data = {};

    try {
        console.log('verifica se concluiu');
        
        const concluida = await scrapper.isBuscaCupomConcluida();

        data = await scrapper.getDataCupons();
        
        res.send({
            'concluida': concluida,
            'data': data
        });
    } catch (err) {
        data.sucesso = false;
        data.codigo = err.code;
        data.mensagem = err.message;

        res.send({
            'concluida': false,
            'data': data
        });
    }
});

app.listen(port);
console.log(`Server ouvindo na porta ${port}`);