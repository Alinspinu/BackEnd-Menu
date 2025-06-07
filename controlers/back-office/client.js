const Client = require('../../models/office/client')



module.exports.addClient = async (req, res) => {
    const {client} = req.body
    try{

        const newClient = new Client(client)
        const savedClient = await newClient.save()
        res.status(200).json({message: 'Clientul a fost salvat cu success!', client: savedClient})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getClients = async (req, res) => {
    const {loc} = req.query
    try{
        const clients = await Client.find({locatie: loc})
        res.status(200).json(clients)
    } catch(error) {
        console.log(error)
        res.status(200).json(error)
    }
}