const TrueOrder = require('../models/order-true');



module.exports.sendLiveOrders = async (req, res, next) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const changeStream = TrueOrder.watch({ fullDocument: "updateLookup" });
    changeStream.on("change", async (change) => {
        if (
            change.operationType === "insert" &&
            change.fullDocument.status === 'open'
        ) {
            const newOrder = await TrueOrder.findOne({ _id: change.fullDocument._id }).exec();
            res.write(`data: ${JSON.stringify(newOrder)}\n\n`);
        }
    })
    const message = { message: 'No Orders' }
    res.write(`data: ${JSON.stringify(message)}\n\n`);
}



module.exports.getOrder = async (req, res, next) => {
    const orders = await TrueOrder.find({ status: "open" })
    res.json(orders)
}


module.exports.orderDone = async (req, res, next) => {
    const { cmdId } = req.query
    const doc = await TrueOrder.findByIdAndUpdate(cmdId, { status: 'done' })
    res.status(200)
}

module.exports.renderTrueOrders = async (req, res, next) => {
    res.render('order')
}