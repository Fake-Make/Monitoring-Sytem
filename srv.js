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
app.use('/', express.static('public'))
app.listen(3000, () => {
  console.log(`Server running at localhost:3000`);
});

// Брутфорсный запуск датчика
const ITMP = require('./ITMP.js')
const ITMPSerialLink = require('./seriallink')
const itmp = new ITMP()
itmp.addLink(new ITMPSerialLink(itmp, 'com', 'COM3'))

// Таймер, ежесекундно получающий влажность * 10 и температуру * 10 соответственно
var stattimer = setInterval(() => {
		itmp.call("com/47",		// Функция возвращает строку-склейку из
			"get",				// Температуры и влажности
			null,
			)
        },
        1000,
        )
//cp2104 driver required