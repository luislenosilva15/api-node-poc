# API Documentation

Base URL: `http://localhost:3000`

---

## Autenticação

Algumas rotas retornam dados sensíveis. O token JWT deve ser enviado no header:

```
Authorization: Bearer <token>
```

---

## Auth

### POST /login
Autentica o usuário e retorna um token JWT.

**Body (JSON):**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| email | string | sim |
| password | string | sim |

**Resposta 200:**
```json
{
  "user": {
    "id": 1,
    "name": "João",
    "email": "joao@email.com",
    "phone": null
  },
  "token": "eyJhbGci..."
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| 400 | Email e senha são obrigatórios |
| 401 | Credenciais inválidas |

---

### GET /me
Retorna o usuário autenticado com base no token JWT.

**Header:**
```
Authorization: Bearer <token>
```

**Resposta 200:**
```json
{
  "id": 1,
  "name": "João",
  "email": "joao@email.com",
  "phone": null
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| 401 | Token não fornecido |
| 401 | Token inválido |
| 401 | Token expirado |
| 404 | Usuário não encontrado |

---

## Usuários

### GET /users
Lista todos os usuários com paginação e filtro por nome.

**Query Params:**
| Param | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| page | number | 1 | Página atual |
| limit | number | 10 | Itens por página |
| name | string | - | Filtro por nome (case insensitive) |

**Resposta 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "João",
      "email": "joao@email.com",
      "phone": null,
      "products": []
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### GET /users/:id
Retorna um usuário pelo ID.

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do usuário |

**Resposta 200:**
```json
{
  "id": 1,
  "name": "João",
  "email": "joao@email.com",
  "phone": null
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| 404 | Usuário não encontrado |

---

### POST /users
Cria um novo usuário.

**Body (JSON):**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | sim | Nome completo |
| email | string | sim | Email único |
| phone | string | não | Telefone |
| password | string | não | Senha (se omitida, usa senha padrão `20113011`) |

**Resposta 201:**
```json
{
  "id": 1,
  "name": "João",
  "email": "joao@email.com",
  "phone": null
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| 400 | Nome e email são obrigatórios |
| 400 | Email já cadastrado |

---

### PUT /users/:id
Atualiza os dados de um usuário. Todos os campos são opcionais.

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do usuário |

**Body (JSON):**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | string | não |
| email | string | não |
| phone | string | não |

**Resposta 200:**
```json
{
  "id": 1,
  "name": "João Atualizado",
  "email": "joao@email.com",
  "phone": "11999999999"
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| 404 | Usuário não encontrado |
| 400 | Email já cadastrado |

---

### DELETE /users/:id
Deleta um usuário pelo ID.

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do usuário |

**Resposta:** `204 No Content`

**Erros:**
| Status | Mensagem |
|--------|----------|
| 404 | Usuário não encontrado |

---

## Produtos

### GET /products
Lista todos os produtos com paginação e filtro por nome.

**Query Params:**
| Param | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| page | number | 1 | Página atual |
| limit | number | 10 | Itens por página |
| name | string | - | Filtro por nome (case insensitive) |

**Resposta 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Produto A",
      "description": "Descrição",
      "price": 49.90,
      "createdAt": "2026-04-01T00:00:00.000Z",
      "updatedAt": "2026-04-01T00:00:00.000Z",
      "createdById": 1,
      "createdBy": {
        "id": 1,
        "name": "João",
        "email": "joao@email.com"
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### GET /products/:id
Retorna um produto pelo ID.

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do produto |

**Resposta 200:**
```json
{
  "id": 1,
  "name": "Produto A",
  "description": "Descrição",
  "price": 49.90,
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-01T00:00:00.000Z",
  "createdById": 1,
  "createdBy": {
    "id": 1,
    "name": "João",
    "email": "joao@email.com"
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| 404 | Produto não encontrado |

---

### POST /products
Cria um novo produto.

**Body (JSON):**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | sim | Nome do produto |
| description | string | não | Descrição |
| price | number | sim | Preço |
| createdById | number | sim | ID do usuário criador |

**Resposta 201:**
```json
{
  "id": 1,
  "name": "Produto A",
  "description": "Descrição",
  "price": 49.90,
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-01T00:00:00.000Z",
  "createdById": 1,
  "createdBy": {
    "id": 1,
    "name": "João",
    "email": "joao@email.com"
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| 400 | Nome, preço e createdById são obrigatórios |
| 400 | Usuário não encontrado |

---

### PUT /products/:id
Atualiza um produto. Todos os campos são opcionais.

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do produto |

**Body (JSON):**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | string | não |
| description | string | não |
| price | number | não |

**Resposta 200:** Produto atualizado (mesmo formato do GET /products/:id)

**Erros:**
| Status | Mensagem |
|--------|----------|
| 404 | Produto não encontrado |

---

### DELETE /products/:id
Deleta um produto pelo ID.

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do produto |

**Resposta:** `204 No Content`

**Erros:**
| Status | Mensagem |
|--------|----------|
| 404 | Produto não encontrado |

---

## Posts

### GET /posts
Lista todos os posts com paginação e filtros.

**Query Params:**
| Param | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| page | number | 1 | Página atual |
| limit | number | 10 | Itens por página |
| name | string | - | Filtro por nome (case insensitive) |
| category | string | - | Filtro por categoria (case insensitive) |

**Resposta 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Post Título",
      "image": "/uploads/1234567890-arquivo.jpg",
      "category": "Eletrônicos",
      "price": 99.90,
      "createdAt": "2026-04-01T00:00:00.000Z",
      "updatedAt": "2026-04-01T00:00:00.000Z",
      "userId": 1,
      "user": {
        "id": 1,
        "name": "João",
        "email": "joao@email.com"
      },
      "_count": {
        "likes": 5
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### GET /posts/:id
Retorna um post pelo ID.

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do post |

**Resposta 200:**
```json
{
  "id": 1,
  "name": "Post Título",
  "image": "/uploads/1234567890-arquivo.jpg",
  "category": "Eletrônicos",
  "price": 99.90,
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-01T00:00:00.000Z",
  "userId": 1,
  "user": {
    "id": 1,
    "name": "João",
    "email": "joao@email.com"
  },
  "_count": {
    "likes": 5
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| 404 | Post não encontrado |

---

### POST /posts
Cria um novo post. Aceita `multipart/form-data` para envio de imagem junto aos dados.

**Content-Type:** `multipart/form-data`

**Body (FormData):**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | sim | Título do post |
| category | string | sim | Categoria |
| price | number | sim | Preço |
| userId | number | sim | ID do usuário criador |
| image | file (binário) | não | Imagem do post (jpg, png, etc.) |

**Resposta 201:**
```json
{
  "id": 1,
  "name": "Post Título",
  "image": "/uploads/1234567890-arquivo.jpg",
  "category": "Eletrônicos",
  "price": 99.90,
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-01T00:00:00.000Z",
  "userId": 1,
  "user": {
    "id": 1,
    "name": "João",
    "email": "joao@email.com"
  },
  "_count": {
    "likes": 0
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| 400 | name, category, price e userId são obrigatórios |
| 400 | Usuário não encontrado |

> A URL da imagem retornada pode ser acessada diretamente via `GET /uploads/<filename>`.

---

### PUT /posts/:id
Atualiza um post. Todos os campos são opcionais. Envie `image` como arquivo para substituir a imagem atual (a antiga é deletada automaticamente).

**Content-Type:** `multipart/form-data`

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do post |

**Body (FormData):**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | não | Novo título |
| category | string | não | Nova categoria |
| price | number | não | Novo preço |
| image | file (binário) | não | Nova imagem (substitui a anterior) |

**Resposta 200:** Post atualizado (mesmo formato do GET /posts/:id)

**Erros:**
| Status | Mensagem |
|--------|----------|
| 404 | Post não encontrado |

---

### DELETE /posts/:id
Deleta um post pelo ID. Remove também a imagem do disco e todos os likes associados.

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do post |

**Resposta:** `204 No Content`

**Erros:**
| Status | Mensagem |
|--------|----------|
| 404 | Post não encontrado |

---

### POST /posts/:id/like
Alterna o like de um usuário em um post. Se já curtiu, remove o like. Se não curtiu, adiciona.

**Path Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | number | ID do post |

**Body (JSON):**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| userId | number | sim | ID do usuário que está curtindo |

**Resposta 200:**
```json
{
  "liked": true,
  "likeCount": 6
}
```

> `liked: true` → like adicionado. `liked: false` → like removido.

**Erros:**
| Status | Mensagem |
|--------|----------|
| 400 | userId é obrigatório |
| 404 | Post não encontrado |

---

## Arquivos estáticos

### GET /uploads/:filename
Acessa uma imagem de post salva no servidor.

**Exemplo:** `GET /uploads/1714500000000-123456789.jpg`

---

## Códigos de status

| Status | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 204 | Deletado com sucesso (sem body) |
| 400 | Erro de validação / dados inválidos |
| 401 | Não autenticado |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |
