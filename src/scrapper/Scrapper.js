const Browser = require('../browser/Browser');

const browser = new Browser();

var reOfertaRelampago = new RegExp('([0-9,\.]+)');
var reNomeCupom = new RegExp('promocional ([a-zA-Z0-9]+) ');
var reValorCupom = new RegExp('^R\\$([0-9,]+)');
var rePctCupom = new RegExp('^([0-9]+)%');
var rePctCupomAplicavel = new RegExp(' ([0-9,]+)%');
var reValCupomAplicavel = new RegExp(' R\\$([0-9,]+)');
var reValPromocaoSite = new RegExp('R\\$[^0-9]([0-9,]+)');
var aplPctPromocaoSite = new RegExp(' ([0-9,]+)%');

var inicializado = false;

module.exports = {
    async navegar(url) {
        if (!inicializado) {
            await browser.init();
            inicializado = true;
        }
        await browser.navigate(url);
    },

    async getData() {
        const retorno = {};

        retorno['relampago'] = await this.getOfertaRelampago();
        retorno['promocao'] = await this.getPromocao();
        retorno['cupom'] = await this.getCupomDesconto();
        retorno['destacavel'] = await this.getCupomDescontoDestacavel();

        return retorno;
    },

    async getOfertaRelampago() {
        const retorno = {};

        retorno['val'] = 0.00;

        try {
            const ofertaRelampago = await browser.getOfertaRelampago();
            const result = ofertaRelampago.match(reOfertaRelampago);
            if (result) {
                retorno['val'] = parseFloat(result[1].replace(',', '.'));
            }
        } catch (err) {
            console.log(`erro ao ler oferta relampago: ${err.message}`);
        }

        return retorno;
    },

    async getPromocao() {
        const retorno = {}

        retorno['pct'] = 0.00;
        retorno['val'] = 0.00;

        try {
            const promocaoSite = await browser.getPromocao();
            
            var result = promocaoSite.match(reValPromocaoSite);
            if (result) {
                retorno['val'] = parseFloat(result[1].replace(',', '.'));
            }
            
            var result = promocaoSite.match(aplPctPromocaoSite);
            if (result) {
                retorno['pct'] = parseFloat(result[1].replace(',', '.'));
            }
        } catch (err) {
            console.log(`erro ao ler promocao: ${err.message}`);
        }

        return retorno;
    },

    async getCupomDesconto() {
        const retorno = {}

        retorno['pct'] = 0.00;
        retorno['val'] = 0.00;
        retorno['nome'] = '';

        try {
            const cupomDesconto = await browser.getCupomDesconto();

            var result = cupomDesconto.match(reNomeCupom);
            if (result) {
                retorno['nome'] = parseFloat(result[1]);
            }
            
            var result = cupomDesconto.match(reValorCupom);
            if (result) {
                retorno['val'] = parseFloat(result[1].replace(',', '.'));
            }
            
            var result = cupomDesconto.match(rePctCupom);
            if (result) {
                retorno['pct'] = parseFloat(result[1].replace(',', '.'));
            }
        } catch (err) {
            console.log(`erro ao ler desconto: ${err.message}`);
        }

        return retorno;
    },

    async getCupomDescontoDestacavel() {
        const retorno = {}

        retorno['pct'] = 0.00;
        retorno['val'] = 0.00;
        retorno['nome'] = '';

        try {
            const cupomDesconto = await browser.getCupomDescontoDestacavel();
            console.log(cupomDesconto);
            var result = cupomDesconto.match(reValCupomAplicavel);
            if (result) {
                retorno['val'] = parseFloat(result[1].replace(',', '.'));
                retorno['nome'] = '[DESTACAVEL]';
            }
            
            var result = cupomDesconto.match(rePctCupomAplicavel);
            if (result) {
                console.log("deu match")
                retorno['pct'] = parseFloat(result[1].replace(',', '.'));
                retorno['nome'] = '[DESTACAVEL]';
            }
        } catch (err) {
            console.log(`erro ao ler desconto destacavel: ${err.message}`);
        }

        return retorno;
    }

}