const express = require('express')

const app = express();
const path = require('path');

const bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//app.set('port', 3000);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));

//app.listen(3000, () => console.log('Server up and running'));
app.listen(process.env.PORT, () => console.log('Server up and running'));