
const axios = require('axios')


module.exports.getComapnyData = async (req, res) => {
    const {cui} = req.query

    try{
        const response = await axios.get(`${process.env.SUPLIER_APY_URL}?key=${process.env.SUPLIER_APY_KEY}&cui=${cui}`)
        console.log(response.data)
        res.status(200).json(response.data)
    } catch(err) {
        console.log(err)
        res.status(500).json(err)
    }
}


module.exports.getClientAddress = async (req, res) => {
    const {city, street} = req.body
    const country = 'Romania'
    const cityU = encodeURIComponent(city)
    const streetU = encodeURIComponent(street);
    try{
        const response = await axios.get(`${process.env.GEOAPY_URL}?country=${country}&city=${cityU}&street=${streetU}&apiKey=${process.env.GEOAPY_KEY}`)
        res.status(200).json(response.data)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }


}