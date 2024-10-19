const User = require('../../models/users/user')
const Locatie = require('../../models/office/locatie')
const QRCode = require('qrcode');


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

    // for(let user of users){
    //     for(let pay of user.employee.payments){
    //         if(!pay.workMonth){
    //             pay.workMonth = 5
    //         }
    //     }
    //     await user.save()
    // }

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
                    'productCount',
                    'products.name', 
                    'products.quantity', 
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
        console.log(user)
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
      const {id, loc } = req.query;
      if(id.length < 22 && id !== "andrei" && id !== 'a' && id !== 'o' && id !== 'ds10' && id !== 'ds15' && id !== 'ds20'){
        const customer = await User.findOne({cardIndex:  +id, locatie: loc}).select('name email telphone cashBack discount cardIndex');
        if(customer){
            res.status(200).json({message: 'All good', customer: customer})
        } else {
            res.status(404).json({message: 'Clientul nu a fost găsit în baza de date'})
        }
      } 
      if( id === "andrei" || id === 'a' || id === 'o' || id === 'ds10' || id === 'ds15' || id === 'ds20'){
        const customer = await User.findOne({cardName:  id, locatie: loc}).select('name email telphone cashBack discount cardIndex');
        if(customer){
            res.status(200).json({message: 'All good', customer})
        } else {
            res.status(404).json({message: 'Clientul nu a fost găsit în baza de date'})
        }
      }
      if(id.length > 22) {
          const customer = await User.findById(id).select('name email telphone cashBack  discount');
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
            console.log(locToEdit)
            res.status(200).json({message: 'Datele au fost actualizate'})
        } else {
            throw new Error('Date incomplete')
        }
    } catch(err) {
        console.log(err)
        res.status(500).json(err)
    }
}

module.exports.newCustomer = async (req, res, next) => {
  try{
      const {name, email, cardIndex, loc} = req.body;
      const check = await User.findOne({ email: email, locatie: loc }).select('name telephone email cashBack discount');
      if (check && cardIndex === 0) {
        return res.status(256).json({ message: 'Acest email există deja în baza de date!', customer: check });
      } else if(check && cardIndex !== 0){
        const updatedUser =  await User.findByIdAndUpdate(check._id, {cardIndex: cardIndex}, {new: true})
        return res.status(200).json({ message: 'Utilizatorului i s-a adaugat cadrul la cont', customer: updatedUser });
      } else {
          const user = new User({
              name: name,
              email: email,
              locatie: loc,
              cardIndex:  cardIndex,
              discount: {general: 10}
          });
          const savedUser = await user.save();
          const customer = await User.findById(savedUser._id).select('name telephone email cashBack');
          await sendCompleteRegistrationEmail(customer);
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