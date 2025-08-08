
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