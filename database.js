let mongoose = require("mongoose");

class Database {
  constructor(callback) {
    this._connect(callback);
  }

  _connect(callback) {
    mongoose
      .connect(process.env.DATABASE, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true
      })
      .then(() => {
        console.log("Database connection successful");
        callback;
      })
      .catch(err => {
        console.error("Database connection error",err);
      });
  }
}

module.exports = Database;