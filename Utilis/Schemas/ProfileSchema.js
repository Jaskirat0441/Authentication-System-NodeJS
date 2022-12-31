const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const profileSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  college_name: {
    type: String,
    required: true,
  },
//    college_name: {
//     type: String,
//     required: true,
//   },
  // emailAuthenticated: {
  //   type: Boolean,
  // },
});

module.exports = mongoose.model("profile", profileSchema);
