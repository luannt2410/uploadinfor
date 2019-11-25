const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const multer = require('multer');
const port = 3000

// Database
const mariadb = require('mariadb');
const pool = mariadb.createPool({
  host: '1.55.215.214',
  port: '3969',
  database: 'tland',
  user: 'root',
  password: 'infocity12!@',
  connectionLimit: 5
});

fs = require('fs-extra')
app.use(bodyParser.urlencoded({ extended: true }))



var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

var upload = multer({ storage: storage })


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');

});

// upload single file

app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)

  }


  res.send(file)

})
//Uploading multiple files
app.post('/uploadmultiple', upload.array('myFiles', 12), (req, res, next) => {
  const files = req.files
  if (!files) {
    const error = new Error('Please choose files')
    error.httpStatusCode = 400
    return next(error)
  }

  res.send(files)

})


app.post('/uploadphoto', upload.single('picture'), (req, res) => {
  var img = fs.readFileSync(req.file.path);
  var encode_image = img.toString('base64');
  // Define a JSONobject for the image attributes for saving to database

  var finalImg = {
    contentType: req.file.mimetype,
    image: new Buffer(encode_image, 'base64'),
    name: req.file.originalname
  };

  pool.getConnection()
    .then(conn => {

      conn.query("SELECT 1 as val")
        .then((rows) => {
          console.log(rows); //[ {val: 1}, meta: ... ]
          console.log("req.file:::::", req.file);
          //Table must have been created before 
          return conn.query("INSERT INTO TB_UPLOAD_INFOR (IMAGE_HASH, ID_TYPE, IMAGE_NAME) VALUES (?, ?, ?) ", [finalImg.image, finalImg.contentType, finalImg.name]);
        })
        .then((result) => {
          console.log(result); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
          console.log('saved to database')
          res.json({
            'message': 'File upload successfully'
          });
          conn.end();
        })
        .catch(err => {
          //handle error
          console.log(err);
          res.json({
            'message': 'Image uploaded with same name, change name or choose other image.'
          });
          conn.end();
        })

    }).catch(err => {
      //not connected
      return console.log(err)
    });

})


app.get('/photos', (req, res) => {

});

app.get('/photo/:id', (req, res) => {
  var filename = "%" + req.params.id + "%";

  pool.getConnection()
    .then(conn => {

      conn.query("SELECT 1 as val")
        .then((rows) => {
          console.log(rows); //[ {val: 1}, meta: ... ]
          console.log("filename", filename);

          return conn.query("SELECT IMAGE_HASH FROM TB_UPLOAD_INFOR WHERE IMAGE_NAME LIKE ? ", [filename]);
        })
        .then((result) => {
          if (result[0] != null) {
           res.contentType('image/jpeg');
           res.send(result[0].IMAGE_HASH)
         } else {
          res.json({
            'message': 'No image found!'
          });
         }
         conn.end();
          
        })
        .catch(err => {
          //handle error
          console.log(err);
          conn.end();
        })

    }).catch(err => {
      //not connected
      return console.log(err)
    });


})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
