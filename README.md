# Duu Jato

Sistema de agendamento para lava-jato. Clientes escolhem serviço, veículo, data e horário; a equipe acompanha os pedidos, confirma, conclui ou cancela pelo painel `/admin`.

## Executar localmente

Requer Node.js 22.13+ e pnpm. Instale com `pnpm install` e execute `pnpm dev`. Para produção, use `pnpm build` e um ambiente Cloudflare Workers com D1. A tabela é criada pelas migrações em `drizzle/`; configure o binding `DB` e a variável de ambiente `ADMIN_EMAIL` com o e-mail da conta autorizada. O login administrativo usa a identidade encaminhada pela plataforma Sites, validada no servidor. Consulte a documentação do ambiente para autenticação ao hospedar fora do Sites.

## Operação

1. Entre em `/admin` com a conta autorizada.
2. Cadastre serviços, duração e preço opcional. Serviços desativados deixam de aparecer no agendamento.
3. Compartilhe a página principal com clientes após liberar o acesso público na hospedagem.
4. Agendamentos novos ficam como **Aguardando** até a confirmação. O cancelamento libera o horário.

Expediente inicial: 08:00–18:00, horários a cada 30 minutos, uma vaga simultânea. Datas podem ser agendadas com até 90 dias de antecedência. O sistema não cobra pagamentos; valores em branco aparecem como “Valor a confirmar”. Ajuste expediente e capacidade em `lib/booking.ts` e rotas de disponibilidade/reserva antes de operar com várias baias.

## Segurança e dados

O painel exige autenticação e confere o e-mail `ADMIN_EMAIL` no servidor. Nunca inclua essa variável, credenciais ou dados de clientes no GitHub. O banco D1 guarda nome, telefone, veículo, placa e horário para a operação do agendamento.
