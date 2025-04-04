
const Product = require('../../models/office/product/product')
const Cat = require('../../models/office/product/cat')
const SubProduct = require('../../models/office/product/sub-product')

module.exports.saveSubProd = async (req, res, next) => {
    const {loc} = req.query
    try {
        const {product, name, price, order, qty, ings, toppings, tva, description, printOut, nutrition, allergens, additives} = req.body;
        const productSub = await Product.findById(product);
        const newSubProduct = new SubProduct({
            name: name,
            price: price,
            product: product,
            order: parseFloat(order),
            qty: qty,
            ings: ings,
            locatie: loc,
            tva: tva,
            toppings: toppings,
            description: description,
            printOut: printOut,
            nutrition: nutrition,
            allergens: allergens,
            additives: additives,
        });
        productSub.subProducts.push(newSubProduct);
        await newSubProduct.save();
        await productSub.save();
        const subToSend = await SubProduct.findById(newSubProduct._id).populate({ path: 'product', select: 'category' });
        res.status(200).json({ message: `${name}, was saved in ${productSub.name}`, subProduct: subToSend })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.error.message });
    };
};

module.exports.editSubproduct = async (req, res, next) => {
    const { sub } = req.body;
    try{
        const productToSend = await SubProduct.findByIdAndUpdate(sub._id, sub, {new: true}).populate({ path: 'product', select: 'category' })
        res.status(200).json({ message: 'Sub Produsl a fost modificat cu succes', subProd: productToSend })
    } catch(error) {
        res.status(500).json(error)
    }

}


module.exports.delSubProduct = async (req, res, next) => {
    try {
        const { id } = req.query
        const sub = await SubProduct.findOne({ _id: id })
        await sub.deleteOne()
        res.status(200).json({ message: 'Produsl a fost șters cu succes!' })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: `Somethig went wrong! ${err.error.message}` })
    }

}