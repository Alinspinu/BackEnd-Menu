
const Cat = require('../../models/office/product/cat');
const salePoint = require('../../models/utils/sale-point');
const cloudinary = require('cloudinary').v2;

const Product = require('../../models/office/product/product')

module.exports.sendCats = async (req, res, next) => {
    try {
        const { loc, point } = req.query;
        const cats = await Cat.find({locatie: loc, salePoint: point}).populate({
            path: 'product', select: '-saleLog',
            populate: [
                { path: 'category' },
                {
                    path: 'subProducts', select: '-saleLog',
                    populate: [
                            {
                            path: 'ings.ing', select: 'name um ings productIngredient qty invGestiune', 
                                populate: {
                                    path: 'ings.ing', select: 'name um qty' 
                                }
                            },
                            {
                                path: 'ings.gestiune', select: 'name'
                            }
                    ]
                },
                { 
                    path: 'ings.ing', select: 'name qty um productIngredient ings',
                        populate: {
                            path: 'ings.ing', select: 'name um qty'
                        } 
                },
                {
                    path: 'ings.gestiune', select: 'name'
                },
                {
                    path: 'toppings.gestiune', select: 'name'
                }
            ]
        })
        .lean({ virtuals: false })
        .maxTimeMS(20000);
        await modifyCats(cats)
        res.status(200).json(cats);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.error?.message })
    }
}


async function modifyCats(cats){
        for(let c of cats){
            if(c.locatie.toString()  === '690c818c21500095430c613f'){
                console.log('HIT ', c.name)
                for(let p of c.product){
                    await Product.findByIdAndUpdate(p._id, {mainCat: 'Dune'})
                }
                await Cat.findByIdAndUpdate(c._id, {mainCat: 'Dune'})
            }
        }
    }

module.exports.searchCats = async (req, res, next) => {
    try{
        const {loc, search} = req.query
        const locs = [loc]
        if(loc === '655e2e7c5a3d53943c6b7c53') {locs.push('6811d97d4a433774f3d02643')}
        if(loc === '6811d97d4a433774f3d02643') {locs.push('655e2e7c5a3d53943c6b7c53')}
        const cats = await Cat.find({locatie: locs}).populate({path: 'salePoint', select: 'name'})
        const sortedCats = cats.sort((a, b) => a.name.localeCompare(b.name))
        let filterCats = []
        filterCats = sortedCats.filter((object) =>
        object.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
        res.status(200).json(filterCats)
    } catch(err){
        console.log(err)
        res.statust(200).json({message: err.message})
    }
}


module.exports.addCat = async (req, res, next) => {
    const {category} = req.body

    try {
        const cat = new Cat(category)
        await cat.save()
        const catToSend = await Cat.findById(cat._id)
        res.status(200).json({ message: `Category ${cat.name} was created!`, cat: catToSend })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.error.message })
    }
}

module.exports.editCategory = async (req, res, next) => {
    const { categoryId, name, mainCat, order } = req.body
    if (categoryId) {
        const category = await Cat.findById(categoryId).populate({
            path: 'product',
            populate: [
                { path: 'category' },
                {
                    path: 'subProducts',
                    populate: {
                        path: 'product',

                    }
                }]
        }).maxTimeMS(20000)
        if (category) {
            category.name = name;
            category.mainCat = mainCat;
            category.order = parseFloat(order)
            if (req.file) {
                const { filename, path } = req.file
                await cloudinary.uploader.destroy(category.image.filename)
                category.image.path = path
                category.image.filename = filename
                await category.save();
                res.status(200).json({ message: `Categoria a fost modificată!`, category: category })
            } else {
                await category.save()
                res.status(200).json({ message: `Categoria a fost modificată!`, category: category })
            }
        } else {
            res.status(404).json({ message: 'Categoria nu a fost găsită în baza de date!' })
        }
    } else {
        res.status(404).json({ message: 'Lipsă ID categoie!!' })
    }
}


module.exports.delCategory = async (req, res, next) => {
    try {
        const { id } = req.query;
        const category = await Cat.findById(id);
        if (!category.product.length) {
            if (!category.image.filename === 'no_image_patrat_pt8iod') {
                await cloudinary.uploader.destroy(category.image.filename)
            }
            await category.deleteOne()
            res.status(200).json({ message: 'Categoria a fost ștearsă cu success!' })
        } else {
            res.status(401).json({ message: 'Categoria nu poate fi ștersă deoarece are produse!' })
        }

    } catch (err) {
        console.log(err);
        res.status(err.status).json({ message: err.error.message })
    }

}