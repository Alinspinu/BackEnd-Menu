const Product = require('../../models/office/product/product')
const BlackList = require('../../models/office/product/blacList')

module.exports.sendBlackList = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    const blackList = await BlackList.findOne({locatie: loc});
    if(blackList){
        res.status(200).json(blackList.list)
    } else {
        console.log('Something went wrong!')
        res.status(404).json({message: 'Black list not found'})
    }
}


module.exports.addTopping = async (req, res, next) => {
    try{
        const {id} = req.query;
        const newProduct = await Product.findOneAndUpdate({_id: id}, {$push: {toppings: req.body}}, {new: true, useFindAndModify: false}).populate({path: 'category', select: 'name'})
        res.status(200).json(newProduct)
    } catch (err){
        console.log("Error", err)
        res.status(500).json({message: err})
    }
    
}

module.exports.addToBlackList = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try{
        if(req.body.length){
            const blackList = await BlackList.findOneAndUpdate(
                {locatie: loc}, 
                {$set: {list: req.body}},  
                { new: true, useFindAndModify: false })
                res.status(200).json({message: "Black list updated", list: blackList.list})
        } else {
            const blackList = await BlackList.findOneAndUpdate(
                {locatie: loc}, 
                {$set: {list: []}},  
                { new: true, useFindAndModify: false })
                res.status(200).json({message: "Black list cleared", list: blackList.list})
        }
    }catch (err) {
        console.log('Error', err);
        res.status(500).json({message: err})
    }   
}