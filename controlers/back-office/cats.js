
const Cat = require('../../models/office/product/cat')
const cloudinary = require('cloudinary').v2;

module.exports.sendCats = async (req, res, next) => {
    try {
        const { loc } = req.query;
        const cats = await Cat.find({locatie: loc}).populate({
            path: 'product',
            populate: [
                { path: 'category' },
                {
                    path: 'subProducts',
                    populate: [
                        {path: 'product'},
                        {path: 'ings.ing', select: 'name qty'}
                    ],
                },
                { path: 'paring', populate: { path: 'category', select: 'name' } },
                { path: 'ingredients.ingredient' },
                { path: 'ings.ing', select: 'name qty' }
            ]
        }).maxTimeMS(20000);
        res.status(200).json(cats);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.error.message })
    }
}

module.exports.searchCats = async (req, res, next) => {
    try{
        const {loc, search} = req.query
        const cats = await Cat.find({locatie: loc})
        const sortedCats = cats.sort((a, b) => a.name.localeCompare(b.name))
        let filterCats = []
        console.log(search)
        filterCats = sortedCats.filter((object) =>
        object.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
        res.status(200).json(filterCats)
    } catch(err){
        console.log(err)
        res.statust(200).json({message: err.message})
    }
}


module.exports.addCat = async (req, res, next) => {
    const {loc} = req.query
    try {
        const cat = new Cat(req.body)
        cat.locatie = loc
        if (req.file) {
            const { path, filename } = req.file
            cat.image.filename = filename
            cat.image.path = path
        }
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
    console.log('hit the route')
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
                console.log(category)
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