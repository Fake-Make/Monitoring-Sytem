// Функция поиска последовательных портов
/*const SerialPort = require('serialport')
SerialPort.list((err, ports) => {
  if (err) { return }
  ports.forEach((port) => {
    console.log(port.comName + JSON.stringify(port))
    // console.log(port.manufacturer);
  })
})
*/

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

var dat = new Object();
dat.H = ''; dat.T = '';

itmp.addLink(new ITMPSerialLink(dat, itmp, 'com', 'COM3'))
    itmp.call("com/47", "get");

// Обработчик запроса для страницы
app.get('/request', jsonParser, function(req, res) {
  var data = new Object();

  itmp.call("com/47", "get");

  data.hum = dat.H;
  data.tem = dat.T;

  console.log('Requested H: ' + data.hum + '; T: ' + data.tem + ';');

  res.send(data);
  res.end();
})

//cp2104 driver required
app.use('/', express.static('public'))
app.listen(3000, () => {
  console.log(`Server running at localhost:3000`);
});
