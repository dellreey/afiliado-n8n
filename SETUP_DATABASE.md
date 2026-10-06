# 🗄️ Setup do Banco de Dados - Postgres WORKFLOW

## Opção 1: Executar via Railway Dashboard (Recomendado)

1. Acesse seu projeto no Railway: https://railway.com/project/8bb0983f-0c3f-4e06-8ec5-07a488590065
2. Clique no serviço **Postgres** (WORKFLOW)
3. Vá para a aba **Query** no painel da direita
4. Copie todo o conteúdo do arquivo `/migrations/001_create_schema.sql`
5. Cole no editor SQL e clique **Execute**

## Opção 2: Conectar via psql local

### Pré-requisitos
- PostgreSQL client instalado (`brew install postgresql@17` no macOS, ou `apt-get install postgresql-client` no Linux)

### Passos

1. **Obter credenciais do Postgres WORKFLOW**
   - Dashboard → Postgres (WORKFLOW) → Variables
   - Anote os valores:
     - `PGHOST`: postgres.railway.internal (ou IP do Railway na rede privada)
     - `PGPORT`: (padrão 5432)
     - `PGUSER`: postgres
     - `PGPASSWORD`: (copie da aba Variables)
     - `PGDATABASE`: postgres (ou o banco que você quer usar)

2. **Executar o SQL**
```bash
PGPASSWORD='YOUR_PASSWORD' psql \
  -h postgres.railway.internal \
  -U postgres \
  -d postgres \
  -f ./migrations/001_create_schema.sql
```

Ou crie um arquivo `.env`:
```bash
export PGHOST="postgres.railway.internal"
export PGPORT="5432"
export PGUSER="postgres"
export PGPASSWORD="seu_password_aqui"
export PGDATABASE="postgres"
```

Depois rode:
```bash
source .env
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f ./migrations/001_create_schema.sql
```

## ✅ Verificar se funcionou

Conecte ao banco e rode:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Você deve ver:
- `ofertas`
- `instancias`
- `grupos`
- `envios`
- `comissoes`
- `cliques`
- `log_saude`
- `configuracoes`

Pronto! Seu schema está rodando no Railway. 🎉

