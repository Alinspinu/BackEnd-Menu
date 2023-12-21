


async function print(order) {
    let foodProd = []
    let mainProd = []
    let baristaProd = []
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
    printKitchen(foodProd);
    printBarista(baristaProd);
    printMain(mainProd);
} 

function printKitchen(products) {
    if(products.length){
        for(let pro of products){
            console.log("print from kitchen", pro.name)
        }
    } else {
        return
    }

}

function printBarista(products) {
    if(products.length){
        for(let pro of products){
        console.log("print from barista", pro.name)
        }
    } else {
        return
    }
}

function printMain(products){
    if(products.length){
        for(let pro of products){ 
        console.log("print fom main" ,pro.name)
        }
    } else {
        return
    }
}

module.exports = {print}