const puppeteer = require('puppeteer');

class Browser {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async delay(ms) {
        return new Promise(resolve=>setTimeout(resolve, ms))
    }

    async getPage() {
        return this.page;
    }

    async init() {
        this.browser = await puppeteer.launch(/*{headless: false}*/);
        this.context = await this.browser.createIncognitoBrowserContext();
        this.page = await this.context.newPage();
    }

    async navigate(url) {
        await this.page.goto(url);
    }

    async finaliza() {
        await this.browser.close();
    }

    async isPaginaCachorro() {
        const selector = '#d';
        const retorno = await this.page.evaluate(selector => {
            var cachorro = document.querySelector(selector);
            if (cachorro) {
                return true;
            }
            return false;
        }, selector);

        return retorno;
    }

    async navegaOfertaRelampago() {
        try {
            const selector = 'a[data-csa-c-element-id*="LIGHTNING_DEAL"]';
            const botao = await this.page.waitForSelector(selector);
            await botao.click();
    
            await this.page.waitForNavigation();

            return true;
        } catch (e) {
            console.log('erro navegando para ofertas relâmpago: ' + e.message);
        }

        return false;
    }

    async buscaLinksRelampago() {
        var data;

        try {
            const selector = "a[class*='linkOutlineOffset']";
            await this.page.waitForSelector(selector);
            data = await this.page.evaluate(selector => {
                var data = {};
                data.links = [];
                data.continua = true;

                document.querySelectorAll(selector).forEach(element => {
                    next = element.nextElementSibling;
                    botaoSeguirOferta = next.querySelector("span[aria-label='Seguir oferta']");
                    if (botaoSeguirOferta) {
                        data.continua = false;
                        return;
                    } else {
                        data.links.push(element.href);
                    }
                });
                return data;                
            }, selector);
        } catch (e) {
            console.log('Erro buscando links relampago: ' + e.message);
        }

        return data;
    }

    async proximaPaginaRelampago() {
        try {
            const selector = 'li[class="a-last"]';
            const proximaPagina = await this.page.waitForSelector(selector);
            if (proximaPagina) {
                const botaoProximaPagina = await proximaPagina.waitForSelector('a');
                if (botaoProximaPagina) {
                    await botaoProximaPagina.click();
                    await this.page.waitForNavigation();
                    return true;
                }
            }
        } catch (e) {
            console.log('erro navegando para próxima página relâmpago: ' + e.message);
        }

        return false;
    }

    async getOfertaRelampago() {
        const data = {};
        
        try {
            const quadroSelector = '#dealsAccordionCaption_feature_div';

            const ofertaRelampago = await this.page.evaluate(quadroSelector => {
                var label = document.querySelector(quadroSelector);
                if (label) {
                    if (label.textContent.trim().includes('Oferta Relâmpago')) {
                        var preco = label.nextElementSibling.querySelector('#corePrice_feature_div');
                        if (preco) {
                            return preco.textContent.trim();
                        }
                    }
                }
            }, quadroSelector);

            if (ofertaRelampago != "" && ofertaRelampago != undefined) {
                data.preco = ofertaRelampago;

                const departamentoSelector = 'a[class="a-link-normal a-color-tertiary"]';
                const departamento = await this.page.evaluate(departamentoSelector => {
                    var elemento = document.querySelector(departamentoSelector);
                    if (elemento) {
                        return elemento.textContent.trim();
                    }
                }, departamentoSelector);

                if (departamento != "" && departamento != undefined) {
                    data.departamento = departamento;
                }

                return data;
            }
        } catch (err) {
            console.log(`Erro ao ler oferta relampago: ${err.message}`);
        }

        return '';
    }

    async getOfertaPrimeDay() {
        try {
            const quadroSelector = '#dealsAccordionCaption_feature_div,#primeSavingsUpsellCaption_feature_div';

            const ofertaPrime = await this.page.evaluate(quadroSelector => {
                var label = document.querySelector(quadroSelector);
                if (label) {
                    if (label.textContent.trim().toUpperCase().includes('OFERTA EXCLUSIVA PRIME')) {
                        var preco = label.nextElementSibling.querySelector('#corePrice_feature_div');
                        if (preco) {
                            return preco.textContent.trim();
                        }
                    }
                }
            }, quadroSelector);

            if (ofertaPrime != "" && ofertaPrime != undefined) {
                return ofertaPrime;
            }
        } catch (err) {
            console.log(`Erro ao ler oferta primeday: ${err.message}`);
        }

        return '';
    }

    async getPrecoProduto() {
        var vendedor = '';

        try {
            var quadroSelector = "";

            quadroSelector = '#sellerProfileTriggerId';
            vendedor = await this.page.evaluate(quadroSelector => {
                var elemento = document.querySelector(quadroSelector);
                if (elemento) {
                    return elemento.href.trim();
                }
            }, quadroSelector);

            if ((vendedor === undefined) || (vendedor === null)) {
                quadroSelector = 'div[offer-display-feature-name="desktop-merchant-info"][class="offer-display-feature-text"]';
                vendedor = await this.page.evaluate(quadroSelector => {
                    var elemento = document.querySelector(quadroSelector);
                    if (elemento) {
                        return elemento.innerText.trim().toUpperCase();
                    }
                }, quadroSelector);

                if (vendedor == "AMAZON.COM.BR") {
                    vendedor = "seller=A1ZZFT5FULY4LN&";
                }
            }
            
            quadroSelector = '#Ebooks-desktop-KINDLE_ALC-prices';
            var preco = await this.page.evaluate(quadroSelector => {
                const quadro = document.querySelector(quadroSelector);
                if (quadro) {
                    var preco = undefined;
                    var precoCheio = undefined;

                    const elementoPreco = quadro.querySelector('#kindle-price');
                    const elementoPrecoCheio = quadro.querySelector('#basis-price');
                    
                    if (elementoPreco) { 
                        preco = elementoPreco.innerText.trim(); 
                    }

                    if (elementoPrecoCheio) { 
                        precoCheio = elementoPrecoCheio.innerText.trim();
                    }

                    if (preco || precoCheio) {
                        var kindle = {};
                        kindle['preco'] = preco;
                        kindle['precoCheio'] = precoCheio;
                        return kindle
                    } else {
                        return undefined;
                    }
                }
            }, quadroSelector);

            if (!preco) {
                quadroSelector = '#addToCart';
                preco = await this.page.evaluate(quadroSelector => {
                    const quadro = document.querySelector(quadroSelector);
                    if (quadro) {
                        var preco = undefined;
                        var precoCheio = undefined;

                        const elementoPreco = quadro.querySelector('#price');
                        const elementoPrecoCheio = quadro.querySelector('#listPrice');
                        
                        if (elementoPreco) { 
                            preco = elementoPreco.innerText.trim(); 
                        }

                        if (elementoPrecoCheio) { 
                            precoCheio = elementoPrecoCheio.innerText.trim();
                        }

                        if (preco || precoCheio) {
                            var produto = {}
                            produto['preco'] = preco;
                            produto['precoCheio'] = precoCheio;
                            return produto;
                        } else {
                            return undefined;
                        }
                    }
                }, quadroSelector);
                
                if (!preco) {
                    quadroSelector = '#corePriceDisplay_desktop_feature_div';
                    preco = await this.page.evaluate(quadroSelector => {
                        const quadro = document.querySelector(quadroSelector);
                        if (quadro) {
                            var preco = undefined;
                            var precoCheio = undefined;

                            var elementoPreco = quadro.querySelector('.priceToPay');
                            if (elementoPreco) {
                                elementoPreco = elementoPreco.querySelector('.a-offscreen');
                            }

                            var elementoPrecoCheio = quadro.querySelector('.basisPrice');
                            if (elementoPrecoCheio) {
                                elementoPrecoCheio = elementoPrecoCheio.querySelector('.a-offscreen');
                            }
                            
                            if (elementoPreco) { 
                                preco = elementoPreco.innerText.trim(); 
                            }

                            if (elementoPrecoCheio) { 
                                precoCheio = elementoPrecoCheio.innerText.trim();
                            }

                            if (preco || precoCheio) {
                                var produto = {}
                                produto['preco'] = preco;
                                produto['precoCheio'] = precoCheio;
                                return produto;
                            } else {
                                return undefined;
                            }
                        }
                    }, quadroSelector);
                }
            }

            if (preco) {
                preco['vendedor'] = vendedor;
                return preco;
            }
        } catch (err) {
            console.log(`Erro ao ler oferta primeday: ${err.message}`);
            return undefined;
        }

        return undefined;
    }

    async getPromocao() {
        var retorno = {};

        try {
            var encontrou = false;

            var promocaoNormal = await this.getPromocaoNormal();
            if (promocaoNormal) {
                retorno['promocaoNormal'] = promocaoNormal;
                encontrou = true;
            }

            var promocaoAplicavel = await this.getPromocaoAplicavel();
            if (promocaoAplicavel) {
                retorno['promocaoAplicavel'] = promocaoAplicavel;
                encontrou = true;
            }

            if (!encontrou) {
                retorno = undefined;
            }

            return retorno;
        } catch (err) {
            console.log(`Erro get promocao: ${err.message}`);
        }

        return undefined;
    }

    async getPromocaoNormal() {
        var retorno = {};

        try {
            var promocao = "";
            var link = "";

            var selector = "";

            selector = '#promoPriceBlockMessage_feature_div';
            promocao = await this.page.evaluate(selector => {
                var promoMessage = document.querySelector(selector);
                if (promoMessage) {
                    var promoContent = promoMessage.querySelector('.a-alert-content');
                    if (promoContent) {
                        return promoContent.textContent.trim();
                    }
                }
            }, selector);

            selector = '#promoPriceBlockMessage_feature_div';
            link = await this.page.evaluate(selector => {
                var link = document.querySelector(selector);
                if (link) {
                    var link = link.querySelector('#emphasisLink');
                    if (link) {
                        return link.href.trim();
                    }
                }
            }, selector);

            if ((promocao !== undefined) || (promocao !== null)) {
                retorno['valor'] = promocao;

                if ((link !== undefined) || (link !== null)) {
                    retorno['link'] = link;
                }
            } else {
                retorno = undefined;
            }

            return retorno;
        } catch (err) {
            console.log(`Erro ao ler promocao normal: ${err.message}`);
        }

        return undefined;
    }

    async getPromocaoAplicavel() {
        var retorno = {}

        try {
            var promocao = "";
            var link = "";

            var selector = "";

            selector = '#applicablePromotionList_feature_div';
            promocao = await this.page.evaluate(selector => {
                var promoMessage = document.querySelector(selector);
                if (promoMessage) {
                    var promoContent = promoMessage.querySelector('.a-alert-content');
                    if (promoContent) {
                        return promoContent.textContent.trim();
                    }
                }
            }, selector);

            selector = '#applicablePromotionList_feature_div';
            link = await this.page.evaluate(selector => {
                var link = document.querySelector(selector);
                if (link) {
                    var link = link.querySelector('.a-link-normal');
                    if (link) {
                        return link.href.trim();
                    }
                }
            }, selector);

            if ((promocao !== undefined) || (promocao !== null)) {
                retorno['valor'] = promocao;

                if ((link !== undefined) || (link !== null)) {
                    retorno['link'] = link;
                }
            } else {
                retorno = undefined;
            }

            return retorno;
        } catch (err) {
            console.log(`Erro ao ler promocao aplicavel: ${err.message}`);
        }

        return undefined;
    }

    async getCupomDesconto() {
        var retorno = {};

        try {
            const cupomListSelector = 'span[id*="promoMessageCXCWpctch"]';
            var cupom = await this.page.evaluate(cupomListSelector => {
                var texto;
                var link;

                var cupomMessage = document.querySelector(cupomListSelector);
                if (cupomMessage) {
                    texto = cupomMessage.innerText.trim();

                    var linkelement = cupomMessage.querySelector('#emphasisLink');
                    if (linkelement) {
                        link = linkelement.href.trim();
                    }

                    var cp = {};
                    cp['texto'] = texto;
                    cp['link'] = link;
                    return cp;
                }
            }, cupomListSelector);

            const labelSelector = 'label[id*="couponBadgepctch"]';
            var label = await this.page.evaluate(labelSelector => {
                var cupomMessage = document.querySelector(labelSelector);
                if (cupomMessage) {
                    return cupomMessage.innerText.trim();
                }
            }, labelSelector);

            if (cupom != "" && cupom != undefined) {
                retorno['texto'] = cupom.texto;
                retorno['link'] = cupom.link;

                if (label != "" && label != undefined) {
                    retorno['texto'] = `${label}${cupom.texto}`;
                }

                return retorno;
            }

        } catch (err) {
            console.log(`Erro ao ler cupom desconto: ${err.message}`);
            return retorno;
        }

        return retorno;
    }

    async getCupomDescontoDestacavel() {
        try {
            const labelSelector = '[id*="couponTextpctch"]';
            const cupom = await this.page.evaluate(labelSelector => {
                var textoDestacavel = document.querySelector(labelSelector);
                if (textoDestacavel) {
                    return textoDestacavel.textContent.trim();
                }
            }, labelSelector);

            if (cupom != "" && cupom != undefined) {
                return cupom;
            }

        } catch (err) {
            console.log(`Erro ao ler cupom desconto destacavel: ${err.message}`);
            return '';
        }

        return '';
    }

    async checkPromo() {
        try {
            var texto = "";
            var label = "";
            var link = "";

            const promoSelector = '[id*="promoMessageCXCWpctch"]';
            texto = await this.page.evaluate(promoSelector => {
                var elementoPromo = document.querySelector(promoSelector);
                if (elementoPromo) {
                    return elementoPromo.innerText.trim();
                }
                return "";
            }, promoSelector);

            const labelSelector = 'label[id*="couponBadgepctch"]';
            label = await this.page.evaluate(labelSelector => {
                var cupomMessage = document.querySelector(labelSelector);
                if (cupomMessage) {
                    return cupomMessage.innerText.trim();
                }
            }, labelSelector);

            link = await this.page.evaluate(labelSelector => {
                var elementoPromo = document.querySelector(labelSelector);
                if (elementoPromo) {
                    elementoPromo = elementoPromo.getElementsByTagName('a');
                    if (elementoPromo) {
                        if (elementoPromo.length > 0) {
                            return elementoPromo.item(0).baseURI.trim();
                        }
                    }
                }
                return "";
            }, labelSelector);

            if (label === undefined) {
                label = "";
            }

            if (texto === undefined) {
                texto = "";
            }

            texto = `${label}  ${texto}`;

            if (link === undefined) {
                link = "";
            }

            return [texto, link];
        } catch (err) {
            console.log(`Erro ao ler promocao: ${err.message}`);
            return ['', ''];
        }
    }

    async getValidadeCupom() {
        try {
            const validadeSelector = '#promotionSchedule';
            const validade = await this.page.evaluate(validadeSelector => {
                var label = document.querySelector(validadeSelector);
                if (label) {
                    return label.textContent.trim();
                }

                return undefined;
            }, validadeSelector);

            return validade;
        } catch (e) {
            console.log(`Erro ao ler validade cupom: ${err.message}`);
        }

        return undefined; 
    }

    async aguardaItensCupomCarregarem(selector, timeout = 25000) {
        var qtd = 1;
        var retorno = 0;
        var carregou = false;
        var startTime = Date.now();

        try {
            do {  
                await this.delay(5000);

                retorno = await this.page.evaluate((selector, qtd) => {
                    var retorno = {};

                    retorno.arg1 = selector;
                    retorno.arg2 = qtd;

                    var el = document.querySelectorAll(selector);
                    if (el) {
                        if (el.length > qtd) {
                            var container = document.querySelector('#showMoreBtnContainer');

                            if (container && !container.classList.contains('hidden')) {
                                var botao = document.querySelector('#showMore');
                                if (botao) {
                                    botao.click();

                                    retorno.codigo = 1;
                                    retorno.qtd = el.length;

                                    return retorno;
                                }
                            }

                            retorno.codigo = 0;
                            retorno.qtd = el.length;

                            return retorno;
                        } else {
                            retorno.codigo = -1;

                            return retorno;
                        }
                    }

                    retorno.codigo = -2;

                    return retorno;
                }, selector, qtd);

                switch (retorno.codigo) {
                    case 1:
                        qtd = retorno.qtd;
                        startTime = Date.now();
                        break;

                    case 0:
                        qtd = retorno.qtd;
                        carregou = true;
                        break;
                }

                if (Date.now() - startTime >= timeout) {
                    console.log('timeout aguardando cupom carregar');
                    return;
                }
            } while (!carregou)
        } catch (e) {
            console.log('erro aguardando cupom carregar: ' + e.message);
        }

        return;
    }

    async buscaItensCupom() {
        var data = [];

        try {
            const quadroSelector = 'li[name="productGrid"]';
            await this.page.waitForSelector(quadroSelector);

            await this.aguardaItensCupomCarregarem(quadroSelector);

            data = await this.page.evaluate(quadroSelector => {
                var ids = [];

                const elements = document.querySelectorAll(quadroSelector)
                elements.forEach(element => {
                    var id = element.getAttribute("data-asin");
                    if (id !== undefined && id !== null && id !== '') {
                        ids.push(id);
                    }
                });
                return ids;                
            }, quadroSelector);
        } catch (e) {
            console.log('Erro buscando links cupom: ' + e.message);
        }

        return data;
    }

    async aguardaCarregarPreVendas() {
        try {
            const selector = 'div[data-asin]:not([data-asin=""])';
            await this.page.waitForSelector(selector);

            return true;
        } catch (e) {
            console.log('erro navegando para ofertas relâmpago: ' + e.message);
        }

        return false;
    }

    async buscaProdutosPreVendas() {
        var produtos;

        try {
            const selector = 'div[data-asin]:not([data-asin=""])';
            await this.page.waitForSelector(selector);
            produtos = await this.page.evaluate(selector => {
                var produtos = [];

                document.querySelectorAll(selector).forEach(element => {
                    var att = element.getAttribute("data-asin");
                    if (att) {
                        produtos.push(att);
                    }
                });
                return produtos;                
            }, selector);
        } catch (e) {
            console.log('Erro buscando produtos pre venda: ' + e.message);
        }

        return produtos;
    }

    async proximaPaginaPreVenda() {
        try {
            const proximaPagina = await Promise.race([
                this.page.waitForSelector('a[class*="s-pagination-next"]'),
                this.page.waitForSelector('span[class*="s-pagination-next"]'),
            ]);
            if (proximaPagina) {
                const tagName = await this.page.evaluate(element => element.tagName, proximaPagina);
                if (tagName.toUpperCase() === 'A') {
                    await proximaPagina.click();
                    await this.delay(20000);
                    await this.aguardaCarregarPreVendas();
                    return true;
                } 
            }
        } catch (e) {
            console.log('erro navegando para próxima página pre venda: ' + e.message);
        }

        return false;
    }
}

module.exports = Browser