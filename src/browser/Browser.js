const puppeteer = require('puppeteer');

class Browser {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        this.browser = await puppeteer.launch();
        this.page = await this.browser.newPage();
    }

    async navigate(url) {
        await this.page.goto(url);
    }

    async getOfertaRelampago() {
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
                return ofertaRelampago;
            }
        } catch (err) {
            console.log(`Erro ao ler cupom relampago: ${err.message}`);
            return '';
        }

        return '';
    }

    async getPromocao() {
        try {
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
            const cupomListSelector = '#applicable_promotion_list_sec';
            const cupom = await this.page.evaluate(cupomListSelector => {
                var cupomMessage = document.querySelector(cupomListSelector);
                if (cupomMessage) {
                    var cupomContent = cupomMessage.querySelector('.apl_message');
                    if (cupomContent) {
                        return cupomContent.textContent.trim();
                    }
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
}

module.exports = Browser