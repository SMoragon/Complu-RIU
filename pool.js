const mysql = require("mysql");

class Pool {
  constructor(host, user, password, database) {
    this._pool = mysql.createPool({
      host: host,
      user: user,
      password: password,
      database: database,
    });
  }

  get_pool() {
    return this._pool;
  }
}

module.exports = Pool;
