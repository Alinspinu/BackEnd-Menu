
const Product = require('../../models/office/product/product')
const Cat = require('../../models/office/product/cat')
const SubProduct = require('../../models/office/product/sub-product')

module.exports.saveSubProd = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try {
        const {product, name, price, order, qty, ings, toppings, tva, description} = req.body;
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
            description: description,
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
    const { id, prodId, name, price, order} = req.body;
    if (id) {
        const oldSub = await SubProduct.findById(id).populate({ path: 'product', select: ['name', 'category'] });
        if (oldSub) {
            oldSub.name = name;
            oldSub.price = price;
            oldSub.order = order;
            if (oldSub.product._id.toString() !== prodId) {
                try {
                    await Product.updateOne({ _id: oldSub.product._id }, { $pull: { subProducts: oldSub._id } })
                    await Product.updateOne({ _id: prodId }, { $push: { subProducts: oldSub._id } })
                    oldSub.product = prodId
                } catch (err) {
                    console.log(err)
                    return res.status(404).json({ message: 'Ceva nu a mers bine' })
                }
            }
            await oldSub.save()
            const productToSend = await SubProduct.findById(id).populate({ path: 'product', select: 'category' })
            res.status(200).json({ message: 'Sub Produsl a fost modificat cu succes', subProd: productToSend })
        } else {
            res.status(404).json({ message: 'Sub Produsul nu a fost găsit in baza de date!' })
        }
    } else {
        res.status(404).json({ message: 'Lipsă ID  sub produs!!' })
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