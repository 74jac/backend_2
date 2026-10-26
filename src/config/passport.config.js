import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwTStrategy } from "passport-jwt";
import { userModel } from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import { env } from "./env.js";


passport.use("register", new LocalStrategy({usernameField: "email", passReqToCallback: true},
    async (req, email, password, done) => {
        try {
            const { first_name, last_name} = req.body

            if (!first_name || !last_name || !email || !password) {
                return done(null, false, { message: "Todos los campos son requeridos" });
            } 

            const normalizedEmail = email.toLowerCase().trim();
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                return done(null, false, { message: "El correo electrónico no tiene un formato válido" });
            }
            const existingUser = await userModel.findOne({ email: normalizedEmail });   
                        if (existingUser) {
                            return done(null, false, { message: "El correo electrónico ya está en uso" });
                        }
                      
            const passwordRegex = /^.{8,}$/;
            if (!passwordRegex.test(password)) {
                return done(null, false, { message: "La contraseña debe tener al menos 8 caracteres" });
            }
            
            const hashedPassword = await hashPassword(password);

            const newUser = await userModel.create({
                first_name,
                last_name,
                email: normalizedEmail,
                password: hashedPassword,
                role: "user"
            })
            return done(null, newUser);

        } catch (error) {
            return done(error);
        }
 }
));

// Estrategia login: autentica un usuario existente
passport.use("login", new LocalStrategy({usernameField: "email"}, 
    async (email, password, done) => {

        try {
          
            const normalizedEmail = email.toLowerCase().trim()

            const user = await userModel.findOne({email: normalizedEmail})

            if(!user) { 
                return done(null, false, {message: "Usuario no encontrado"})
            }

            const validPassword = await comparePassword(password, user.password)

            if(!validPassword) {
                return done(null, false, {message: "Contraseña incorrecta"})
            }
         
            return done(null, user) 
            // Los datos del usuario quedarán disponibles en req.user

        } catch (error) {
            
            return done(error)
        }
        
    }
));



//Estratagia current

const cookieExtractor = (req) => {
    let token = null;
    if (req && req.signedCookies) {
        token = req.signedCookies["cookie_super_secrreta"];
    }
    return token;
};

passport.use("current", new JwTStrategy({
    
    jwtFromRequest: cookieExtractor,
    
    secretOrKey: env.JWT_SECRET
}, 

async (jwtPayload, done) => {
    try {
        const user = await userModel.findById(jwtPayload.id);

        if (!user) {
            return done(null, false, { message: "Usuario no encontrado" });
        }
        return done(null, user)

    } catch (error) {
        return done(error);
    }   }));