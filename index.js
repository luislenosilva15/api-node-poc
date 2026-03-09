import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("", (req, res) => {
  res.send("API is running");
});

/**
 * GET /users?page=1&limit=10
 * Paginação
 */
app.get("/users", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.user.count(),
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

/**
 * GET /users/:id
 * Buscar usuário único
 */
app.get("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

/**
 * POST /users
 * Criar usuário
 */
app.post("/users", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const user = await prisma.user.create({
      data: { name, email, phone },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

/**
 * PUT /users/:id
 * Editar usuário
 */
app.put("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
      },
    });

    res.json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

/**
 * DELETE /users/:id
 * Deletar usuário
 */
app.delete("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const userExists = await prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

// ========== PRODUCTS CRUD ==========

/**
 * GET /products?page=1&limit=10
 * Listar produtos com paginação
 */
app.get("/products", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.product.count(),
    ]);

    res.json({
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
});

/**
 * GET /products/:id
 * Buscar produto único
 */
app.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

/**
 * POST /products
 * Criar produto
 */
app.post("/products", async (req, res) => {
  try {
    const { name, description, price, createdById } = req.body;

    if (!name || price === undefined || !createdById) {
      return res.status(400).json({
        error: "Nome, preço e createdById são obrigatórios",
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: createdById },
    });

    if (!userExists) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    const product = await prisma.product.create({
      data: { name, description, price, createdById },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

/**
 * PUT /products/:id
 * Editar produto
 */
app.put("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, price } = req.body;

    const productExists = await prisma.product.findUnique({
      where: { id },
    });

    if (!productExists) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

/**
 * DELETE /products/:id
 * Deletar produto
 */
app.delete("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const productExists = await prisma.product.findUnique({
      where: { id },
    });

    if (!productExists) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
