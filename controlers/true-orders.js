const TrueOrder = require('../models/product/order-true');




module.exports.setOrderTime = async (req, res, next) => {
    
    try {
        const time = parseFloat(req.query.time);
        const orderId = (req.query.orderId);
        const order = await TrueOrder.findOneAndUpdate({ _id: orderId }, { completetime: time, pending: false }, { new: true });
        console.log(` Success! Order ${orderId} - the complete time was set to ${time} and pending to false!`)
        res.status(200).json({ message: 'time set' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.error.message })
    }
}

module.exports.getOrder = async (req, res, next) => {
    const orders = await TrueOrder.find({ status: "open" })
    res.json(orders)
}


module.exports.orderDone = async (req, res, next) => {
    try{
        const { cmdId } = req.query
        const doc = await TrueOrder.findByIdAndUpdate(cmdId, { status: 'done' })
        console.log(` Success! Order ${cmdId} - status change to "done" `)
        res.status(200).json({message: 'All good, order is done'})
    } catch(error) {
        console.log(error)
        res.status(500).json({message: error})
    }
}

module.exports.getOrderDone = async (req, res, next) => {
    try{
        const today = new Date().setUTCHours(0,0,0,0)
        const orders = await TrueOrder.find({status: 'done', createdAt: {$gte: today}})
        res.json(orders)
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }
}


module.exports.endPending = async (req, res, next) => {
    try{
        const {id} = req.query;
        const doc = await TrueOrder.findByIdAndUpdate(id, { pending: false })
        console.log(` Success! Order ${id} - pending - false`)
        res.status(200).json({message: 'pending is done'})
    } catch(err){
        console.log(err)
    }
}