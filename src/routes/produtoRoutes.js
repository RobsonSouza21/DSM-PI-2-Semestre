const express = require('express');
const router = express.Router();

const produtoController = require('../controllers/produtoController');

router.get('/produto', produtoController.listarProdutos);

router.post('/produto', produtoController.criarProduto);

router.put('/produto', produtoController.editarProduto);

router.delete('/produto/:id_produto', produtoController.excluirProduto);

router.post('/venda', produtoController.realizarVenda);

router.post('/login', produtoController.login);

router.post('/compra', produtoController.realizarCompra);

router.get('/compra', produtoController.listarCompras);

router.put('/compra/:id_compra/status', produtoController.atualizarStatusCompra);

module.exports = router;