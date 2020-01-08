const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db_location = 'database.db'

function open(){
  const db = new sqlite3.Database(path.join(__dirname,db_location), sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
  });
  db.on("error", function(error) {
      console.log("Getting an error : ", error);
  }); 
  return db
}


// close the database connection
function close(db){
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
  });
}




exports.run = function(sql){
  const db = open()
  return new Promise(function(resolve,reject){
    db.run(sql, function(err){
      if(err){
        console.warn("WARNING:", err)
        resolve(false)
      }else{
        resolve(true)
      }
    })
    close(db)
  })
  
  
}
exports.each = async function(sql){
  const db = open()
  return new Promise(function(resolve,reject){
    db.serialize(() => {
      db.all(sql, [], (err, rows) => {
        if (err) {
          throw err
        }
        resolve(rows)
      })
    })
    close(db)
  }) 
}
