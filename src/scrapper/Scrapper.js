const Browser = require('../browser/Browser');

const browser = new Browser();

var reVendedor = new RegExp('seller=([a-zA-Z0-9]+)&');
var reValorReais = new RegExp('R\\$([0-9,.]+)');
var reNomeCupom = new RegExp(': ([a-zA-Z0-9]+)[ ]');
var reNomeCupom2 = new RegExp('código ([a-zA-Z0-9]+)[ ]');
var reValorCupom = new RegExp('Salve o cupom  R\\$([0-9,]+)');
var rePctCupom = new RegExp('Salve o cupom ([0-9]+)%');
var rePctCupomAplicavel = new RegExp('Aplicar Cupom de ([0-9,]+)%');
var reValCupomAplicavel = new RegExp('Aplicar Cupom de R\\$([0-9,]+)');
var reValPromocaoSite = new RegExp('R\\$[^0-9]([0-9,]+)');
var aplPctPromocaoSite = new RegExp(' ([0-9,]+)%');
var reCodigoProduto = new RegExp('\\/([a-zA-Z0-9]+)\\?');
var reDataValidadeCupom = new RegExp('([1-9]+) de ([a-zA-Z]+) [\\S\\s]+ ([1-9]+) de ([a-zA-Z]+)');

var inicializado = false;
var ofertas = {};
ofertas.sucesso = false;
ofertas.codigo = -1;
ofertas.mensagem = '';
var buscaConcluida = true;

var cupom = {};
cupom.sucesso = false;
cupom.codigo = -1;
cupom.mensagem = '';
var buscaCupomConcluida = false;

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
        const retorno = {};

        retorno['preco'] = await this.getPrecos();
        retorno['relampago'] = await this.getOfertaRelampago();
        retorno['primeday'] = await this.getOfertaPrimeDay();
        retorno['promocao'] = await this.getPromocao();
        retorno['cupom'] = await this.getCupomDesconto();
        retorno['destacavel'] = await this.getCupomDescontoDestacavel();

        return retorno;
    },

    async navegaPaginas(links, temMaisPagina) {
        const data = await browser.buscaLinksRelampago();
        if (data) {
            links = links.concat(data.links);
            if (data.continua) {
                if (temMaisPagina) {
                    temMaisPagina = await browser.proximaPaginaRelampago();
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
            const valor = this.trataValor(data.preco);
            if (valor) {
                oferta.valor = valor;
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
            
                ofertas.ofertas = [];

                for (const link of links) {
                    result = await this.buscaOfertasRelampagoLink(link);
                    if (result !== undefined) {
                        ofertas.ofertas.push(result);
                    } else {
                        // tenta de novo (?) o aws da umas loqueada sei la
                        delay(500);
                        result = await this.buscaOfertasRelampagoLink(link);
                        if (result !== undefined) {
                            ofertas.ofertas.push(result);
                        }   
                    }
                }
            }
            
            ofertas.sucesso = true
        } catch (err) {
            console.log('erro navegando para os links das ofertas relâmpago: ' + err.message);
            ofertas.codigo = err.code;
            ofertas.mensagem = err.message;
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

    trataValor(valor) {
        valor = valor.replace(/\s/g,'');
        var result = valor.match(reValorReais);
        if (result) {
            return parseFloat(result[1].replace('.', '').replace(',', '.'));
        }

        return undefined;
    },

    async getPrecos() {
        var retorno = {};
        var encontrou = false;

        try {
            var data = await browser.getPrecoProduto();
            if (data) {
                var result = undefined;

                if (data.preco) {
                    result = this.trataValor(data.preco);
                    if (result) {
                        retorno['preco'] = result;
                        encontrou = true;
                    }
                }
                if (data.precoCheio) {
                    result = this.trataValor(data.precoCheio);
                    if (result) {
                        retorno['precoCheio'] = result;
                        encontrou = true;
                    }
                }
                if (data.vendedor) {
                    result = data.vendedor.match(reVendedor);
                    if (result) {
                        retorno['vendedor'] = result[1];
                    }
                }
                if (encontrou) {
                    return retorno;
                }
            } else {
                retorno = undefined;
            }
        } catch (err) {
            console.log(`erro ao ler preços: ${err.message}`);
            retorno = undefined;
        }

        return undefined;
    },

    async getOfertaRelampago() {
        const retorno = {};

        try {
            const data = await browser.getOfertaRelampago();
            if (data.preco) {
                const result = this.trataValor(data.preco);
                if (result) {
                    retorno['val'] = result;
                }
            }
        } catch (err) {
            console.log(`erro ao ler oferta relampago: ${err.message}`);
        }

        return retorno;
    },

    async getOfertaPrimeDay() {
        const retorno = {};

        try {
            const preco = await browser.getOfertaPrimeDay();
            if (preco) {
                const result = this.trataValor(preco);
                if (result) {
                    retorno['val'] = result;
                }
            }
        } catch (err) {
            console.log(`erro ao ler oferta primeday: ${err.message}`);
        }

        return retorno;
    },

    lePromocao(promocao) {
        var retorno = {};

        var valor = "";
        var link = "";

        var encontrouPromo = false;

        try {
            if (promocao['valor'] !== undefined) {
                valor = promocao['valor'];
            }
            
            if (promocao['link'] !== undefined) {
                link = promocao['link'];
            }
            
            var result = valor.match(reValPromocaoSite);
            if (result) {
                retorno['val'] = parseFloat(result[1].replace(',', '.'));
                encontrouPromo = true;
            }
            
            var result = valor.match(aplPctPromocaoSite);
            if (result) {
                retorno['pct'] = parseFloat(result[1].replace(',', '.'));
                encontrouPromo = true;
            }

            if (encontrouPromo) {
                retorno['link'] = link;
            } else {
                retorno = undefined;
            }
        } catch (err) {
            console.log(`erro ao ler promocao: ${err.message}`);
        }

        return retorno;
    },

    async getPromocao() {
        var retorno = {};

        var encontrouPromo = false;

        try {
            const promocaoSite = await browser.getPromocao();

            if (promocaoSite) {
                if (promocaoSite['promocaoNormal'] !== undefined) {
                    const promocaoLida = this.lePromocao(promocaoSite['promocaoNormal']);
                    if (promocaoLida) {
                        retorno['promocaoNormal'] = promocaoLida;
                        encontrouPromo = true;
                    }
                }

                if (promocaoSite['promocaoAplicavel'] !== undefined) {
                    const promocaoLida = this.lePromocao(promocaoSite['promocaoAplicavel']);
                    if (promocaoLida) {
                        retorno['promocaoAplicavel'] = promocaoLida;
                        encontrouPromo = true;
                    }
                }
            }

            if (!encontrouPromo) {
                retorno = undefined;
            }
        } catch (err) {
            console.log(`erro ao ler promocao: ${err.message}`);
            retorno = undefined;
        }

        return retorno;
    },

    async getCupomDesconto() {
        const retorno = {}

        try {
            const cupom = await browser.getCupomDesconto();
            const texto = cupom.texto;
            retorno['link'] = cupom.link;

            var result = texto.match(reNomeCupom);
            if (result) {
                retorno['nome'] = result[1];
            } else {
                result = texto.match(reNomeCupom2);
                if (result) {
                    retorno['nome'] = result[1];
                }
            }
            
            var result = texto.match(reValorCupom);
            if (result) {
                retorno['val'] = parseFloat(result[1].replace(',', '.'));
            } else {
                result = texto.match(reValPromocaoSite);
                if (result) {
                    retorno['val'] = parseFloat(result[1].replace(',', '.'));
                }
            }
            
            var result = texto.match(rePctCupom);
            if (result) {
                retorno['pct'] = parseFloat(result[1].replace(',', '.'));
            } else {
                result = texto.match(aplPctPromocaoSite);
                if (result) {
                    retorno['pct'] = result[1];
                }
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
            
            var result = cupomDesconto.match(reValCupomAplicavel);
            if (result) {
                retorno['val'] = parseFloat(result[1].replace(',', '.'));
                retorno['nome'] = '[DESTACAVEL]';
            }
            
            var result = cupomDesconto.match(rePctCupomAplicavel);
            if (result) {
                retorno['pct'] = parseFloat(result[1].replace(',', '.'));
                retorno['nome'] = '[DESTACAVEL]';
            }
        } catch (err) {
            console.log(`erro ao ler desconto destacavel: ${err.message}`);
        }

        return retorno;
    },

    getData(dia, mes) {
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();

        const meses = {
            janeiro: 0,
            fevereiro: 1,
            março: 2,
            abril: 3,
            maio: 4,
            junho: 5,
            julho: 6,
            agosto: 7,
            setembro: 8,
            outubro: 9,
            novembro: 10,
            dezembro: 11,
        };

        if (meses.hasOwnProperty(mes.toLowerCase())) {
            const data = new Date(anoAtual, meses[mes.toLowerCase()], dia);
            return data;
        }

        return undefined;
    },
    
    async buscarItensCupom(url) {
        buscaCupomConcluida = false;

        var validadeFim;
        var validadeInicio;

        var produtos = [];
        
        try {
            if (!inicializado) {
                await browser.init();
                inicializado = true;
            }
            
            await browser.navigate(url);
          
            const textoValidade = await browser.getValidadeCupom();

            if (textoValidade !== undefined && textoValidade !== null && textoValidade !== '') {
                var validade = textoValidade.match(reDataValidadeCupom);
                if (validade && validade.length === 5) {
                    const diaInicio = validade[1];
                    const mesInicio = validade[2];
                    const diaFim = validade[3];
                    const mesFim = validade[4];

                    validadeInicio = this.getData(diaInicio, mesInicio);
                    validadeFim = this.getData(diaFim, mesFim);
                }

                if (validadeInicio && validadeFim) {
                    produtos = await browser.buscaItensCupom();
                    console.log(`qtd: ${produtos.length}`);
                    if (produtos) {
                        cupom.sucesso = true;
                        cupom.produtos = produtos;
                        cupom.inicio = validadeInicio;
                        cupom.fim = validadeFim;
                    }
                }
            }
        } catch (err) {
            console.log('erro navegando para buscar itens cupons: ' + err.message);
            cupom.codigo = err.code;
            cupom.mensagem = err.message;
        }
    
        buscaCupomConcluida = true;
        inicializado = false;
        await browser.finaliza();
    },

    async getDataCupons() {
        return cupom;
    },
    
    async isBuscaCupomConcluida() {
        return buscaCupomConcluida;
    },
}