# Migração Supabase → Railway

Documenta a troca do Supabase pelo Railway e a correção do endpoint de envio (`/rest/v1/envios`).

## Problema

Depois de trocar o Supabase pelo Railway:

- Os dados (`envios`, `ofertas`, `grupos`, `instancias`) passaram a viver num **Postgres comum** (`Postgres-consulta`), que não tem API HTTP.
- O agente da Railway criou a função `ofertas-api` (Hono/Bun) apenas com `/rest/v1/ofertas` e `/health`. **Não existia `/envios`**.
- Os workflows do n8n usam a sintaxe do Supabase (`/rest/v1/...`, `eq.`, `select=` com embeds), que é exatamente a sintaxe do **PostgREST**.

## Solução

1. **PostgREST** (`postgrest/postgrest:v12.2.8`) apontando para o `Postgres-consulta`.
   - É o mesmo motor que o Supabase usa por trás, então mantém a URL/query igual.
2. **Proxy reverso** na função `ofertas-api`: aceita `/rest/v1/*` e repassa ao PostgREST interno.
   - Preserva o prefixo `/rest/v1` que os workflows já usam (zero alteração nos nós).
   - Exige `Authorization: Bearer <JWT>` ou header `apikey: <JWT>`.
3. **Variáveis no n8n**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `N8N_ENCRYPTION_KEY`.
4. **Chave de criptografia fixa** do n8n para evitar o crash `signing.hmac`.

## Serviços (projeto `striking-caring`, ambiente `production`)

| Serviço | Papel |
|---|---|
| `Postgres-consulta` | Banco do domínio (ofertas, envios, grupos, instancias, etc.) |
| `Postgres-4Wrz` | Banco interno do n8n (tabelas `workflow_entity`, etc.) |
| `postgrest` | API REST sobre o `Postgres-consulta` (porta 3000, sem domínio público) |
| `ofertas-api` | Proxy reverso `/rest/v1/*` → `http://postgrest.railway.internal:3000` |
| `n8n` | Orquestrador dos workflows |
| `dashboard-6feW` | Dashboard Next.js |
| `Redis-iKbd` | Redis |

## URLs públicas

- `https://ofertas-api-production.up.railway.app/rest/v1/...` ← usar nos workflows
- `https://n8n-production-b6133.up.railway.app`

O PostgREST **não** tem domínio público (removido por segurança); só é acessível via proxy autenticado.

## Como reproduzir

### 1. PostgREST

Serviço `postgrest`, imagem `postgrest/postgrest:v12.2.8`, porta `3000`. Variáveis em `railway/secrets.env` (ou `postgrest.env.example` com placeholders).

### 2. Proxy `ofertas-api`

Código em `railway/ofertas-api/index.ts` (Bun + Hono).

```bash
railway functions link --path railway/ofertas-api/index.ts --function ofertas-api
railway functions push --path railway/ofertas-api/index.ts
railway variable set AUTH_TOKEN=<JWT> --service ofertas-api --skip-deploys
```

### 3. n8n

```bash
railway variable set \
  SUPABASE_URL=https://ofertas-api-production.up.railway.app \
  SUPABASE_SERVICE_KEY=<JWT> \
  SUPABASE_ANON_KEY=<JWT> \
  N8N_ENCRYPTION_KEY=$(openssl rand -hex 32) \
  --service n8n --skip-deploys
railway redeploy --service n8n --yes
```

> Se trocar a `N8N_ENCRYPTION_KEY`, apague as `deployment_key` do banco do n8n (a trigger `prevent_deployment_key_delete` precisa ser desabilitada durante o DELETE).

### 4. Autenticação

O JWT em `railway/secrets.env` tem `role=postgres` e é assinado com `PGRST_JWT_SECRET` (validade ~10 anos). Os nós do n8n já enviam `apikey` e `Authorization: Bearer <chave>`, ambos aceitos pelo proxy/PostgREST.

## Teste do endpoint de envio

```bash
curl -sS \
  'https://ofertas-api-production.up.railway.app/rest/v1/envios?status=eq.agendado&agendado_para=lte.now()&select=id,mensagem_completa,oferta_id,grupo_id,ofertas(id,titulo_original,link_afiliado,imagem_url,preco_por),grupos(id,nome_grupo,whatsapp_group_id,instancias(nome))&limit=3' \
  -H "Authorization: Bearer $JWT" \
  -H "apikey: $JWT"
```

## Pendências / próximos passos

- **Migrar dados**: `Postgres-consulta` está vazio (0 ofertas/envios). Os dados antigos do Supabase precisam ser importados.
- **Ativar workflows**: os 5 workflows estão desativados no n8n.
- **EvoGO**: o workflow 04 usa `$env.EVOGO_API_URL || 'http://api:8080'` e `apikey` fixa, mas **não existe serviço EvoGO no Railway** — é o próximo gargalo para o disparo real no WhatsApp.
- As URLs antigas do Supabase (`kwiaddydbjdofcyrqglq.supabase.co`, `mplwhrejtumwuznxehyj.supabase.co`) estão mortas (NXDOMAIN) e servem apenas como fallback nos workflows.
