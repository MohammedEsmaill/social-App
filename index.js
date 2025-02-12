import bootstrap from "./src/app.controller.js";
import dotenv from "dotenv";
import path from "path";
dotenv.config({path:path.resolve("src/config/.env")});
import express from "express";
const app = express();
const port = process.env.PORT;
bootstrap(app,express)
app.listen(port,()=>{
    console.log(`server is listening on port ${port}`);
})
