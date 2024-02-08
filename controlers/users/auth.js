
const jwt = require('jsonwebtoken');
const User = require('../../models/users/user');

const { comparePasswords, hashPassword } = require('../../utils/functions')
const { sendCompleteRegistrationEmail, sendInfoAdminEmail,   sendResetEmail, sendVerificationEmail, } = require('../../utils/mail')




module.exports.register = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try{
        const { email, password, tel, confirmPassword, name, firstCart, survey, id } = req.body;
       if(id.length){
        if (password === confirmPassword) {
            const hashedPassword = hashPassword(password);
            const update = {
                password: hashedPassword,
                telephone: tel,
                survey: survey,
                locatie: loc
            }
            const user = await User.findByIdAndUpdate(id, update, {new: true})
            
            res.status(200).json({ message: "Datele au fost actualizate.", user: user});
        } else {
            return res.status(401).json({ message: "Passwords don't match!" });
        };
       } else {
           const check = await User.find({ email: email, locatie: loc });
           if (check.length) {
               return res.status(256).json({ message: 'This email allrady exist' });
           }
           if (password === confirmPassword) {
               const hashedPassword = hashPassword(password);
               const newUser = new User({
                   email: email,
                   password: hashedPassword,
                   name: name,
                   telephone: tel,
                   firstCart: firstCart,
                   survey: survey,
                   locatie: loc
               });
               await newUser.save();
               await sendVerificationEmail(newUser).then(response => {
                   if (response.message === 'Email sent') {
                       res.status(200).json({ message: response.message, id: newUser._id });
                   } else {
                       res.status(256).json({ message: response.message, id: newUser._id });
                   };
               });
           } else {
               return res.status(401).json({ message: "Passwords don't match!" });
           };
       }
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
};


module.exports.registerEmployee = async (req, res, next) => {
    try{
         const {user, second} = req.body
         if(second && user){
            if(second.password === second.confirmPassword){
                const hashedPassword = hashPassword(second.password)
                const newUser = new User(user);
                newUser.password = hashedPassword
                await newUser.save()
                // await sendVerificationEmail(newUser).then(response => {
                //     if (response.message === 'Email sent') {
                //         res.status(200).json({ message: response.message, id: newUser._id });
                //     } else {
                //         res.status(256).json({ message: response.message, id: newUser._id });
                //     };
                // });
                res.status(200).json({message: "Userul a fost Salvat cu success"})
            } else{
                return res.status(401).json({ message: "Passwords don't match!" });
            }
         } else {
            return res.status(401).json({ message: "No USER!!" });
         }
    } catch (err){
        console.log(err)
        res.status(500).json(err.message)
    }
}

// module.exports.newUser = async (req, res, next) => {
//     const user = {
//         name: 'Andrei Stoleru',
//         status: 'active',
//         email: "andrei@stoleru.ro",
//         cardIndex: "andrei",
//         password: "123",
//         locatie: "65ba7dcf1694ff43f52d44ed"
//     }
//     const newUser = await new User(user)
//     newUser.save()
//     res.send(newUser)
// }


module.exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email})
                            .select([
                                '-employee.cnp',
                                '-employee.ciSerial',
                                '-employee.ciNumber',
                                '-employee.address',
                            ]);
    // if(user ){
    //     await sendCompleteRegistrationEmail(user)
    //     return res.status(401).json({message: `Nu ți-ai terminat procesul de înregistrare. Ți-am mai trimis un mail la ${user.email}. Urmează pașii.`})
    // }
    if (!user || !comparePasswords(password, user.password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
    };
    if (user.status === 'inactive') {
        return await sendVerificationEmail(user).then(response => {
            const userData = {
                name: user.name,
                email: user.email,
                id: user.id,
                locatie: user.locatie
            };
            if (response.message === 'Email sent') {
                res.status(200).json({ message: response.message, user: userData })
            } else {
                res.status(256).json({ message: response.message, user: userData })
            };
        });
    } else if (user.status === "active") {
        let time = '15m';
        if (user.admin === 1) {
            time = '12h';
        };
        const token = jwt.sign({ userId: user._id }, process.env.AUTH_SECRET, { expiresIn: time });
        const sendData = {
            token: token,
            name: user.name,
            admin: user.admin,
            cashBack: user.cashBack,
            email: user.email,
            status: user.status,
            telephone: user.telephone,
            employee: user.employee,
            locatie: user.locatie,
            discount: user.discount
        };
        const data = {name: user.name, action: 's-a conectat'}
        await sendInfoAdminEmail(data)
        res.status(200).json(sendData);
    };
};





module.exports.verifyToken = async (req, res, next) => {
    const { token } = req.body;
    try {
        const userId = jwt.decode(token, process.env.AUTH_SECRET);
        if (userId) {
            const user = await User.findById(userId.userId);
            if (user) {
                user.status = 'active';
                await user.save();
                const userData = {
                    token: token,
                    name: user.name,
                    admin: user.admin,
                    cashBack: user.cashBack,
                    email: user.email,
                    status: user.status,
                    cardIndex: user.cardIndex,
                    telephone: user.telephone ? user.telephone : '-',
                    _id: user._id,
                    employee: user.employee,
                    locatie: user.locatie
                };
                const data = {name: user.name, action: 's-a inregistrat'}
                await sendInfoAdminEmail(data)
                res.status(200).json(userData);
            } else {
                res.status(404).json({ message: 'User not found' });
            };
        } else {
            res.status(401).json({ message: 'Invalid token' });
        };
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
}



module.exports.sendEmailResetPassword = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email, locatie: loc });
        if (user) {
            return sendResetEmail(user).then(response => {
                const userData = {
                    name: user.name,
                    email: user.email,
                    id: user.id,
                };
                if (response.message === 'Email sent') {
                    res.status(200).json({ message: response.message, user: userData })
                } else {
                    res.status(256).json({ message: response.message, user: userData })
                };
            });
        } else {
            res.status(404).json({ message: 'Adresa de email nu se află în baza de date!' })
        };
    } catch (err) {
        console.log('Error', err.message);
        res.status(500).json({ message: 'Server message' });
    }

}

module.exports.resetPassword = async (req, res, next) => {
    const { token, password, confirmPassword } = req.body;
    try {
        const userId = jwt.decode(token, process.env.AUTH_SECRET);
        if (userId) {
            const user = await User.findById(userId.userId);
            if (user) {
                if (password === confirmPassword) {
                    const hashedPassword = hashPassword(password);
                    user.password = hashedPassword;
                    await user.save();
                }
                const userData = {
                    token: token,
                    name: user.name,
                    admin: user.admin,
                    cashBack: user.cashBack,
                    email: user.email,
                    status: user.status,
                    employee: user.employee,
                    locatie: user.locatie
                };
                const data = {name: user.name, action: 'și-a resetat parola'}
                await sendInfoAdminEmail(data)
                res.status(200).json(userData);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } else {
            res.status(401).json({ message: 'Invalid token' });
        };
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server Error' });
    };
}













