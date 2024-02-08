const axios = require('axios');
const url = 'http://192.168.1.90:65400/api/Receipt';

const {log} = require('../functions')

async function printBill(bill) {   
    let billToPrint = [];
    if(bill){
        if(bill.cif){
            let cifLine = `CF^${bill.cif}`
            billToPrint.push(cifLine)
        }
        bill.products.forEach(el => {
            let tva 
            let qty
            if(el.tva === 19){
                tva = 1
            }
            if(el.tva === 9){
                tva = 2
            }
            if(el.tva === 5){
                tva = 4
            }
            if(el.tva === 0){
                tva = 3
            }
            if(el.quantity === 0){
                qty = 1
                log(`----${JSON.stringify(bill)}`, 'zero-quantity')
            } else {
                qty = el.quantity
            }
            let productPrice = el.price
            if(el.sgrTax) {
                productPrice -= 0.5
            }
            let productLine = `S^${el.name}^${productPrice*100}^${qty*1000}^buc^${tva}^1`
            billToPrint.push(productLine)

            if(el.toppings.length){
                el.toppings.forEach(top => {
                    if(!top.name.startsWith('To Go') && top.name !== 'Taxa SGR'){
                        let topLine = `TL^    +${top.name}`
                        billToPrint.push(topLine)
                    }
                    if(top.name === "Taxa SGR"){
                        let sgrLine = `S^Taxa SGR^50^${qty*1000}^buc^3^2`
                        billToPrint.push(sgrLine)
                    }
                })
            }   
        })
        if(bill.discount > 0){
            billToPrint.push("ST^")
            let discountLine = `DV^${bill.discount * 100}`
            billToPrint.push(discountLine)
        }
        if(bill.cashBack > 0){
            billToPrint.push("ST^")
            let discountLine = `DV^${bill.cashBack * 100}`
            billToPrint.push(discountLine)
        }
        billToPrint.push("ST^")
        if(bill.payment.card){
            let cardLine = `P^2^${bill.payment.card * 100}`
            billToPrint.push(cardLine)
        }
        if(bill.payment.cash) {
            let cashLine = `P^1^${bill.payment.cash * 100}`
            billToPrint.push(cashLine)
        }
        if(bill.payment.viva) {
            let cardLine = `P^7^${bill.payment.viva * 100}`
            billToPrint.push(cardLine)
        }
        if(bill.payment.voucher) {
            let voucherLine = `P^6^${bill.payment.voucher * 100}`
            billToPrint.push(voucherLine)
        }
        
        log(billToPrint, "bils")
        axios.post(url, billToPrint, {
            headers: {
                'Content-Type': 'application/json',
            },
            })
                .then(response => {
                    console.log('Response:', response.data);
                })
                .catch(error => {
                    console.error('Error:', error.message);
                });

    } else {
        return
    }
}


async function posPayment(sum){
    let posLine = [`POS^${sum * 100}`]
       const response = await axios.post(url, posLine, {
            headers: {
                'Content-Type': 'application/json',
            },
            })
            log(`Pos response ${JSON.stringify(response)}`, 'pos')
           return response
}


async function reports(report){
    let reportLine = []
    if(report === 'x'){
        let xLine = `X^`
        reportLine.push(xLine)
    }
    if(report === 'z'){
        let zLine = `Z^`
        reportLine.push(zLine)
    }
    console.log(reportLine)
    let message = report === 'x' ? `Raportul X a fost printat!` : `Raportul Z a fost printat!`
    sendToPrint(reportLine)
    return {message: message}
}


async function inAndOut(mode, sum){
    let inAndOutLine = []
    if(mode === 'in'){
        let inLine = `I^${sum * 100}`;
        inAndOutLine.push(inLine);
    }
    if(mode === 'out') {
        let outLine = `O^${sum * 100}`;
        inAndOutLine.push(outLine)
    }
    let message = mode === 'in' ? `${sum} de lei au fost adăugați în casă!` : `${sum} de lei au fost scoși din casă!`
    sendToPrint(inAndOutLine)
    return {message: message}
}

function sendToPrint(print){
    axios.post(url, print, { 
        headers: {'Content-Type': 'application/json'}
    }).then(response => {
         console.log('Response:', response.data);
    })
      .catch(error => {
        log(`Print-main Error ${error.message}`, "errors")
         console.error('Error:', error.message);
    });

}





module.exports = {printBill, posPayment, reports, inAndOut}