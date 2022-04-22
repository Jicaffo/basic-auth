/*
    Auth basic flow based on Randall Degges ss-auth and his reccomendations
*/

import 'dotenv/config'; // Loads our .env file variables into the process.env runtime variables of node
import express from "express";
import bcrypt from "bcryptjs";
import sessions from 'client-sessions'; // Encrypted and securer
//import sessions from 'express-sessions'; // Lets you store session in MongoDB

import settings from './settings.js';

const app = express();

const PORT = process.env.PORT || 3000;
const userDummyDB = []; // "mail" in the model should be unique if Mongo was implemented 

app.use(express.json());

app.use((req, res, next)=>{
    console.log("Antes de middleware: ", req.session);
    next()
})
// If doesn't exists, creates a req.session object.
// If req.session is modified in any way, automatically generates a sessionId, hashes it and adds the Set-Cookie htttp header with that value to the response. Defaults to path=/, expires in ?', httpOnly
// If the cookie with the provided name is recieved, it verifies it and stores the session info through req.session obect. 
app.use(sessions({
    cookieName: "session",
    secret: "este es un secreto",
    duration: 30 * 60 * 1000, // 30m
    cookie: {
        //path: '/api', // cookie will only be sent to requests under '/api'
        //maxAge: 60 * 1000, // duration of the cookie in milliseconds, defaults to duration above
        //ephemeral: true, // when true, cookie expires when the browser closes
        //httpOnly: true, // when true, cookie is not accessible from javascript
        //secure: false // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
    }
}))
app.use((req, res, next)=>{
    console.log("Dp de middleware (datos dispibles): ", req.session);
    next()
})

const logSessionData = (req, res, next) => {
    console.log("req.session: ", req.session)
    next()
}

app.route("/register")
    .post( logSessionData, (req, res) => {
        // Replace the user sent plain password with the hashed version of it
        const hashedPassword = bcrypt.hashSync(req.body.password, settings.BCRYPT_SALT)
        req.body.password = hashedPassword;

        // Returns error if user.mail already exist
        const user = userDummyDB.find(user => req.body.mail === user.name)
        if (user) return res.status(400).json("El mail ingresado ya fue registrado")

        // Add user to DB
        const lenght = userDummyDB.push(req.body) // new User(req.body), user.save() if Mongo was implemented

        console.log("userDummyDB: ", userDummyDB);
        res.status(200).json("Usuario creado correctamente")
    })

app.route("/login")
    .post( logSessionData, (req, res) => {
        
        const user = userDummyDB.find(user => req.body.mail === user.mail) // User.findOne({mail: req.body.mail}) if Mongo was implemented
        if (!user) return res.status(400).json("El usuario no se encuentra en la DB");

        const authenticated = bcrypt.compareSync(req.body.password, user.password)
        if (!authenticated) return res.status(400).json("Las contraseñas no coinciden");

        // Get the userId and name from DB and store that info in the session (non sensitive data)
        const userId = lenght-1 // User.findOne({req.body.mail}) if Mongo was implemented
        // TODO: No está funcionando
        req.session.user = {
            userId: user.userId,
            name: user.name,
            mail: user.mail
        }
        // req.session.user = user.userId;
        // req.session.user = user.name;
        // req.session.user = user.mail;

        return res.status(200).json(`Se ha logueado correctamente con el mail: '${user.mail}'`)
    })

app.route("/dashboard")
    .get( logSessionData, (req, res)=> {

        res.status(200).json({
            msj: "Mostrando el tablero del usuario",
            sessUser: req.session.user
        })
    })

// error handling
app.use((err, req, res, next) => {
    res.status(500).send("Something broke :( Please try again.");
  });

app.listen(PORT, () => console.log(`*** Server runnning on port: ${PORT} ***`));