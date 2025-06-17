const Recipt = require('../../../models/office/recipt')

module.exports.addRecipt = async (req, res) => {
    const {recipt} = req.body

    try{
        const newRecipt = new Recipt(recipt)
        const savedRecipt = await newRecipt.save()
        res.status(200).json({recipt: savedRecipt, message: 'Chitanța a fost savată cu success!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }

}


module.exports.getRecipts = async (req, res) => {
    const {loc} = req.query
    try{
        const recipts = await Recipt.find({locatie: loc})
        res.status(200).json(recipts)
    } catch( error ) {
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.editReipt = async (req, res) => {
    const {recipt} = req.body
    try{
        const editedRecipt = await Recipt.findByIdAndUpdate(recipt._id, recipt, {new: true})
        res.status(200).json({recipt: editedRecipt, message: 'Chitanța a fost actualizată'})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.deleteRecipt = async (req, res) => {
    const {id} = req.query
    try{
        await Recipt.findByIdAndDelete(id)
        res.status(200).json({message: 'Chitanța a fost șteasă cu succes!'})

    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}