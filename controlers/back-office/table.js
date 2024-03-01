
const Table = require('../../models/utils/table')
const Order = require('../../models/office/product/order')
const User = require('../../models/users/user')

module.exports.sendTables = async (req, res, next) => {
    const {loc} = req.query
    const {user} = req.query
    try{
        const userDb = await User.findById(user)
        let tables
        if(userDb && userDb.employee.access > 1){
            tables = await Table.find({locatie: loc, index: { $ne: 54 }}).populate({
             path: 'bills', 
             model: "Order", 
             match: {status: "open", locatie: loc}, 
             populate: {path: 'masaRest', select: 'index'}
         })
        } 
        if(userDb &&  userDb.employee.access === 1){
            tables = await Table.find({locatie: loc, index: { $ne: 54 }}).populate({
                path: 'bills', 
                model: "Order", 
                match: {status: "open", "employee.user": user}, 
                populate: {path: 'masaRest', select: 'index'}
            })
        }
        const onlineTable = await Table.findOne({locatie: loc, index: 54}).populate({
            path: 'bills', 
            model: "Order", 
            match: {status: 'open', locatie: loc}, 
            populate: {path: 'masaRest', select: 'index'}
        })
        if(onlineTable){
            const sortedTables = [onlineTable, ...tables].sort((a,b) => a.index - b.index)
            res.status(200).json(sortedTables)
        } else {
            const sortedTables = tables.sort((a,b) => a.index - b.index)
            console.log(sortedTables)
            res.status(200).json(sortedTables)
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }
}


module.exports.sendLiveOrders = async (req, res, next) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const changeStream = Order.watch({ fullDocument: "updateLookup" });
    changeStream.on("change", async (change) => {
        if (
            change.operationType === "insert" &&
            change.fullDocument.pending &&
            change.fullDocument.masa === 54 
        ) {           
            console.log('Hit the message')
            const message = { message: 'New Order', doc: change.fullDocument}
            res.write(`data: ${JSON.stringify(message)}\n\n`);
        }
    })
    console.log('hit-no orders')
    const message = { message: 'No Orders' }
    res.write(`data: ${JSON.stringify(message)}\n\n`);
}

module.exports.addTable = async (req, res, next) => {
    const {loc} = req.query
    try{
        const { name } = req.body;
        const table = new Table()
        table.locatie = loc
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