const express = require('express')
const bodyParser = require('body-parser')
const {initializeApp} =require("firebase/app")
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require('firebase/auth');
var urlencoded = bodyParser.urlencoded({extended: true})

const firebaseConfig = {
    apiKey: "AIzaSyBg42HKA8Ljy6OJrfx-HHh_nrMgNBifBmw",
    authDomain: "examenux-b95af.firebaseapp.com",
    projectId: "examenux-b95af",
    storageBucket: "examenux-b95af.firebasestorage.app",
    messagingSenderId: "501626205297",
    appId: "1:501626205297:web:d477ebfc880849f90157d0",
    measurementId: "G-X245D21BPK"
};
  //current user
  let user = "";
  // Initialize Firebase
const firebase = initializeApp(firebaseConfig);
const cors = require('cors');

const app = express();
app.use(urlencoded)
app.use(cors())

app.options('*', cors())

const port = 3001

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://darielsevilla:DQ7mHwdpmvpWKz7@clusterdarielsevilla.kew8t.mongodb.net/?retryWrites=true&w=majority&appName=ClusterDarielSevilla";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB")
  } catch(error) {
    console.log(error)  
  }
}
app.listen(port, ()=>{
    try{
        console.log("Backend levantado")
        run();
    }catch(error){

    }
})

app.post("/createUser", async (req, res)=>{
    try{
        const response = await createUserWithEmailAndPassword(getAuth(), req.body.email, req.body.password);
        return res.status(200).send({
            message: "mensaje enviado correctamente",
            response: response
        })
    }catch(error){
        return res.status(402).send({
            message: "No se pudo crear el usuario",
            response: error
        })
    }
})

app.post("/logIn", async (req, res)=>{
    try{
        const response = await signInWithEmailAndPassword(getAuth(), req.body.email, req.body.password);
        user = response.user.uid;

        return res.status(200).send({
            message: "sesión iniciada",
            user: user
        })
        
    }catch(error){

        return res.status(402).send({
            message: "No se pudo iniciar sesión",
        })
    }
})

app.post("/logOut", async (req, res)=>{
    try{
        if(user == ""){
            return res.status(401).send({
                message: "No tenia una sesión iniciada",
            })
        }
        const response = await signOut(getAuth());
        user = "";

        return res.status(200).send({
            message: "mensaje enviado correctamente",
            user: user
        })
        
    }catch(error){
        return res.status(402).send({
            message: "No se pudo cerrar sesión",

        })
    }
})

app.post("/createPost", async (req, res)=>{
    try{
        if(user == ""){
            return res.status(501).send({
                message: "Necesita tener una sesión iniciada para crear un post",
            })
        }
        const database = client.db("ExamenUX");
        const collection = database.collection("Post");
        if(!req.body.message){
            return res.status(401).send({
                message: "Necesita enviar un mensaje (message)",
            })
        }
        const response = await collection.insertOne({
            user: user,
            message: req.body.message, 
            ...req.body
        })
        return res.status(200).send({
            message: "post creado correctamente",
            user: user,
            response: response
        })
        
    }catch(error){
        return res.status(402).send({
            message: "No se pudo crear el post",
            response: error
        })
    }
}) 

app.get("/listPost", async (req, res)=>{
    try{
        if(user == ""){
            return res.status(401).send({
                message: "Necesita tener una sesión iniciada para listar sus post",
            })
        }
        const database = client.db("ExamenUX");
        const collection = database.collection("Post");
        
    
        
        const response = await collection.find({
            user: user
        }).toArray();
        return res.status(200).send({
            message: "posts recuperados correctamente",
            lista: response
        })
        
    }catch(error){
        return res.status(402).send({
            message: "No se pudo crear el post",
        })
    }
}) 

app.put("/esitPost", async (req, res)=>{
    try{
        if(user == ""){
            return res.status(401).send({
                message: "Necesita tener una sesión iniciada para listar sus post",
            })
        }

        if(req.body.user){
            return res.status(402).send({
                message: "No se puede editar el creador del post (valor de user encontrado en el body)",
            })
        }
        const database = client.db("ExamenUX");
        const collection = database.collection("Post");
        
        //si encuentra atributos que ya estan, los editará, y añadira cualquier atributo nuevo que el usuario quiera agregar
        const response = await collection.updateOne(
            { 
                _id: new ObjectId(req.query.id),
                user: user,
            },
            {
                $set: {
                    ...req.body
                }
            }
        );


        if(response.matchedCount == 0){
            return res.status(403).send({
                message: "Este usuario no tiene un post con id=" + req.query.id
            })
        }
        return res.status(200).send({
            message: "post "+ req.query.id + " actualizado correctamente",
            response: response
        })
        
    }catch(error){
        console.log(error)
        return res.status(402).send({
            message: "El post no se ha modificado",
        })
    }
}) 

app.delete("/deletePost", async (req, res)=>{
    try{
        if(user == ""){
            return res.status(401).send({
                message: "Necesita tener una sesión iniciada para listar sus post",
            })
        }

        const database = client.db("ExamenUX");
        const collection = database.collection("Post");
        
       
        const response = await collection.deleteOne(
            { 
                _id: new ObjectId(req.query.id),
                user: user,
            },
        );


        if(response.deletedCount == 0){
            return res.status(300).send({
                mensaje: "Este usuario no tenía ningún post con id="+req.query.id,
            });
        }
        return res.status(200).send({
            message: "post "+ req.query.id + " eliminado correctamente",
            response: response
        })
        
    }catch(error){
        console.log(error)
        return res.status(402).send({
            message: "El post no se ha eliminado",
        })
    }
}) 
