


module.exports.transactionCreated = async (req, res) => {
    console.log(req.body)

    res.status(200).json({message: 'Request recived'})

}