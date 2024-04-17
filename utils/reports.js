
const {round} = require('./functions')


async function getBillProducts(orders, filter) {
    let products = [];
    let modifiedProducts = []
    let productsToSend = {
        buc: {
            products: [],
            ings: []
        },
        pat: {
            products: [],
            ings: []
        },
        shop: {
            products: [],
            ings: []
        },
        coffee: {
            products: [],
            ings: []
        },
        tea: {
            products: [],
            ings: []
        },
        bar: {
            products: [],
            ings: []
        },
        default:{
            products: [],
            ings: []
        },
    }

    for (const bill of orders) {
        if(!bill.dont && filter.inreg){
            if(filter.prod){
                await processBill(bill, 'productie');
            }
            if(filter.goods){
                await processBill(bill, 'marfa');
            }
        }
        if (filter.unreg && bill.dont) {
            if(filter.prod){
                await processBill(bill, 'productie');
            }
            if(filter.goods){
                await processBill(bill, 'marfa');
            }
        }
    }
    for(const product of products){   
           product.ingr = await getIngredients([product])
           modifiedProducts.push(product)
    }

    for(const product of modifiedProducts){
        switch(product.section) {
            case 'buc': 
                 productsToSend.buc.products.push(product)
                 break
            case 'vitrina': 
                productsToSend.pat.products.push(product)
                break
            case 'shop':
                productsToSend.shop.products.push(product)
                break
            case 'coffee':
                productsToSend.coffee.products.push(product)
                break
            case 'tea':
                productsToSend.tea.products.push(product)
                break
            case 'bar':
                productsToSend.bar.products.push(product)
                break
            default:
                productsToSend.default.products.push(product)
                break
        }
    }
    
    productsToSend.buc.ings = await getIngredients(productsToSend.buc.products)
    productsToSend.bar.ings = await getIngredients(productsToSend.bar.products)
    productsToSend.pat.ings = await getIngredients(productsToSend.pat.products)
    productsToSend.coffee.ings = await getIngredients(productsToSend.coffee.products)
    productsToSend.shop.ings = await getIngredients(productsToSend.shop.products)
    productsToSend.tea.ings = await getIngredients(productsToSend.tea.products)
    productsToSend.default.ings = await getIngredients(productsToSend.default.products)

    
    let result = {sections: productsToSend, allProd: modifiedProducts}
    return result;
    // return products;


    async function processBill(bill, department) {
        for (const prod of bill.products) {
            const product = prod._doc
            if (product.dep === department) {
                const existingProduct = products.find(p => p.name === product.name && arraysAreEqual(p.toppings, product.toppings));
                if (existingProduct) {
                    existingProduct.quantity += product.quantity;
                    existingProduct.discount += product.discount;
                } else {
                    if (product.toppings.length) {
                        product.toppings.forEach((top) => {
                            if (top && top.name === 'Lapte Vegetal') {
                                const index = product.ings.findIndex((i) => {
                                    if(i.ing){
                                       return i.ing.name === "Lapte"
                                    }
                                    else return -1
                                });
                                if (index !== -1) {
                                    product.ings.splice(index, 1);
                                }
                            }
                        });
                    }
                    const prod = { ...product };
                    products.push(prod);
                }

                }
            }
        }
    }

async function getIngredients(products){
    if(products){
        let ingredients = []
        for (const product of products){
            for (const ing of product.toppings){
                await pushIngredients(ing, product.quantity)
            }
            for(const ing of product.ings){
                await pushIngredients(ing, product.quantity)
            }
        }
        return ingredients


    async function pushIngredients(inx, prodQty){
        const ing = inx._doc
        if(ing.ing){
            if(ing.ing.productIngredient){
                for (let ingx of ing.ing.ings){
                    const ingg = ingx._doc
                    if(ingg.ing){
                        if(ingg.ing.productIngredient){
                            for (let inggx of ingg.ing.ings){
                                const inggg = inggx._doc
                                if(inggg.ing){
                                    const existingIng = ingredients.find(p => p.ing._id === inggg.ing._id)
                                    if(existingIng){
                                      existingIng.qty += (inggg.qty * prodQty * ingg.qty * ing.qty)
                                    } else {
                                      const ig = {...inggg}
                                      ig.qty = round(ig.qty * prodQty * ing.qty * ingg.qty)
                                      ingredients.push(ig)
                                    } 
                                }
                            }
                        } else {
                            const existingIng = ingredients.find(p => p.ing._id === ingg.ing._id)
                            if(existingIng){
                              existingIng.qty += (prodQty * ingg.qty * ing.qty)
                            } else {
                              const ig = {...ingg}
                              ig.qty = round(ig.qty * prodQty * ing.qty )
                              ingredients.push(ig)
                            } 
                        } 
                    } 
        
                }
            } else {
                    const existingIng = ingredients.find(p => p.ing._id === ing.ing._id)
                    if(existingIng){
                      existingIng.qty += (prodQty * ing.qty)
                    } else {
                      const ig = {...ing}
                      ig.qty = round(ig.qty * prodQty)
                      ingredients.push(ig)
                    } 
            }
    
        }
    }
    } else {
        console.log(products)
        return null
    }
}


  function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();
  
    for (let i = 0; i < sortedArr1.length; i++) {
        const obj1 = sortedArr1[i];
        const obj2 = sortedArr2[i];
  
        if (!objectsAreEqual(obj1, obj2)) {
            return false;
        }
    }
    return true;
  }


 function objectsAreEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }


  module.exports = {getIngredients, getBillProducts}