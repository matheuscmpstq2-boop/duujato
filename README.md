# Duu Jato

Sistema de agendamento para lava-jato, com página para clientes e painel protegido para o proprietário.

## O que o proprietário pode fazer

- Acompanhar pedidos, confirmar, concluir ou cancelar (cancelar libera o horário).
- Criar, editar, ocultar ou reativar serviços; definir nome, descrição, duração e preço opcional.
- Definir expediente de cada dia da semana, pausas e datas fechadas.
- Alterar nome do lava-jato, telefone, endereço e aviso exibido para clientes.
- Copiar o link da página de agendamento na aba **Link de agendamento**.
- Na conta principal, autorizar outro e-mail para administrar o painel na aba **Acessos**. A pessoa entra com uma conta ChatGPT no e-mail autorizado; não há envio automático de convite.

Acesse `/admin` para entrar. O acesso inicial usa a conta autorizada em `ADMIN_EMAIL`. Os clientes acessam `/`, sem login. A página precisa estar publicada com acesso público para o link funcionar para clientes externos.

## Regras de agenda

Fuso `America/Sao_Paulo`, uma vaga simultânea, intervalos de 30 minutos e reservas com até 90 dias de antecedência. O expediente inicial é 08:00–18:00 todos os dias até o proprietário alterá-lo. Mudanças de horário ou fechamento de datas impedem novas reservas, mas não cancelam reservas existentes; cancele-as na agenda quando necessário. Preço vazio aparece como “Valor a confirmar”. O sistema recebe solicitações, não cobra pagamentos automaticamente.

## Desenvolvimento

Node.js 22.13+ e pnpm. Execute `pnpm install`, `pnpm dev` e `pnpm build`. A aplicação usa Cloudflare Workers com binding D1 `DB`. Migrações estão em `drizzle/`. Configure `ADMIN_EMAIL` como variável de ambiente na hospedagem, nunca no código; a identidade do usuário é validada por cabeçalhos autenticados do Sites. Para hospedar fora do Sites, substitua a integração de autenticação do servidor por um provedor seguro e configure o banco.

O banco guarda nome, telefone, veículo, placa, agendamento e configurações. O painel e as APIs administrativas verificam a autorização no servidor. Não inclua credenciais nem dados de clientes no GitHub.
