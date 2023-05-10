import mongoose from "mongoose";
import express from "express";
import dbMessages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";
const app = express();
const port = process.env.PORT || 8080;
const pusher = new Pusher({
  appId: "1597786",
  key: "48316281dd4ad140e510",
  secret: "c92b732c60788acd9478",
  cluster: "ap2",
  useTLS: true,
});
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});
const Connection_url = `mongodb+srv://chat-connect:DtkjENTeSbEZS6Wz@cluster0.ztnrcfb.mongodb.net/chatBox?retryWrites=true&w=majority`;
mongoose.set("strictQuery", false);
mongoose
  .connect(Connection_url)
  .then(() => {
    app.listen(port, () => console.log(`listening on localhost:${port}`));
    console.log("connected to db");
  })
  .catch((error) => {
    console.log("error");
  });
const db = mongoose.connection;
db.once("open", () => {
  console.log("DB created");

  const msgBox = db.collection("messagecontents");
  const changeStream = msgBox.watch();
  changeStream.on("change", (change) => {
    console.log("A change occured", change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering pusher");
    }
  });
});

app.get("/", (req, res) => res.status(200).send("hello world"));
app.get("/messages/find", (req, res) => {
  dbMessages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  dbMessages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});
