const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true});
const itemsSchema = {
  name:String,
};

const Item = mongoose.model("Item",itemsSchema);

const item = new Item({
  name:"Welcome to the To Do List !",
});

const item2 = new Item({
  name:"Hit the + button for add a new note",
});

const item3 = new Item({
  name:"<-- Hit this button for delete the item",
});



const defaultItems = [item,item2,item3];

const listSchema = {
  name:String,
  items:[itemsSchema] // itemSchema is array of strings and the field is name which basically stores the notes of user if not then default items of array 
};

const List  = mongoose.model("List",listSchema);


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



app.get("/", function (req, res) {
  // Item is document of database it refers  to the Item array of data and 
    Item.find({},function(err,foundItems){ //foundItems is the name for the found items , find({}) -> all the items in the database
      if(foundItems.length === 0){ // try too find the length of the all the items in the database
        Item.insertMany(defaultItems,function(err){ // if there is no items in the database then we store the items of array -> default items
          if(err){
            console.log(err);
          }else{
            console.log("Inserted Successfully");
          }
        });
        res.redirect("/"); // for redirect user to the home page
      }else{
        //listTItle ejs variable  and newListITems -> is array of items passing this value to the list ejs in form of array
        res.render("list", { listTitle: "Today", newListItems: foundItems }); // if there is items in the database then show the main page list.ejs
      }
    });
});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName},function(err,foundList){
    if(!err){
      if(!foundList){
          //create a new list
          const list = new List({
            name:customListName,
            items:defaultItems
          });
        
          list.save();//save the custom list notes in the database 
          res.redirect("/" + customListName);
      }else{
        //show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items }); // if there is items in the database then show the main page list.ejs
      }
    }
  });
  

});


app.post("/", function (req, res) {
  const itemName = req.body.newItem; // added value of to do list is stored in itemName
  const listName = req.body.list; // Title of current list
  const item = Item({ // create a new doc for item
    name:itemName //store the value of to do note in name filed where items doc is created in database
  });
  if(listName === "Today"){
    item.save();//save one record in item model
    res.redirect("/"); // redirect to the home route
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  } 
});

app.post("/delete",function(req,res){
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
  Item.findByIdAndRemove(checkItemId, function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/");
    }
  });  
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkItemId}}}, function(err,foundList){ //passing three things 1- condition 2-what update you wanna make 3 - call back
      if(err){
        console.log(err);
      }else{
        res.redirect("/" + listName); 
      }
    })
  }
});




app.listen(3000, function () {
  console.log("listening on server 3000");
});
