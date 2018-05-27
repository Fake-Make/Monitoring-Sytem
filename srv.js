// variables
// Брутфорсный запуск сервера
const express = require('express')
const app = express()

var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var jsonParser = bodyParser.json();

// Брутфорсный запуск датчика
const ITMP = require('./ITMP.js')
const ITMPSerialLink = require('./seriallink')

// Помещение данных в бд
function putToBD (data) {
  // Переменные для монго-бд
  var mongoClient = require("mongodb").MongoClient;
  var url="mongodb://common:1234rewq@ds111420.mlab.com:11420/systdb"; //url бд

  // Отправка данных в базу данных
  mongoClient.connect(url, function(err, db){   //подключаемся к бд
    var collection = db.collection("readings");   //подключаемся к коллекции
    data === undefined ? console.log("Data wasn't sent") : collection.insertOne({date: new Date(), Humidity: data.hum, Temperature: data.tem}, function(err, result){
    err ? console.log(err) : console.log('Data sent to mongodb');
    });
  });
}

// Функция отправки сообщения
function mailSending(h, t, f) {
  // Модуль для отправки сообщений
  var nodemailer = require('nodemailer');
  var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'svtgrishaeva@gmail.com',
      pass: '46gilazo'
    }
  });
  f = 1 == f ? 'превысили допустимые значения!' : 'снова в норме!'
  transporter.sendMail({
    from: 'svtgrishaeva@gmail.com',
    to: 'sveta.grishaeva.2018@gmail.com',
    subject: 'Показатели датчика ' + f,
    text: 'Влажность: ' + h + ', температура: ' + t},
    function(error, info) {
      if (error) console.log(error);
      else console.log('Email sent: ' + info.response);
    }
  );
}

// Проверка экстремальной ситуации
// И отправка сообщения
function checkAndMail(data, flag) {
  if ( data.hum > 65 || data.tem > 40) {
  // Если экстремальная ситуация только началась
    if ( !flag ) {
      mailSending(data.hum, data.tem, 1);
      return 1;
    } 
  }
  // Экстремальная ситуация закончилась
  else if ( flag ) {
    mailSending(data.hum, data.tem, 0);
    return 0;
  }
}

// Функция поиска последовательных портов
const SerialPort = require('serialport')
SerialPort.list((err, ports) => {
  if (err) { return }
  var com = [], itmp = [], i = 0;
  ports.forEach((port) => {
    if(port.manufacturer == 'Silicon Labs' && port.productId == 'EA60')
      com[i++] = port.comName;
  })

  // Если таких не нашли, то беда
  if (!com.length) return;
  
  // Последовательно подключаемся к нашим устройствам
  for (var i = 0; i < com.length; i++) {
    itmp[i] = new ITMP();
    itmp[i].addLink(new ITMPSerialLink(itmp[i], 'com', com[i]));
    console.log('Device #' + (1 +i) + ': ' + com[i]);
  } 
  var dat = new Object();
  dat.H = ''; dat.T = '';
  var alertFlag = 0;
  // Обработчик запроса для страницы
  app.get('/request', jsonParser, function(req, res) {

    var data = new Object();

    // Обращение к устройствам
    for (var i = 0; i < itmp.length; i++) {
        itmp[i].call("com/47", "get",undefined,(dat)=>{
        data.hum = (dat[0][0]/10).toFixed(1);
        data.tem = (dat[0][1]/10).toFixed(1);
        console.log('Requested H: ' + data.hum + '; T: ' + data.tem + ';');

        // Помещение данных в бд
        putToBD(data);
        // Проверка экстремальности ситуации
        alertFlag = checkAndMail(data, alertFlag);

        res.send(data);
        res.end();
      });
    }
  })

  app.use('/', express.static('public'))
  app.listen(3000, () => {
    console.log(`Server running at localhost:3000`);
  });
})
