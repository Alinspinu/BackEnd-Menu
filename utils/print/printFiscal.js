const axios = require('axios');
const url = 'http://192.168.1.90:65400/api/Receipt';



async function printBill(bill) {   
    let billToPrint = [];
    if(bill){
        if(bill.cif){
            let cifLine = `CF^${bill.cif}`
            billToPrint.push(cifLine)
        }
        bill.products.forEach(el => {
            let productLine = `S^${el.name}^${el.price*100}^${el.quantity*1000}^buc^${el.tva}^1`
            billToPrint.push(productLine)
        })
        billToPrint.push("TL^----------------------------------------------")
        billToPrint.push("TL^ ")
        if(bill.discount > 0){
            let discountLine = `DV^${bill.discount * 100}`
            billToPrint.push(discountLine)
        }
        if(bill.cashBack > 0){
            let discountLine = `DV^${bill.cashBack * 100}`
            billToPrint.push(discountLine)
        }
        if(bill.payment.card){
            let cardLine = `P^2^${bill.payment.card * 100}`
            billToPrint.push(cardLine)
        }
        if(bill.payment.cash) {
            let cashLine = `P^1^${bill.payment.cash * 100}`
            billToPrint.push(cashLine)
        }
        if(bill.payment.viva) {
            let cardLine = `P^2^${bill.payment.viva * 100}`
            billToPrint.push(cardLine)
        }
        if(bill.payment.voucher) {
            let voucherLine = `P^6^${bill.payment.voucher * 100}`
            billToPrint.push(voucherLine)
        }
        billToPrint.push("DS^")
        billToPrint.push("TL^----------------------------------------------")
        billToPrint.push("TL^---------MULȚUMIM ȘI VĂ MAI AȘTEPTAM!---------")
        billToPrint.push("TL^----------------------------------------------")

        console.log(billToPrint)


        // axios.post(url, billToPrint, {
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     })
        //         .then(response => {
        //             console.log('Response:', response.data);
        //         })
        //         .catch(error => {
        //             console.error('Error:', error.message);
        //         });

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
            console.log(response)
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
    return {message: message}
    // sendToPrint(reportLine)
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
    console.log(inAndOutLine)
    let message = mode === 'in' ? `${sum} de lei au fost adăugați în casă!` : `${sum} de lei au fost scoși din casă!`
    return {message: message}
    // sendToPrint(inAndOutLine)
}

function sendToPrint(print){
    axios.post(url, print, { 
        headers: {'Content-Type': 'application/json'}
    }).then(response => {
         console.log('Response:', response.data);
    })
      .catch(error => {
         console.error('Error:', error.message);
    });

}





module.exports = {printBill, posPayment, reports, inAndOut}