const { log } = require('console');
const express = require('express');
const app = express();
const port = 3001;
app.use(express.static('public'));

app.get('/about', (req, res) => {
  res.send('This is the about page. I built this server myself!');
});

app.get('/api/time', (req, res) => {
  res.json({
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString()
  });
});

app.get('/api/greeting&name=Sara', (req, res) => {
  res.send('hello sara')
})

app.listen(port, () => {
  console.log();
});

