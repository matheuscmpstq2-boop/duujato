# Duu Jato na Vercel

Esta branch roda Next.js na Vercel e usa um projeto Supabase separado para Postgres e autenticação. Não aponta para o banco nem o login do Site anterior.

## Preparação

1. Criar projeto Supabase exclusivo para Duu Jato; aplicar `database/vercel-schema.sql` uma vez.
2. Copiar do painel Supabase a conexão **Transaction pooler** para `DATABASE_URL`. Adicionar também `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Configurar `ADMIN_EMAIL` com o e-mail da conta principal. Guardar os valores nas variáveis da Vercel, nunca no repositório.
3. Instalar dependências com `pnpm install --frozen-lockfile` e publicar o projeto como Next.js. A página `/admin` oferece apenas login. A conta administradora existente é `luanvictorlcst12@gmail.com`. Desative novos cadastros públicos nas configurações de Auth do Supabase.
4. Cadastrar serviços e horários no painel. O banco do Site anterior não tinha registros na verificação de 25/09/2026; se houver novos registros antes da migração, exportar e migrar antes de divulgar o novo link.

As rotas de cliente continuam públicas; rotas administrativas verificam o usuário no servidor. O botão de WhatsApp prepara a mensagem, mas exige envio manual.

## Funcionários e e-mail

Apenas o administrador cadastra funcionários. Funcionários podem operar a agenda, mas não acessam o caixa, os recebimentos ou a exportação financeira, nem alteram serviços, horários ou acessos. O financeiro é exclusivo do administrador. A rota pública de cadastro foi bloqueada. Remover um funcionário revoga seu acesso imediatamente nas rotas, inclusive com sessão existente.

Para enviar automaticamente a senha inicial, configure na Vercel: `SUPABASE_SECRET_KEY` (chave secreta do projeto, somente servidor), `GMAIL_APP_PASSWORD` (senha de aplicativo de 16 caracteres da conta `luanvictorlcst12@gmail.com`) e, opcionalmente, `NEXT_PUBLIC_SITE_URL=https://duujato.vercel.app`. Sem essas configurações, o cadastro permanece desativado e informa a pendência. As senhas são geradas aleatoriamente, enviadas somente por e-mail, nunca retornadas ao painel nem gravadas em texto no banco. O funcionário pode trocar a senha na primeira entrada pela aba Trocar senha.

O envio é confirmado pelo Gmail antes de liberar o acesso. Em falhas, a conta nova sem acesso é removida. Se um e-mail já tem conta no Supabase, o cadastro retorna conflito sem alterar sua senha.

O Gmail remetente é a conta administradora. A senha de aplicativo exige verificação em duas etapas no Google; não use a senha comum da conta. Guarde as duas chaves somente nas variáveis secretas da Vercel.

Link público de agendamento: https://agendamentoduujato.vercel.app/. O painel do proprietário continua em https://duujato.vercel.app/admin. Ambos os domínios estão conectados ao mesmo projeto na Vercel; compartilham serviços, horários e agendamentos.

Na agenda, o administrador e os funcionários podem usar Novo atendimento para registrar um carro sem reserva ou uma reserva recebida diretamente. O WhatsApp é opcional. O horário respeita expediente, pausas e capacidade. O registro de pagamentos e o acesso ao caixa são exclusivos do administrador. Ao marcar Pagamento já recebido, o atendimento, a ocupação da vaga e a entrada vinculada no caixa são gravados na mesma transação; sem essa marcação, o recebimento é registrado depois. Repetir o mesmo envio após uma falha de conexão não duplica o atendimento nem o pagamento.
