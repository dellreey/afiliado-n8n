# ⚡ Executar Schema SQL - Passo a Passo

## 🔧 IMPORTANTE: Versão Corrigida

O schema foi **atualizado** para funcionar com PostgreSQL do Railway (sem dependências do Supabase).

Se você recebeu erro `auth does not exist`, é porque estava usando a versão antiga. Use a nova versão! ✅

---

## 📍 Método 1: PostgreSQL Data (pgAdmin) - RECOMENDADO ✅

Se você tá usando **PostgreSQL Data** no Railway:

1. Abra **PostgreSQL Data** → **Query**
2. Cole todo o conteúdo de `/migrations/001_create_schema.sql`
3. Execute (Cmd+Enter ou clique Execute)
4. Pronto! ✅

---

## 📍 Método 2: Via Terminal (CLI)

### Passo 1: Obter credenciais

Railway Dashboard → **Postgres (WORKFLOW)** → **Variables**

Copie:
- `PGHOST`: `postgres.railway.internal`
- `PGPORT`: (geralmente `5432`)
- `PGUSER`: `postgres`
- `PGPASSWORD`: (clique 👁️ para revelar)
- `PGDATABASE`: `postgres` (ou seu banco)

### Passo 2: Rodar o script

```bash
PGPASSWORD='sua_senha_aqui' psql \
  -h postgres.railway.internal \
  -U postgres \
  -d postgres \
  -f ./migrations/001_create_schema.sql
```

Ou crie um arquivo `.env.local`:

```bash
export PGHOST="postgres.railway.internal"
export PGPORT="5432"
export PGUSER="postgres"
export PGPASSWORD="copie_aqui"
export PGDATABASE="postgres"
```

Depois:

```bash
source .env.local
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f ./migrations/001_create_schema.sql
```

---

## ✅ Verificar se funcionou

Conecte ao banco:

```bash
psql -h postgres.railway.internal -U postgres -d postgres
```

No prompt `postgres=>`, rode:

```sql
-- Ver todas as tabelas
\dt

-- Ver as 3 views
\dv

-- Ver dados iniciais
SELECT * FROM instancias;
SELECT * FROM grupos;
SELECT * FROM configuracoes LIMIT 3;
```

**Expected output:**

```
                List of relations
 Schema |       Name       | Type  |  Owner
--------+------------------+-------+----------
 public | cliques          | table | postgres
 public | comissoes        | table | postgres
 public | configuracoes    | table | postgres
 public | envios           | table | postgres
 public | grupos           | table | postgres
 public | instancias       | table | postgres
 public | log_saude        | table | postgres
 public | ofertas          | table | postgres
(8 rows)
```

---

## 🎉 Depois de executado

1. ✅ Banco pronto!
2. Próximos passos:
   - Criar **Shared Variables** no Railway
   - Integrar **ofertas-api** para CRUD
   - Conectar **n8n** workflow
   - Dashboard lê de `vw_kpis` em tempo real

---

## 🚨 Troubleshooting

### "ERROR: auth does not exist"
→ Você tá usando a versão antiga! Atualize `/migrations/001_create_schema.sql` (versão corrigida já está no repo)

### "FATAL: password authentication failed"
→ Verifique a senha em Railway Dashboard → Postgres → Variables

### "ERROR: relation 'public.ofertas' already exists"
→ O schema já foi executado! Pode rodar de novo (usa `IF NOT EXISTS`)

### "psql: command not found"
→ Instale PostgreSQL client:
```bash
brew install postgresql@17  # macOS
apt install postgresql-client  # Linux
```


