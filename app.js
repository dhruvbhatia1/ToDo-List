const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config()
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://dbhatia03:${process.env.MONGOOSE_PASSWORD}@cluster0.9sbdoeh.mongodb.net/todolistDB`, {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listsSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listsSchema);


app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});
    
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to DB");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (error) {
    console.log(error);
  }
});



app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({name: customListName});
    if (!foundList) {
      //Create a new List
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/"+customListName);
    } else {
      //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  } catch (error) {
    console.log(error);
  }
});


app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  try {
    if (listName === "Today"){
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({name: listName});
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/"+listName);
    }
  } catch (error) {
    
  }  
});

app.post("/delete", async function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemID);
      console.log("Successfully deleted checked item");
      res.redirect("/");
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
      const foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}});
    } catch (error) {
      res.redirect("/"+listName)
    }  
  }
});




app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
