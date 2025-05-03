
const Table = require('../../models/utils/table')
const Order = require('../../models/office/product/order')
const User = require('../../models/users/user')
const salePoint = require('../../models/utils/sale-point')

module.exports.sendTables = async (req, res, next) => {
    const {loc, point} = req.query
    try{
         const tables = await Table.find({locatie: loc, salePoint: point}).populate({
            path: 'bills', 
            model: "Order", 
            match: {status: "open", locatie: loc, salePoint: point}, 
            populate: {path: 'masaRest', select: 'index'}
        })
        const sortedTables = tables.sort((a,b) => a.index - b.index)
        res.status(200).json(sortedTables)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }
}



module.exports.addTable = async (req, res, next) => {
    const {loc, point} = req.query
    const { name } = req.body;
    try{
        const table = new Table()
        table.locatie = loc
        table.salePoint = point
        if(name){
            table.name = name
        }
        const newTable =  await table.save()
        res.status(200).json({message: 'Masa a fost creată!', table: newTable})
    } catch(error) {
        console.log(error)
        res.status(500).json({message: error})
    }
}

module.exports.editTable = async (req, res, next) => {
    try{
        const {name, tableId} = req.body;
        if(tableId){
            const newTable =  await Table.findOneAndUpdate({_id: tableId}, {name: name}, {new: true})
            res.status(200).json({message: `Masa numarul ${newTable.index} a fost modificată cu success!`, table: newTable})
        }
    }catch(err) {
        console.log(err);
        res.status(500).json({message: err})
    }
}


module.exports.deletTable = async (req, res, next) => {
    try{
        const {tableId} = req.query;
        const table = await Table.findOne({_id: tableId})
        const message = table.name ? table.name : table.index
        await table.deleteOne()
        res.status(200).json({message: `Masa ${message} a fost ștearsă cu succes!`})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err})
    }
}