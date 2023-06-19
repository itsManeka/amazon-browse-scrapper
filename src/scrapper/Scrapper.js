const Browser = require('../browser/Browser');

const browser = new Browser();

var reOfertaRelampago = new RegExp('R\\$([0-9,]+)');
var reNomeCupom = new RegExp(': ([a-zA-Z0-9]+)[ ]');
var reValorCupom = new RegExp('Salve o cupom  R\\$([0-9,]+)');
var rePctCupom = new RegExp('Salve o cupom ([0-9]+)%');
var rePctCupomAplicavel = new RegExp('Aplicar Cupom de ([0-9,]+)%');
var reValCupomAplicavel = new RegExp('Aplicar Cupom de R\\$([0-9,]+)');
var reValPromocaoSite = new RegExp('R\\$[^0-9]([0-9,]+)');
var aplPctPromocaoSite = new RegExp(' ([0-9,]+)%');
var reCodigoProduto = new RegExp('\\/([a-zA-Z0-9]+)\\?');

var inicializado = false;
var ofertas = [];
var buscaConcluida = true;

const delay=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

module.exports = {
    async navegar(url) {    
        if (!inicializado) {
            await browser.init();
            inicializado = true;
        }
        await browser.navigate(url);

        //-- Caso caia em uma página não encontrada (foto de cachorro) tenta de novo.
        //-- Comportamento implementado devido ao mal comportamento na aws
        const isPaginaCachorro = await browser.isPaginaCachorro();
        if (isPaginaCachorro) {
            await delay(500);
            await browser.navigate(url);
        }
    },

    async getData() {
        console.log(`getData - inicio`);
        const retorno = {};
        
        console.log(`busca oferta relampago`);
        retorno['relampago'] = await this.getOfertaRelampago();
        
        console.log(`busca desconto tela pagamento`);
        retorno['promocao'] = await this.getPromocao();

        console.log(`busca cupom`);
        retorno['cupom'] = await this.getCupomDesconto();

        console.log(`busca cupom destacavel`);
        retorno['destacavel'] = await this.getCupomDescontoDestacavel();

        console.log('busca promocoes');
        retorno['promocoes'] = await this.getPromo();

        console.log(`retorno`);
        return retorno;
    },

    async navegaPaginas(links, temMaisPagina) {
        const data = await browser.buscaLinksRelampago();
        if (data) {
            links = links.concat(data.links);
            if (data.continua) {
                if (temMaisPagina) {
                    temManavegaPaginasisPagina = await browser.proximaPaginaRelampago();
                    links = await this.navegaPaginas(links, temMaisPagina);
                }
            }
        }
        return links;
    },

    async buscaOfertasRelampagoLink(link) {
        const oferta = {};
        const codigo = link.match(reCodigoProduto)[1];

        await browser.navigate(`https://www.amazon.com.br/dp/${codigo}`);

        const data = await browser.getOfertaRelampago();
        if (data.preco) {
            const valor = data.preco.match(reOfertaRelampago);

            if (valor) {
                oferta.valor = parseFloat(valor[1].replace(',', '.'));
                oferta.codigo = codigo;
                oferta.departamento = data.departamento;

                return oferta;
            }
        }

        return undefined;
    },

    async buscaOfertasRelampago() {
        buscaConcluida = false;

        var links = [];
        
        try {
  
            if (!inicializado) {
                await browser.init();
                inicializado = true;
            }
            
            await browser.navigate('https://www.amazon.com.br/deals');

            const navegou = await browser.navegaOfertaRelampago();

            if (navegou) {
                links = await this.navegaPaginas(links, true);
            
                ofertas = [];

                for (const link of links) {
                    result = await this.buscaOfertasRelampagoLink(link);
                    if (result !== undefined) {
                        ofertas.push(result);
                    } else {
                        // tenta de novo (?) o aws da umas loqueada sei la
                        delay(500);
                        result = await this.buscaOfertasRelampagoLink(link);
                        if (result !== undefined) {
                            ofertas.push(result);
                        }   
                    }
                }
            }
        } catch (err) {
            console.log('erro navegando para os links das ofertas relâmpago: ' + err.message);
        }
    
        buscaConcluida = true;
        inicializado = false;
        await browser.finaliza();
    },

    async isBuscaConcluida() {
        return buscaConcluida;
    },

    async getDataBuscaRelampago() {
        return ofertas;
    },

    async getOfertaRelampago() {
        const retorno = {};

        try {
            const data = await browser.getOfertaRelampago();
            if (data.preco) {
                const result = data.preco.match(reOfertaRelampago);
                if (result) {
                    retorno['val'] = parseFloat(result[1].replace(',', '.'));
                }
            }
        } catch (err) {
            console.log(`erro ao ler oferta relampago: ${err.message}`);
        }

        return retorno;
    },

    async getPromocao() {
        const retorno = {}

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

        try {
            const cupomDesconto = await browser.getCupomDesconto();
            
            var result = cupomDesconto.match(reNomeCupom);
            if (result) {
                retorno['nome'] = result[1];
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
    },

    async getPromo() {
        const retorno = {}

        try {
            const promocao = await browser.checkPromo();

            var texto = "";
            var link = "";
            if (promocao) {
                texto = promocao[0];
                link = promocao[1];
            }

            if (texto != "" && link != "") {
                retorno['texto'] = texto;
                retorno['link'] = link;
            }
            
            return retorno;
        } catch (err) {
            console.log(`erro ao ler promocoes: ${err.message}`);
        }
    }

}