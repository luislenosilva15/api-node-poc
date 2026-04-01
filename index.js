import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_jwt_2024";

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("", (req, res) => {
  res.send("API is running");
});

/**
 * POST /login
 * Autenticação com JWT
 */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

/**
 * GET /me
 * Retorna o usuário autenticado baseado no token JWT
 */
app.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token inválido" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

/**
 * GET /users?page=1&limit=10&name=busca
 * Paginação com filtro por nome
 */
app.get("/users", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const name = req.query.name;

    const where = name ? { name: { contains: name, mode: "insensitive" } } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          products: true,
        },
      }),
      prisma.user.count({ where }),
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

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
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
    const { name, email, phone, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : "$2b$10$J3fpIP83PX3b5G181mZy6OCM6kI.udUbP705dAFEgSxwWuga7/dPC"; // default: 20113011

    const user = await prisma.user.create({
      data: { name, email, phone, password: hashedPassword },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
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
 * GET /products?page=1&limit=10&name=busca
 * Listar produtos com paginação e filtro por nome
 */
app.get("/products", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const name = req.query.name;

    const where = name ? { name: { contains: name, mode: "insensitive" } } : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.product.count({ where }),
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

// ========== POSTS CRUD ==========

/**
 * GET /posts?page=1&limit=10&name=busca&category=categoria
 * Listar posts com paginação
 */
app.get("/posts", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const name = req.query.name;
    const category = req.query.category;

    const where = {
      ...(name && { name: { contains: name, mode: "insensitive" } }),
      ...(category && { category: { contains: category, mode: "insensitive" } }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { likes: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar posts" });
  }
});

/**
 * GET /posts/:id
 * Buscar post único
 */
app.get("/posts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { likes: true } },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar post" });
  }
});

/**
 * POST /posts
 * Criar post — multipart/form-data
 * Campos: name, category, price, userId + imagem opcional no campo "image"
 */
app.post("/posts", upload.single("image"), async (req, res) => {
  try {
    const { name, category, price, userId } = req.body;

    if (!name || !category || price === undefined || !userId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: "name, category, price e userId são obrigatórios",
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!userExists) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const post = await prisma.post.create({
      data: {
        name,
        category,
        price: parseFloat(price),
        userId: Number(userId),
        image: imageUrl,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { likes: true } },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error(error);
    res.status(500).json({ error: "Erro ao criar post" });
  }
});

/**
 * PUT /posts/:id
 * Editar post — multipart/form-data ou JSON
 * Todos os campos são opcionais. Envie "image" como arquivo para trocar a imagem.
 */
app.put("/posts/:id", upload.single("image"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, category, price } = req.body;

    const postExists = await prisma.post.findUnique({ where: { id } });

    if (!postExists) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Post não encontrado" });
    }

    let imageUrl = undefined;
    if (req.file) {
      if (postExists.image) {
        const oldPath = path.join(__dirname, postExists.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(imageUrl !== undefined && { image: imageUrl }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { likes: true } },
      },
    });

    res.json(post);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar post" });
  }
});

/**
 * DELETE /posts/:id
 * Deletar post
 */
app.delete("/posts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const postExists = await prisma.post.findUnique({ where: { id } });

    if (!postExists) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    if (postExists.image) {
      const imgPath = path.join(__dirname, postExists.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await prisma.postLike.deleteMany({ where: { postId: id } });
    await prisma.post.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar post" });
  }
});

/**
 * POST /posts/:id/like
 * Toggle like — adiciona se não existir, remove se já existir
 * Body: { userId }
 */
app.post("/posts/:id/like", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId é obrigatório" });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: Number(userId) } },
    });

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({
        data: { postId, userId: Number(userId) },
      });
    }

    const likeCount = await prisma.postLike.count({ where: { postId } });

    res.json({ liked: !existing, likeCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao processar like" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
