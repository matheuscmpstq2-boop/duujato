# Duu Jato na Vercel

Esta branch roda Next.js na Vercel e usa um projeto Supabase separado para Postgres e autenticação. Não aponta para o banco nem o login do Site anterior.

## Preparação

1. Criar projeto Supabase exclusivo para Duu Jato; aplicar `database/vercel-schema.sql` uma vez.
2. Copiar do painel Supabase a conexão **Transaction pooler** para `DATABASE_URL`. Adicionar também `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Configurar `ADMIN_EMAIL` com o e-mail da conta principal. Guardar os valores nas variáveis da Vercel, nunca no repositório.
3. Instalar dependências com `pnpm install --frozen-lockfile` e publicar o projeto como Next.js. Na página `/admin`, criar a conta com o e-mail principal e confirmar o e-mail antes de entrar.
4. Cadastrar serviços e horários no painel. O banco do Site anterior não tinha registros na verificação de 25/09/2026; se houver novos registros antes da migração, exportar e migrar antes de divulgar o novo link.

As rotas de cliente continuam públicas; rotas administrativas verificam o usuário no servidor. O botão de WhatsApp prepara a mensagem, mas exige envio manual.
