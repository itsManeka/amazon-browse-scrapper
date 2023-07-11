Consulta o site da amazon utilizando o browser [Puppeteer](https://github.com/puppeteer/puppeteer) para fazer Scrapping de alguns tipos de ofertas de produtos da Amazon.
Serve pra pegar **Oferta Relâmpago**, **Desconto na Tela de Pagamento**, **Cupom Destacável** e **Cupom de Desconto**.

Como usar:

- Rodar o programa como servidor.

Endpoint **/api/data**:
- Mandar a URL do produto tratada pelo `encodeURIComponent` através do parâmetro argumento **url**.

Retorno:

```json
{
  "data": {
    "relampago": {
      "val": 0
    },
    "primeday": {
      "val": 0
    },
    "promocao": {
      "pct": 3, 
      "val": 0 
    },
    "cupom": {
      "pct": 0,
      "val": 0,
      "nome": ""
    },
    "destacavel": {
      "pct": 0,
      "val": 0,
      "nome": ""
    },
    "promocoes": {
      "texto": "",
      "link": ""
    },
  }
}
```

Obs.:

"pct": Porcentagem da promoção (Se houver)

"val: Valor da promoção (Se houver)

"nome": Nome do cupom (Se houver)

"promocoes"->"texto": Resumo da promocao
"promocoes"->"link": link das promocoes

Endpoint **/api/buscarelampago/busca**:
- Inicia uma busca pelas ofertas relâmpago.

Retorno:
```json
{
  "data": 1
}
```

Endpoint **/api/buscarelampago/results**:
- Consulta o resultado da busca das ofertas relâmpago.

Retorno:

```json
{
  "concluida": true,
  "data": [
    {
      "valor": 66.03,
      "codigo": "B00ZY65RUI",
      "departamento": "Beleza"
    }
  ]
}
```