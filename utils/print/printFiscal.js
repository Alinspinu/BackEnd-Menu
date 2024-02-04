const axios = require('axios');
const url = 'http://192.168.100.5:65400/api/Receipt';

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
                tva = 5
            }
            if(el.quantity === 0){
                qty = 1
                log(`----${JSON.stringify(bill)}`, 'zero-quantity')
                console.log(bill)
            } else {
                qty = el.quantity
            }
            let productLine = `S^${el.name}^${el.price*100}^${qty*1000}^buc^${tva}^1`
            billToPrint.push(productLine)

            if(el.toppings.length){
                el.toppings.forEach(top => {
                    if(!top.name.startsWith('To Go')){
                        let topLine = `TL^    +${top.name}`
                        billToPrint.push(topLine)
                    }
                })
            }   
        })
        billToPrint.push("TL^~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ")
        
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
        if(bill.payment.online) {
            let onlineLine = `P^3^${bill.payment.online * 100}`
            billToPrint.push(onlineLine)
        }
        billToPrint.push("TL^   MULTUMIM!")
        billToPrint.push("TL^~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ")
        
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
    console.log(posLine)
       const response = await axios.post(url, posLine, {
            headers: {
                'Content-Type': 'application/json',
            },
            })
            console.log(response)
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