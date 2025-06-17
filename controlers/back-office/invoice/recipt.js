const Recipt = require('../../../models/office/recipt')

module.exports.addRecipt = async (req, res) => {
    const {recipt} = req.body

    try{
        const newRecipt = new Recipt(recipt)
        const savedRecipt = await newRecipt.save()
        res.status(200).json(savedRecipt)
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
        res.status(200).json(editedRecipt)
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}