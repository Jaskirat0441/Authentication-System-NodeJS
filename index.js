const express = require("express");
const { default: mongoose } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const UserSchema = require("./Utilis/Schemas/UserSchema");
const ProfileSchema = require("./Utilis/Schemas/ProfileSchema");
const { cleanUpAndValidate } = require("./Utilis/AuthUtils");
const session = require("express-session");
const isAuth = require("./views/middleware");

const mongoDBSession = require("connect-mongodb-session")(session);
const app = express();

app.set("view engine", "ejs");
4;

const mongoURI = `mongodb+srv://jaskirat0441:Jaskirat7005@cluster0.txwewnd.mongodb.net/auth-node`;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("Connect to db");
  })
  .catch((err) => {
    console.log("failed to connect", err);
  });

// m
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// sessions

const store = new mongoDBSession({
  uri: mongoURI,
  collection: "sessions",
});

app.use(
  session({
    secret: "this is authetication project",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// routes
app.get("/", (req, res) => {
  res.send("Welcome to my app");
});

app.get("/register", (req, res) => {
  return res.render("register");
});
app.get("/login", (req, res) => {
  return res.render("login");
});
//   register data to db
app.post("/register", async (req, res) => {
  console.log(req.body);
  const { name, email, username, password, phone } = req.body;
  try {
    await cleanUpAndValidate({ name, password, email, username, phone });
  } catch (err) {
    return res.send({
      status: 400,
      message: err,
    });
  }

  //  hashed password

  const hashedPassword = await bcrypt.hash(password, 7);
  console.log(hashedPassword);

  let user = new UserSchema({
    name: name,
    username: username,
    password: hashedPassword,
    email: email,
    phone: phone,
  });
  console.log(user);

  //   user already exist or not
  let userEmailExist;
  let userNameExist;
  try {
    userEmailExist = await UserSchema.findOne({ email });
    userNameExist = await UserSchema.findOne({ username });
  } catch (error) {
    return res.send({
      status: 404,
      message: "Innternal Server Error,Try Again",
      error: error,
    });
  }
  if (userEmailExist || userNameExist) {
    return res.send({
      status: 404,
      message: "User Already Exits",
    });
  }

  //   data into db
  try {
    const userDB = await user.save(); // data save in db
    res.redirect("/login");
    // return res.send({
    //     status: 201,
    //     message: "User is Registered Successfully",
    //     data: {
    //         _id: userDB._id,
    //         username: userDB.username,
    //         email: userDB.email,
    //     },
    // });
} catch (err) {
    return res.send({
      status: 404,
      message: "Internal Server Error,Try Again",
      error: err,
    });
  }
  //   return res.send({
  //     status:200,
  //     message:"User is Registered"
  //   })
});

// login data

app.post("/login", async (req, res) => {
  const { login_id, login_pass } = req.body;

  if (
    typeof login_id != "string" ||
    typeof login_pass != "string" ||
    !login_id ||
    !login_pass
  ) {
    return res.send({
      status: 404,
      message: "Invalid Data",
    });
  }

  let userDB;
  // check it email  or username
  try {
    if (validator.isEmail(login_id)) {
      userDB = await UserSchema.findOne({ email: login_id });
    } else {
      userDB = await UserSchema.findOne({ username: login_id });
    }
    if (!userDB) {
      return res.send({
        status: 404,
        message: "User Not Found ,Please Register first",
      });
    }
    // check the db passowrd
    const passMatch = await bcrypt.compare(login_pass, userDB.password);
    console.log(passMatch);
    if (!passMatch) {
      return res.send({
        status: 404,
        message: "Invalid Password",
        data: req.body,
      });
    }

    // storing the session data
    req.session.isAuth = true;
    req.session.user = {
      username: userDB.username,
      email: userDB.email,
      userId: userDB._id,
    };

    res.redirect("/dashboard");
    // return res.send({
    //   status: 200,
    //   message: "Logged in successfully",
    //   data: req.body,
    // });
  } catch (err) {
    return res.send({
      status: 404,
      message: "Internal Server Error,Try Again",
      error: err,
    });
  }
});

// home

// retrieve data
app.get("/dashboard", isAuth, async (req, res) => {
  const profileData = req.body;
  console.log(profileData);
  let userData;
  try {
      userData = await ProfileSchema.find({
          username: req.session.user.username,
        });
        console.log(userData);
    } catch (err) {
        return res.send({
            message: "Database Error",
        });
    }
    return res.render("dashboard", { userData: userData });
});

//   dashboard
app.post("/dashboard", async (req, res) => {

    const id = req.body.id;
    const newData = req.body.newData;

    // if (!id || !newData) {
    //     return res.send({
    //       status: 404,
    //       message: "Missing Paramters.",
    //       error: "Missing todo data",
    //     });
    //   }

  const {
    name,
    email,
    username,
    password,
    phone,
    state,
    country,
    college_name,
  } = req.body;
  const hashedPassword = await bcrypt.hash(password, 7);

  let profileSchema = new ProfileSchema({
    name: name,
    username: username,
    password: hashedPassword,
    email: email,
    phone: phone,
    state: state,
    country: country,
    college_name: college_name,
  });
  

    try {
    
        const profileDB = await profileSchema.findOneAndUpdate(
            { _id: id },
            { newData: newData }
          );
        return res.send({
          status: 200,
          message: "Profile Updated Succesfully",
          data: profileDB,
        });
  } catch (err) {
    return res.send({
      status: 400,
      message: "Database error, Please Try again.",
      error: err,
    });
  }
});

const PORT = process.env.port || 8000;

app.listen(PORT, () => {
  console.log(`Listenning on port ${PORT}`);
});
