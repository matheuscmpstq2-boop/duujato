# Avisos automáticos ao dono — Duu Jato

A integração usa a WhatsApp Cloud API da Meta. O código pode ser publicado sem credenciais: permanece desativado até a conexão estar pronta.

## Ativação

1. Entre no Meta for Developers e configure um aplicativo com o produto WhatsApp e uma conta WhatsApp Business Platform. O número remetente da API envia o aviso para o WhatsApp do dono; são funções distintas. Na fase de testes, a Meta oferece um remetente de teste e exige verificar os destinatários autorizados.
2. Cadastre e valide o WhatsApp do dono como destinatário. Ele precisa autorizar o recebimento dos avisos. Use o formato internacional com código do país e DDD, apenas números.
3. Crie o modelo `duujato_novo_agendamento`, em português do Brasil (`pt_BR`), com corpo e parâmetros posicionais abaixo. Não adicione cabeçalho variável ou botões, pois o código envia apenas o corpo. Solicite a aprovação à Meta na categoria aplicável ao aviso operacional; a classificação e a aprovação dependem da Meta.
4. Configure em Production na Vercel: `WHATSAPP_ACCESS_TOKEN` (token do servidor com permissão `whatsapp_business_messaging`), `WHATSAPP_PHONE_NUMBER_ID` (ID do remetente, não o telefone), `WHATSAPP_OWNER_PHONE` (WhatsApp do dono), `WHATSAPP_TEMPLATE_NAME=duujato_novo_agendamento` e `WHATSAPP_API_VERSION` (versão disponível no aplicativo Meta).
5. Após o modelo estar aprovado, configure `WHATSAPP_ENABLED=true` e publique novamente. Mantenha o token exclusivamente no servidor, nunca em uma variável `NEXT_PUBLIC_`. Use uma credencial adequada para produção; tokens temporários de teste expiram.
6. Faça um agendamento de teste autorizado e confira o recebimento no telefone do dono. A aba **Avisos WhatsApp** informa se a API aceitou o aviso. Uma resposta aceita não confirma a entrega final no aparelho.

## Corpo do modelo

```text
Novo agendamento recebido no Duu Jato.
Cliente: {{1}}
Serviço: {{2}}
Data: {{3}}
Horário: {{4}}
Veículo: {{5}}
Placa: {{6}}
Confira e confirme o atendimento no painel do proprietário.
```

Exemplos fictícios para revisão do modelo, na mesma ordem: Cliente Exemplo, Lavagem completa, 10/10/2026, 09:00, Honda Civic, ABC1D23.

## Funcionamento e recuperação

O agendamento, a ocupação da vaga e o registro do aviso são gravados na mesma transação quando o envio está ativado. A mensagem é enviada após salvar o agendamento, sem fazer o cliente esperar pela API. Falhas de envio não apagam a reserva.

O envio só funciona em `VERCEL_ENV=production`. Previews não enviam mensagens. Reservas anteriores à ativação e atendimentos manuais não geram avisos retroativos.

A aba de avisos e as rotas de consulta/reenvio são exclusivas do administrador. O destinatário vem da configuração do servidor, nunca do formulário público. A API não revela tokens. A reivindicação atômica do registro evita dois envios simultâneos do mesmo aviso.

Uma rejeição explícita da Meta permite tentar novamente pelo painel, com até três tentativas. Em caso de timeout ou retorno incerto, não há reenvio automático, porque o primeiro envio pode ter sido aceito. Confira o WhatsApp antes de solicitar verificação. Registros em estado “Envio iniciado” que persistem também precisam de verificação. Avisos de agendamentos cancelados são descartados antes de enviar.

A tabela `whatsapp_notifications` deve existir antes da ativação. Execute o script `database/whatsapp-notifications.sql` no banco usado pela aplicação. Ela tem RLS e acesso apenas pelo papel do servidor `duujato_app`; o navegador não acessa essa tabela diretamente.

A criação de contas, aprovação do modelo e cobranças pertencem à Meta. Nenhuma assinatura ou cobrança foi contratada pelo código.
