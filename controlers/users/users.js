const User = require('../../models/users/user')
const Locatie = require('../../models/office/locatie')
const QRCode = require('qrcode');
const SalePoint = require('../../models/utils/sale-point')
const AnafToken = require('../../models/utils/anaf-token')
const PrintServer = require('../../models/utils/print-server')
const jwt = require('jsonwebtoken');
const qs = require('qs');
const axios = require('axios')


const { sendCompleteRegistrationEmail } = require('../../utils/mail')

const {hashPassword, encryptData} = require('../../utils/functions')

// const loc = '655e2e7c5a3d53943c6b7c53'

module.exports.sendUsers = async (req, res, next) => {
    try{
        const {loc} = req.query
        let filterTo = {}
        filterTo.locatie = loc
        const user = await User.find(filterTo).select('-password');
        const sortedUsers = user.sort((a, b) => a.name.localeCompare(b.name));
        res.status(200).json(sortedUsers);
      } catch(error) {
        console.log(error);
        res.status(500).json({message: error});
      }
}

module.exports.detectPaymentError = async (req, res, next) => {
    const users = await User.find({ 'employee.fullName': {$exists: true}}).select('employee')
    users.forEach(user => {
        user.employee.payments.forEach(pay => {
            if(!pay.workMonth){
                pay.workMonth = 5
            }
        })
    })
    res.status(200).json({message: "afara este soare si bine"})
}

module.exports.sendUserCashback = async (req, res, next) => {
    try{
        const {id} = req.query
        const user = await User.findById(id).select('cashBack')
        if(user){
            res.status(200).json({message: 'User found', cashBack: user.cashBack})
        } else{
            res.status(404).json({message: 'User not found', cashBack: 0})
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.sendUser = async (req, res, next) => {
    try{
        const {userId} = req.body
        const user = await User.findById(userId)
            .select('-password')
            .populate({
                path: 'orders', 
                select: [
                    'createdAt',
                    'tips', 
                    'total',
                    'discount', 
                    'cashBack', 
                    'index',
                    'employee',
                    'clientInfo',
                    'payment',
                    'productCount',
                    'products.name', 
                    'products.quantity',
                    'paymentMethod', 
                    'products.price', 
                    'products.imgUrl',
                    'products.toppings.name', 
                    'products.toppings.price'
                ]
            })
        res.status(200).json(user)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }
}



module.exports.editUser = async (req, res, next) => {
    const {update} = req.body;
    const {id} = req.query;
    try{
        const user = await User.findByIdAndUpdate(id, update, {new: true})
        res.status(200).json({message: 'Utilizatorul a fost actualizat!', user: user})
    } catch (err) {
        console.log(err)
        res.status(200).json({message: err.message})
    }
}

module.exports.updateUser = async (req, res, next) => {
    const formData = req.body
    const {id} = req.query
    const file = req.file
    let update = {
        email: formData.email,
        name: formData.username,
        hobbies: formData.hobbies,
        descrioption: formData.description,
        profilePic: file && file.path ? file.path : ''
    }
    try{
        const user = await User.findByIdAndUpdate(id, update, {new: true})
        res.status(200).json({message: 'Utilizatorul a fost actualizat!'})
    } catch (err) {
        console.log(err)
        res.status(200).json({message: err.message})
    }
}

module.exports.deleteUser = async (req, res, next) => {
    try{
        const {id} = req.query;
        const user = await User.findByIdAndDelete(id);
        res.status(200).json({message: `Utilizatorul ${user.name} a fost șters cu succes!`})   
    }catch(err){
        console.log(err)
        res.status(500).json(err.message)
    }
}


module.exports.sendCustomer = async (req, res, next) => {
  try{
      const {id, loc, mode} = req.query;
      if(mode === 'card'){
        if(id.length < 22){
            const customer = await User.findOne({cardIndex:  id, locatie: loc}).select('name email cashBack discount cardIndex telephone');
            if(customer){
                res.status(200).json({message: 'All good', customer: customer})
            } else {
                res.status(404).json({message: 'Clientul nu a fost găsit în baza de date'})
            }
        } else {
            const customer = await User.findById(id).select('name email cashBack discount cardIndex telephone');
            if(customer){
                res.status(200).json({message: 'All good', customer: customer})
            } else {
                res.status(404).json({message: 'Clientul nu a fost găsit în baza de date'})
            }
        }
      } 
      if(mode === 'email') {
          const customer = await User.findOne({email: id}).select('name email cashBack  discount cardIndex telephone');
          if(customer){
              res.status(200).json({message: 'All good', customer})
          } else {
              res.status(404).json({message: 'Clientul nu a fost găsit în baza de date'})
          }
      }
  } catch (err){
      console.log(err)
      res.status(500).json({message: 'Ceva nu a mers bine Eroare la cautare 500'})
  }
}


module.exports.generateUserQrCode = async (req, res, next) => {
    try{
        const {id} = req.query
        const qrCode = await QRCode.toDataURL(id);
        res.send(qrCode);
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.sendLocatie = async (req, res, next) => {
    try{
        const {id} = req.query
        const locatie = await Locatie.findById(id).select('-gmail.app')
        res.status(200).json(locatie)
    } catch (err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.addAnafToken = async (req, res) => {
    const {loc, id} = req.body
    try{
       const token = await AnafToken.findById(id)
       if(!token){
        return res.status(404).json({message: 'Lipsa token'})
       }

       const locatie =  await Locatie.findByIdAndUpdate(loc, {anafToken: id}, {new: true})
       if(!locatie){
        return res.status(404).json({message: 'Lipsa locatie'})
       }
       const vDays = getJwtValidityInDays(token.refresh);
       res.status(200).json({message: 'saved', time: vDays})
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getRefreshTokenValability = async (req, res) => {
    const {id} = req.query
    try{
        const loc = await Locatie.findById(id).populate({path: 'anafToken', select: 'token'})
        if(!loc){
         return res.status(404).json({message: 'Lipsa locatie'})
        }
        if(!loc.anafToken){
            return res.status(200).json({message: 'no_token'})
        }
        const vDays = getJwtValidityInDays(loc.anafToken.token);
        res.status(200).json({time: vDays})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.refreshToken = async (req, res) => {
    const {id} = req.body
    try{
        const loc = await Locatie.findById(id).populate({path: 'anafToken', select: 'refresh'})
        if(!loc){
            return res.status(404).json({message: 'Lipsa locatie'})
        }
        const url = 'https://logincert.anaf.ro/anaf-oauth2/v1/token'      
        const auth = Buffer.from(`${process.env.ANAF_CLIENT_ID}:${process.env.ANAF_CLIENT_SECRET}`).toString('base64');
        const data = qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: loc.anafToken.refresh,
          });
          const response = await axios.post(
            url,
            data,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`,
              },
            }
          );

          if(response.data.access_token && response.data.refresh_token) {
              const token = await AnafToken.findByIdAndUpdate(loc.anafToken._id, {token: response.data.access_token, refresh: response.data.refresh_token}, {new: true})
              console.log(token)
              res.status(200).json({time: getJwtValidityInDays(token.token)})
          } else {
            res.status(500).json({message: 'Something went wromng at the token refresh'})
          }
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

function getJwtValidityInDays(token) {
    const decoded = jwt.decode(token); 
    if (!decoded || !decoded.iat || !decoded.exp) {
      throw new Error('Invalid or incomplete token');
    }
  
    const seconds = decoded.exp - Math.floor(Date.now() / 1000);
    const days = Math.floor(seconds / (60 * 60 * 24));
    return days;
  }

module.exports.editLocatieData = async (req, res) => {
    const {loc} = req.body
    try{
        const dbLoc = await Locatie.findById(loc._id)
        loc.gmail.app = dbLoc.gmail.app
        const locToEdit = await Locatie.findByIdAndUpdate(loc._id, loc, {new: true})
        res.status(200).json({message: 'Datele au fost actualizate', locatie: locToEdit})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.editLocatie = async (req, res, next) => {
    try{
        const {email, appKey, locId} = req.body;
        if(email.length && appKey.length){
            const { iv, secret, encryptedData } = encryptData(appKey)
            const gmail = {email: email, app: {iv: iv, key: encryptedData, secret: secret} }
            const locToEdit = await Locatie.findByIdAndUpdate(locId, {gmail: gmail}, {new: true})
            res.status(200).json({message: 'Datele au fost actualizate'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.updateVivaData = async (req, res, next) => {
    try{
        const {ip, port, locId} = req.body;
        if(ip.length && port.length && locId.length){
              const pos = {
                    vivaWalletLocal: {
                        ip: ip,
                        port: port,
                    }
                }
            const locToEdit = await Locatie.findByIdAndUpdate(locId, {pos: pos}, {new: true})
            res.status(200).json({message: 'Datele au fost actualizate'})
        } else {
            throw new Error('Date incomplete')
        }
    } catch(err) {
        console.log(err)
        res.status(500).json(err)
    }
}

module.exports.deletePaymentEntry = async (req, res) => {
    try{
        const {payID, userID} = req.query
        const user = await User.findByIdAndUpdate(userID, { $pull: { 'employee.payments': {_id: payID} }}, {new: true})
        res.status(200).json({message: 'Logul a fost stres cu success!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.newCustomer = async (req, res, next) => {
  try{
      const {name, email, tel, cardIndex, loc, discount} = req.body;
      const check = await User.findOne({ email: email, locatie: loc }).select('name telephone email cashBack discount');
      if (check && (cardIndex === 0 || cardIndex === '0')) {
        return res.status(256).json({ message: 'Acest email există deja în baza de date!', customer: check });
      } else if(check && (cardIndex !== 0 || cardIndex !== '0')){
        const updatedUser =  await User.findByIdAndUpdate(check._id, {cardIndex: cardIndex}, {new: true})
        return res.status(200).json({ message: 'Utilizatorului i s-a adaugat cadrul la cont', customer: updatedUser });
      } else {
          const user = new User({
              name: name,
              email: email,
              telephone: tel,
              locatie: loc,
              cardIndex:  cardIndex,
              discount: discount ? discount : {general: 10}
          });
          const savedUser = await user.save();
          const customer = await User.findById(savedUser._id).select('name telephone email cashBack discount');
          await sendCompleteRegistrationEmail(customer, 'https://true-meniu.web.app/', 'True Fine Coffee');
          res.status(200).json({message: 'All good', customer});
      }
  }catch(err){
      console.log(err);
      res.status(500).json(err);
  }
}


module.exports.updateWorkLog = async (req, res, next) => {
    try{
        const {userId, workLog} = req.body
        const user = await User.findById(userId)
        if(user){
            const dayIndex = user.employee.workLog.findIndex(obj => {
                const objDay = new Date(obj.day);
                const inputDay = new Date(workLog.day);
                objDay.setHours(0, 0, 0, 0);
                inputDay.setHours(0, 0, 0, 0);
                return objDay.getTime() === inputDay.getTime();
            }) 
                if(dayIndex !== -1){
                    user.employee.workLog[dayIndex] = workLog
                    const newUser = await user.save()
                    res.status(200).json(newUser)
                } else {
                    user.employee.workLog.push(workLog)
                    const newUser = await user.save()
                    res.status(200).json(newUser)
                }
        }
    } catch(err){
        console.log(err)
        res.status(500).json(err.message)
    }
}

module.exports.deleteWorkEntry = async (req, res, next) => {
    try{
        const {userId, day} = req.body
        const date = new Date(day)
        const newUser = await User.findOneAndUpdate(
            {_id: userId}, 
            {$pull: {'employee.workLog': {day: date}}}, 
            {new: true})
        res.status(200).json(newUser)
    }catch(err){
        console.log(err)
        res.status(500).json({message: err.messsage})
    }
}


module.exports.addSalePoint = async (req, res) => {
    try{
        const {salePoint} = req.body
        const newPoint = new SalePoint(salePoint)
        const savedPoint = await newPoint.save()
        res.status(200).json(savedPoint)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.deleteSalePoint = async (req, res) => {
    try{
        const {id} = req.query
        await SalePoint.findByIdAndDelete(id)
        res.status(200).json({message: 'Punctul de lucru a fost sters cu success!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getSalePoints = async (req, res) => {
    try{
        const {loc} = req.query
        const points = await SalePoint.find({locatie: loc})
        res.status(200).json(points)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.editSalePoint = async (req, res) => {
    try{
        const {point} = req.body
        const updatedPoint = await SalePoint.findByIdAndUpdate(point._id, point, {new: true})
        res.status(200).json({point: updatedPoint, message: 'Punctul de lucru a fost modificat cu success!'})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}



module.exports.savePrintServer = async (req, res) => {
    const {server} = req.body
    try{
        const newServer = new PrintServer(server)
        const savedServer = await newServer.save()
        res.status(200).json({message: 'Serverul a fost salvat cu success!', server: savedServer})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.getServers = async (req, res) => {
    const {loc, point} = req.query
    try{    
        const printServers = await PrintServer.find({locatie: loc, salePoint: point})
                                .populate({path: 'fiscalPrinter.section'})
                                .populate({path: 'thermalPrinters.section'})
        res.status(200).json({servers: printServers})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.editPrintServer = async (req, res) => {
    const {server} = req.body
    try{
        const updatedServer = await PrintServer.findByIdAndUpdate(server._id, server, {new: true})
        const updated = await PrintServer.findById(updatedServer._id)
                .populate({path: 'fiscalPrinter.section'})
                .populate({path: 'thermalPrinters.section'})
               
        res.status(200).json({message: 'Serverul de print a fost actualizat cu success', server: updated})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.deletePrintServer = async (req, res) => {
    const {id} = req.query
    try{
        await PrintServer.findByIdAndDelete(id)
        res.status(200).json({message: 'Serverul a fost șters cu success!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}