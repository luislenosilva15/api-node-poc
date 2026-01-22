import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

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
        orderBy: { id: "asc" },
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
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const user = await prisma.user.create({
      data: { name, email },
    });

    res.status(201).json(user);
  } catch (error) {
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
    const { name, email } = req.body;

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
