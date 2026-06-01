const db = require('../database/db');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const listarProdutos = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM produtos');

        res.json(rows);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            erro: 'Erro ao buscar produtos'
        });
    }
};

const criarProduto = async (req, res) => {
    try {

        const { nome, preco_unitario, quantidade_estoque } = req.body;

        await db.query(
            `INSERT INTO produtos 
            (nome, preco_unitario, quantidade_estoque)
            VALUES (?, ?, ?)`,
            [nome, preco_unitario, quantidade_estoque]
        );

        res.status(201).json({
            mensagem: 'Produto criado com sucesso'
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            erro: 'Erro ao criar produto'
        });
    }
};

const editarProduto = async (req, res) => {
    try {
        
        const { id_produto, nome, preco_unitario, quantidade_estoque} = req.body;

        await db.query(
            `UPDATE produtos
            SET nome = ?, preco_unitario = ?, quantidade_estoque = ?
            WHERE id_produto = ?`,
            [nome, preco_unitario, quantidade_estoque, id_produto]
        );

        res.status(200).json({
            mensagem: 'Produto editado com sucesso'
        });

    } catch (error){

        console.log(error);

        res.status(500).json({
            erro: 'Erro ao editar produto'
        });
    }
}

const excluirProduto = async (req, res) => {
    try {

        const {id_produto} = req.params;

        await db.query(
            `DELETE FROM produtos
            WHERE id_produto = ?`,
            [id_produto]
        );

        res.status(200).json({
            mensagem: 'Produto excluido com sucesso'
        });

    } catch (error){

        console.log(error);
        
        res.status(500).json({
            erro: 'Erro ao excluir o produto'
        });
    }
}

const criarVenda = async (req) => {
    try {

        const {data_venda, valor_total, id_usuario} = req.body;

        const [result] = await db.query(
            `INSERT INTO vendas
            (data_venda, valor_total, id_usuario)
            VALUES(?, ?, ?)`,
            [data_venda, valor_total, id_usuario]
        )

        const id_venda = result.insertId;

        return id_venda;

    } catch (error){
        console.error(error);
        throw error;
    }
}

const registrarVenda = async (id_venda, id_produto, quantidade_vendida, preco_praticado) => {
    try {
        await db.query(
            `INSERT INTO itens_venda
            (id_venda, id_produto, quantidade_vendida, preco_praticado)
            VALUES (?, ?, ?, ?)`,
            [
                id_venda,
                id_produto,
                quantidade_vendida,
                preco_praticado
            ]
        );   
    } catch (error){
        console.error(error);
        throw error;
    }
}

const realizarVenda = async (req, res) => {
    try {

        const id_venda = await criarVenda(req);

        const produtos = req.body.produtos;

        for (const produto of produtos) {

            await registrarVenda(
                id_venda,
                produto.id_produto,
                produto.quantidade_vendida,
                produto.preco_praticado
            );

        }

        res.status(201).json({
            mensagem: "Venda registrada com sucesso",
            id_venda
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: "Erro ao registrar venda"
        });

    }
};

const login = async (req, res) => {
    try {

        const { login, senha } = req.body;

        // procura usuário
        const [usuarios] = await db.query(
            "SELECT * FROM usuarios WHERE login = ?",
            [login]
        );

        // verifica se existe
        if (usuarios.length === 0) {
            return res.status(401).json({
                error: "Login ou senha inválidos"
            });
        }

        const usuario = usuarios[0];

        // compara senha
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                error: "Login ou senha inválidos"
            });
        }

        // gera token
        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                login: usuario.login
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login realizado com sucesso",
            token
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "erro interno"
        });

    }
};

const realizarCompra = async (req, res) => {
    try {
        const { data_compra, fornecedor, valor_total, id_usuario, produtos, status } = req.body;

        const [result] = await db.query(
            `INSERT INTO compras
            (data_compra, fornecedor, valor_total, id_usuario, status)
            VALUES (?, ?, ?, ?, ?)`,
            [data_compra, fornecedor, valor_total, id_usuario, status || 'Pendente']
        );

        const id_compra = result.insertId;

        for (const produto of produtos) {
            await db.query(
                `INSERT INTO itens_compra
                (id_compra, id_produto, quantidade_comprada, preco_compra)
                VALUES (?, ?, ?, ?)`,
                [
                    id_compra,
                    produto.id_produto,
                    produto.quantidade_comprada,
                    produto.preco_compra
                ]
            );
        
            if ((status || 'Pendente') === 'Finalizado') {
                await db.query(
                    `UPDATE produtos
                    SET quantidade_estoque = quantidade_estoque + ?
                    WHERE id_produto = ?`,
                    [
                        produto.quantidade_comprada,
                        produto.id_produto
                    ]
                );
            }
        }

        res.status(201).json({
            mensagem: "Compra registrada com sucesso",
            id_compra
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao registrar compra"
        });
    }
};

const listarCompras = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                c.id_compra,
                c.data_compra,
                c.fornecedor,
                c.valor_total,
                c.status,
                COUNT(ic.id_item_compra) AS quantidade_itens
            FROM compras c
            LEFT JOIN itens_compra ic ON c.id_compra = ic.id_compra
            GROUP BY c.id_compra, c.data_compra, c.fornecedor, c.valor_total
            ORDER BY c.id_compra DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: 'Erro ao listar compras'
        });
    }
};

const atualizarStatusCompra = async (req, res) => {
    try {
        const { id_compra } = req.params;
        const { status } = req.body;

        await db.query(
            `UPDATE compras
             SET status = ?
             WHERE id_compra = ?`,
            [status, id_compra]
        );

        res.status(200).json({
            mensagem: "Status da compra atualizado com sucesso"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao atualizar status da compra"
        });
    }
};

module.exports = {
    listarProdutos,
    criarProduto,
    editarProduto,
    excluirProduto,
    criarVenda,
    registrarVenda,
    realizarVenda,
    login,
    realizarCompra,
    listarCompras,
    atualizarStatusCompra
};