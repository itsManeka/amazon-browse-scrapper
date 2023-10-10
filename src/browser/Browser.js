const puppeteer = require('puppeteer');

class Browser {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async getPage() {
        return this.page;
    }

    async init() {
        console.log(`iniciando`);
        this.browser = await puppeteer.launch();
        this.context = await this.browser.createIncognitoBrowserContext();
        this.page = await this.context.newPage();
    }

    async navigate(url) {
        console.log(`navegando para a página: ${url}`);
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
                    if (label.textContent.trim().includes('Oferta exclusiva Prime')) {
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

    async getPromocao() {
        try {
            console.log('checando promocoes')
            const promoMessageSelector = '#promoPriceBlockMessage_feature_div';
            const promocao = await this.page.evaluate(promoMessageSelector => {
                var promoMessage = document.querySelector(promoMessageSelector);
                if (promoMessage) {
                    var promoContent = promoMessage.querySelector('.a-alert-content');
                    if (promoContent) {
                        return promoContent.textContent.trim();
                    }
                }
            }, promoMessageSelector);

            if (promocao != "" && promocao != undefined) {
                return promocao;
            }
        } catch (err) {
            console.log(`Erro ao ler promocao: ${err.message}`);
            return '';
        }

        return '';
    }

    async getCupomDesconto() {
        try {
            const cupomListSelector = 'span[id*="promoMessageCXCWpctch"]';
            const cupom = await this.page.evaluate(cupomListSelector => {
                var cupomMessage = document.querySelector(cupomListSelector);
                if (cupomMessage) {
                    return cupomMessage.textContent.trim();
                }
            }, cupomListSelector);

            if (cupom != "" && cupom != undefined) {
                return cupom;
            }

        } catch (err) {
            console.log(`Erro ao ler cupom desconto: ${err.message}`);
            return '';
        }

        return '';
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
            var link = "";
            console.log('check promo: antes de pegar o texto')
            const labelSelector = '[id*="promoMessageCXCWpctch"]';
            texto = await this.page.evaluate(labelSelector => {
                var elementoPromo = document.querySelector(labelSelector);
                if (elementoPromo) {
                    return elementoPromo.innerText.trim();
                }
                return "";
            }, labelSelector);

            console.log('check promo: antes de pegar o link')
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

            console.log('texto: ' +texto)
            console.log('link: ' +link)
            if (texto == undefined) {
                texto = "";
            }

            if (link == undefined) {
                link = "";
            }

            return [texto, link];
        } catch (err) {
            console.log(`Erro ao ler promocao: ${err.message}`);
            return ['', ''];
        }
    }
}

module.exports = Browser