// app.js
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import indexRouter from "./routes/index";
import usersRouter from "./routes/users";
import cors from "cors";
import Server from "./logic/Server";
import http from "http";

var app = express();
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/", indexRouter);
app.use("/users", usersRouter);

const server = http.createServer(app);
const socketServer = new Server(server);
socketServer.init();
console.log("Initiated");

server.listen(process.env.PORT || 8000);

export default app;
