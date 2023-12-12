const mysql = require("mysql");

class Pool {
  constructor(host, user, password, database) {
    if (Pool._pool) {
      this._pool=Pool._pool;
    }
    else {
      this._pool = mysql.createPool({
        host: host,
        user: user,
        password: password,
        database: database,
      });
    }

  }

  static get_pool() {
    return this._pool;
  }
}

module.exports = Pool;
