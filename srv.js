// Брутфорсный запуск сервера
const express = require('express')
const app = express()

var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var jsonParser = bodyParser.json();

// Брутфорсный запуск датчика
const ITMP = require('./ITMP.js')
const ITMPSerialLink = require('./seriallink')
const itmp = new ITMP()

// Функция поиска последовательных портов
const SerialPort = require('serialport')
var com;
SerialPort.list((err, ports) => {
  if (err) { return }
  ports.forEach((port) => {
    if(port.manufacturer == 'Silicon Labs' && port.productId == 'EA60')
      com = port.comName;
  })
  
  itmp.addLink(new ITMPSerialLink(itmp, 'com', com))
  var dat = new Object();
  dat.H = ''; dat.T = '';
  // Обработчик запроса для страницы
  app.get('/request', jsonParser, function(req, res) {

    var data = new Object();

    itmp.call("com/47", "get",undefined,(dat)=>{
      data.hum = (dat[0][0]/10).toFixed(1);
      data.tem = (dat[0][1]/10).toFixed(1);
      console.log('Requested H: ' + data.hum + '; T: ' + data.tem + ';');
      res.send(data);
      res.end();
    });
  })

  var mongoClient = require("mongodb").MongoClient;
  var url="mongodb://common:1234rewq@ds111420.mlab.com:11420/systdb"; //url бд
  // добавление в бд
  setInterval(function() {        //добавить запись каждые 5с
      mongoClient.connect(url, function(err, db){   //подключаемся к бд
      var collection = db.collection("readings");   //подключаемся к коллекции
      itmp.call("com/47", "get",undefined,(dat)=>{
      collection.insertOne({date: new Date(), Humidity: (dat[0][0]/10).toFixed(1), Temperature: (dat[0][1]/10).toFixed(1)}, function(err, result){
          if(err) {return console.log(err);}
          console.log(result.ops);
      });
    });
    });
    }, 5000);

  //cp2104 driver required
  app.use('/', express.static('public'))
  app.listen(3000, () => {
    console.log(`Server running at localhost:3000`);
  });
})
