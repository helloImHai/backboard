// app.js
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import indexRouter from "./routes/index";
import cors from "cors";
import Server from "./logic/Server";
import https from "https";
import fs from "fs";

var app = express();
app.set("view engine", "html");
app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/", indexRouter);

const options = {
  key: fs.readFileSync(path.join(__dirname, "../public", "/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../public", "/cert.pem")),
};

const server = https.createServer(options, app);
const socketServer = new Server(server);
socketServer.init();
console.log("Initiated");

server.listen(process.env.PORT || 8000);

export default app;
