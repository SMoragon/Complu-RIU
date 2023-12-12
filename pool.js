const mysql = require("mysql");

class Pool {
  constructor(host, user, password, database) {
    if(!Pool._pool){
      Pool._pool = mysql.createPool({
        host: host,
        user: user,
        password: password,
        database: database,
      });
    }
  }

  static get_pool() {
    return Pool._pool;
  }
}

module.exports = Pool;
