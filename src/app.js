require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const produtoRoutes = require('./routes/produtoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use('/produtos', produtoRoutes);

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});