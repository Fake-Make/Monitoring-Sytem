public/ - фронт-энд часть.

srv.js - актуальный, работающий файл сервера.
Запускается нодом, данные из датчика возвращает в консоль.

srv - копия.js - старый файл сервера с наработками Цыгулина.
Кому интересно - можете почитать.
Все комментарии в файле - по делу.

ITMP.js - велосипедная реализация протокола.
За дополнительными комментариями к Вите.

HTMeter.js - "аватар" датчика. Через него вызываем функции для получения данных.

--------------------------------How to install-----------------------------------

Требуется установить node, npm и драйвер для датчика. Драйвер находится в файле cp2104 driver.zip.
При первом запуске в srv.js раскоментить поиск COM-портов, запустить сервер и посмотреть, какой порт занимает устройство.
Соответственно, в строке 71 (new ITMPSerialLink(itmp, 'com', 'COM3')) COM3 поменять на COM#, где # - номер нужного порта.
"com/47" в строке 74 - адрес последовательного порта самого датчика.

--------------------------------База данных-----------------------------------
Для хостинга бд используем mlab.com. Логин: common пароль: 1234rewq. Для работы бд нужны пакеты mongodb. Для этого открываем консоль и прописываем npm install mongodb@2.2.33

Если нужна локальная бд:
1. Переходим по ссылке и качаем Community Server https://www.mongodb.com/download-center?jmp=nav#atlas
2. Устанавливаем. При установке может возникнуть ошибка и бд не установиться. В таком случае во время выбора типа установки выбираем Custom и снимаем флажок с Install MongoDB Compass (в этом случае его установим отдельно)
3. Создаем каталог для хранения бд C:\data\db
4. Переходим в директорию бд в папку bin и запускаем сервер бд mongod.exe. Сервер запустится на localhost-e на стандартном порте.
5. Запускаем MongoDB Compass и нажимаем Connect.
6. Создаем бд с названием systDB и коллекцию readings (названия можно любые но тогда нужно будет их заменить в коде)
7. Добавляем пакеты для бд в проект. Открываем консоль и прописываем npm install mongodb@2.2.33
