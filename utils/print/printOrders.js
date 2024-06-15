
const axios = require('axios')
const ejs = require('ejs');
const fs = require('fs');

const { EscPos } = require("@tillpos/xml-escpos-helper")

const { connectToPrinter } = require("../connectToPrinter")
const{ log } = require('../functions')

const io = require('socket.io-client')
const socket = io("https://live669-0bac3349fa62.herokuapp.com")
// const socket = io("http://localhost:8090")

const templatePath = './utils/print/input.ejs';
const outputPath = './utils/print/output.xml';



async function print(order) {
    let foodProd = []
    let mainProd = []
    let baristaProd = []
    let outProducts = []

    const date = new Date(Date.now());
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeString = hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
    const dataToPrint = {
        inOrOut: order.inOrOut,
        employee: order.employee,
        masa: order.masa,
        time: timeString,
        products: []
    }
    if(order.out){
        order.products.forEach(el => {
            if(el.sentToPrint){
                if(el.printer === 'kitchen'){
                    foodProd.push(el)
                } else if( el.printer === 'barista' && !el.printOut){
                    baristaProd.push(el)
                } else if(el.printer === 'main'){
                    mainProd.push(el) 
                } else if(el.printOut) {
                    outProducts.push(el)
                    dataToPrint.products.push(el)
                }
            }
        })
    } else {
        order.products.forEach(el => {
            if(el.sentToPrint){
                if(el.printer === 'kitchen'){
                    foodProd.push(el)
                } else if( el.printer === 'barista'){
                    baristaProd.push(el)
                } else if(el.printer === 'main'){
                    mainProd.push(el) 
                }
            }
        })
    }

    socket.emit('outsideOrder', JSON.stringify({outProducts, dataToPrint}))
    printKitchen(foodProd, dataToPrint);
    printBarista(baristaProd, dataToPrint);
    setTimeout(()=>{
        printMain(mainProd, dataToPrint);
    }, 500)
}




async function printKitchen(products, dataPrint) {
    if(products.length){
        let productsToPrint = []
        for(let pro of products){
            const productToPrint = {
                name: pro.name,
                qty: pro.quantity,
                toppings: pro.toppings,
                comment: pro.comment
            }
            productsToPrint.push(productToPrint)
        }
        const dataToPrint = {
            time: dataPrint.time,
            name: dataPrint.employee.fullName,
            inOrOut: dataPrint.inOrOut,
            position: dataPrint.employee.position,
            masa: dataPrint.masa,
            products: productsToPrint
        }

        log(JSON.stringify(dataToPrint), 'buc-orders')
        // createXml(dataToPrint)
       
    } else {
        return
    }
}


async function printBarista(products, dataPrint) {   
    const url = 'http://192.168.1.90:65400/api/Receipt';
    if(products.length){

        let data = [
            `TL^           ORA: ${dataPrint.time}   `,
            "TL^ ", 
            `TL^ NUME:${dataPrint.employee.fullName.split(' ')[0]} MASA: *${dataPrint.masa}*`,
            "TL^ ", 
            `TL^        -=- ${dataPrint.inOrOut} -=-`, 
            "TL^ ",  
        ];
        for(let pro of products){
            let entry = `TL^  ${pro.quantity} X ${pro.name}`
            data.push(entry)
            if(pro.toppings && pro.toppings.length){
                for(let top of pro.toppings){
                    let topp =`TL^          +++ ${top.name.split('/')[0]}`
                    data.push(topp)
                }
            }
            if(pro.comment && pro.comment.length){
                let comment = `TL^       -- ${pro.comment}`
                data.push(comment)
            }
        }

        if(dataPrint.products && dataPrint.products.length){
            data.push(`TL^  `)
            data.push(`TL^     -=-  SFARSITUL COMENZII  -=-    `)
            data.push(`TL^   ************************************   `)
            data.push(`TL^  -=- PRODUSE DE RIDICAT DE PE TERASA  -=- `)
            data.push(`TL^  `)
            for(let pro of dataPrint.products){
                let entry = `TL^  ${pro.quantity} X ${pro.name}`
                data.push(entry)
                if(pro.toppings && pro.toppings.length){
                    for(let top of pro.toppings){
                        let topp =`TL^          +++ ${top.name.split('/')[0]}`
                        data.push(topp)
                    }
                }
                if(pro.comment && pro.comment.length){
                    let comment = `TL^       -- ${pro.comment}`
                    data.push(comment)
                }
            }
            data.push(`TL^   ************************************   `)

        }
        console.log(data)
        log(data, 'barista-orders')
        // axios.post(url, data, {
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

async function printUnregisterBills(products){
    const url = 'http://192.168.1.90:65400/api/Receipt';
    let total = 0
    let data = [
        `TL^           NOTA DE PLATA  `,
        "TL^ ", 
        "TL^", 
    ];
    if(products.length){
        for(let pro of products){
            let entry = `TL^  ${pro.name}   ${pro.quantity} BUC X ${pro.price} = ${pro.quantity * pro.price}`
            total += (pro.price*pro.quantity)
            data.push(entry)
            if(pro.toppings && pro.toppings.length){
                for(let top of pro.toppings){
                    let topp =`TL^     + ${top.name.split('/')[0]}`
                    data.push(topp)
                }
            }
        }
        data.push('TL^---------------------------------------')
        const totalRow = `TL^ TOTAL LEI                ${total}`
        data.push(totalRow)


            axios.post(url, data, {
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

async function printMain(products, dataPrint){
    printBarista(products, dataPrint)
}


function createXml(data) {
    fs.readFile(templatePath, 'utf-8', (err, templateContent) => {
        if (err) {
          console.error('Error reading EJS template:', err);
          return;
        }
        const renderedXml = ejs.render(templateContent, data);
        console.log(renderedXml)
        fs.writeFile(outputPath, renderedXml, (writeErr) => {
          if (writeErr) {
            log(`Error writing XML file: ${writeErr}`, 'errors')
            console.error('Error writing XML file:', writeErr);
          } else {
            testPrint()
            console.log('XML file created successfully.');
          }
        });
      });
     
}

const testPrint = async () => {
    const template = fs.readFileSync(outputPath, {encoding: "utf8"})
    const PRINTER = {
        device_name: "GTP-180",
        host: "192.168.1.87",
        port: 9100,
}
    const message = EscPos.getBufferFromTemplate(template);

try{
    await connectToPrinter(PRINTER.host, PRINTER.port, message)
} catch (err){
    log(`prin-buc-error ${err.message}`, 'printErrors')
    console.log("some error", err)
}
}


module.exports = {print, printUnregisterBills}