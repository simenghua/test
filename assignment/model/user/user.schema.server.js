var mongoose = require('mongoose');
var WebsiteSchema = require("../website/website.schema.server");
var UserSchema = mongoose.Schema({
  username: String,
  password: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  websites: [WebsiteSchema],
  dateCreated: {
    type: Date,
    default: Date.now
  },
  facebook : {
    token: String,
    id: String,
    displayName : String
  }
}, {collection: 'user'});

module.exports = UserSchema;
