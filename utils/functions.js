const crypto = require('crypto');
const BlackList = require('../models/office/product/blacList')

function comparePasswords(password, hashedPassword) {
    const [salt, originalHash] = hashedPassword.split("$");
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return hash === originalHash;
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return [salt, hash].join("$");
}

function round(num){
    return Math.round(num * 1000) / 1000
}


async function checkTopping(toppings, res) {
    try{
        const blackList = await BlackList.findOne({name: 'True'})
        if(blackList.list.length){
            const matchBlackList = blackList.list.filter(item => toppings.includes(item))
            if(matchBlackList.length) {
               return res.status(226).json({message: `Ne pare rau! Produsele ${matchBlackList} nu mai sunt pe stoc!`})
            } else {
               return res.status(200).json({message: "All good"})
            }
        } else {
            return res.status(200).json({message: "All good"})
        }
    } catch (err) {
        console.log(err.message)
        res.status(500).json({message: err.message})
    }
}

function formatedDateToShow(date){
    if(date){
      const inputDate = new Date(date);
      const hours = inputDate.getHours();
      const minutes = inputDate.getMinutes();
      const hour = hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
      const monthNames = [
        "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
        "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
      ];
      return `${inputDate.getDate().toString().padStart(2, '0')}-${monthNames[inputDate.getMonth()]}-${inputDate.getFullYear()} ora ${hour} `
    } else {
      return 'xx'
    }
    }


module.exports = {comparePasswords, hashPassword, round, checkTopping, formatedDateToShow}
