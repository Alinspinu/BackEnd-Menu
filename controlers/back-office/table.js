
const Table = require('../../models/utils/table')

module.exports.sendTables = async (req, res, next) => {
    const {loc} = req.query
    console.log(loc)
    try{
        const tables = await Table.find({locatie: loc}).populate({
            path: 'bills', 
            model: "Order", 
            match: {status: 'open'}, 
            populate: {path: 'masaRest', select: 'index'}})
        res.status(200).json(tables)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }
}



module.exports.addTable = async (req, res, next) => {
    const {loc} = req.query
    console.log(loc)
    try{
        const { name } = req.body;
        const table = new Table()
        table.locatie = loc
        if(name){
            table.name = name
        }
        const newTable =  await table.save()
        console.log(newTable)
        res.status(200).json({message: 'Masa a fost creată!', table: newTable})
    } catch(error) {
        console.log(error)
        res.status(500).json({message: error})
    }
}

module.exports.editTable = async (req, res, next) => {
    try{
        const {name, tableId} = req.body;
        if(name && tableId){
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