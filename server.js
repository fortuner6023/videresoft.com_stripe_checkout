// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").load();
// }
require("dotenv").config({ path: "./config.env" });
const stripeSecretKey = process.env.stripeSecretKey;
const stripePublicKey = process.env.stripePublicKey;

const express = require("express");
const app = express();
const fs = require("fs");
const stripe = require("stripe")(stripeSecretKey);
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  fs.readFile("items.json", (error, data) => {
    if (error) {
      res.status(500).end();
    } else {
      res.render("store.ejs", {
        stripePublicKey: stripePublicKey,
        items: JSON.parse(data),
      });
    }
  });
});

app.post("/purchase", (req, res) => {
  fs.readFile("items.json", (error, data) => {
    if (error) {
      res.status(500).end();
    } else {
      const itemsJson = JSON.parse(data);
      const itemsArray = itemsJson.music.concat(itemsJson.merch);
      let total = 0;
      let description = "";
      req.body.items.forEach((item) => {
        const itemJson = itemsArray.find((i) => {
          return i.id == item.id;
        });
        description = itemJson.name;
        total = total + itemJson.price * item.quantity;
      });

      stripe.charges
        .create({
          amount: total,
          source: req.body.stripeTokenId,
          currency: "eur",
          description: "Payment for " + description,
        })
        .then((item) => {
          console.log("Charge Successful", item);
          res.render("success", { message: "Successfully purchased items" });
        })
        .catch((err) => {
          console.log("Charge Fail ", err);
          res.status(500).render("cancel", { message: "Transaction failed" });
        });
    }
  });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
