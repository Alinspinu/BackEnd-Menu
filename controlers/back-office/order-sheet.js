const OrderSheet = require('../../models/office/order-sheet')

const io = require('socket.io-client');
const socket = io('https://flowmanager.ro', {
      path: '/socket.io/',
      transports: ['websocket']
    })



module.exports.addOrder = async (req, res) => {
    const {sheet} = req.body

    try{
        const newSheet = new OrderSheet(sheet)
        const savedSheet = await newSheet.save()
        const populatedSheet = await OrderSheet.findById(savedSheet._id)
                .populate([
                    {path: 'customer.salePoint', select: 'name address'},
                    {path: 'customer.user', select: 'name'},
                    {path: 'suplier.locatie', select: 'name bussinessName'},
                    {path: 'suplier.salePoint', select: 'name address'},
                ]).lean()
        // socket.emit('order-sheet', savedSheet._id.toString())
        res.status(200).js0n({message: 'Fișa de comnadă a fost salvată cu success!', sheet: populatedSheet})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.updateSheet = async (req, res) => {
    const {sheet} = req.body
    try{
        const updatedSheet = await OrderSheet.findByIdAndUpdate(sheet._id, sheet, {new: true})
                    .populate([
                        {path: 'customer.salePoint', select: 'name address'},
                        {path: 'customer.user', select: 'name'},
                        {path: 'suplier.locatie', select: 'name bussinessName'},
                        {path: 'suplier.salePoint', select: 'name address'},
                    ]).lean()
        // socket.emit('order-sheet', updatedSheet._id.toString())
        res.status(200).json({message: 'Fișa a fost actualizată cu succes!', sheet: updatedSheet})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.getSheet = async (req, res) => {
    const {id, loc, point, customer} = req.query
    try{
        if(loc && point){
            const query = customer ? {'customer.locatie': loc, 'customer.salePoint': point} : {'suplier.locatie': loc, 'suplier.salePoint': point}
            const sheets = await OrderSheet.find(query)
                    .populate([
                        {path: 'customer.salePoint', select: 'name address'},
                        {path: 'customer.user', select: 'name'},
                        {path: 'suplier.locatie', select: 'name bussinessName'},
                        {path: 'suplier.salePoint', select: 'name address'},
                    ]).lean()
            return res.status(200).json(sheets)
        } 
        if(id){
          const sheet = await OrderSheet.findById(id)
                    .populate([
                        {path: 'customer.salePoint', select: 'name address'},
                        {path: 'customer.user', select: 'name'},
                        {path: 'suplier.locatie', select: 'name bussinessName'},
                        {path: 'suplier.salePoint', select: 'name address'},
                    ]).lean()

          return res.status(200).json(sheet)
        }
       return res.status(404).json('Nu am găsit ID, Punct de lucru sau Locatie!')
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }

}


module.exports.deleteSheet = async (req, res) => {
    const {id} = req.query

    try{
        await OrderSheet.findOneAndDelete(id)
        res.status(200).json({message: 'Fișa a fost șteasă cu succes!'})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}