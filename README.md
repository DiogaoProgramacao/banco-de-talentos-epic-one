# Banco de Talentos  EPIC ONE

Automação interna para importar, organizar e classificar currículos usando Google Apps Script, Gmail, Google Drive, Google Sheets e uma API de IA autorizada.

## Status

- [x] Repositório privado criado
- [x] Código atual do Apps Script versionado
- [x] Testes integrados com currículos de teste
- [ ] Rotina operacional documentada

## Fluxo previsto

1. Localizar e-mails com anexos de currículo no Gmail.
2. Salvar os arquivos na pasta do Banco de Talentos no Google Drive.
3. Analisar o currículo com o provedor de IA configurado.
4. Atribuir **uma única área principal**.
5. Mover o arquivo para a pasta da área correspondente.
6. Registrar os dados e o resultado da análise na planilha de controle.

## Áreas principais

- Atendimento e vendas
- Estoque e logística
- Administrativo
- Liderança e supervisão
- Marketing e comunicação
- Cadastro (quando não houver evidência suficiente para outra área)

## Privacidade e segurança

- Não versionar currículos, dados pessoais de candidatos, planilhas reais, IDs internos, tokens ou chaves de API.
- Armazenar segredos em **Apps Script > Configurações do projeto > Propriedades do script**.
- Usar somente dados de teste anonimizados durante desenvolvimento.
- A utilização de qualquer fornecedor externo de IA deve estar autorizada pela EPIC ONE e alinhada às regras internas de proteção de dados.

## Estrutura

- `apps-script/`: código-fonte do Google Apps Script (a ser sincronizado com o projeto existente).
- `docs/`: arquitetura, configuração e procedimentos operacionais.

## Desenvolvimento

O projeto existente deve continuar sendo a fonte operacional até a conclusão dos testes de migração. Não substituir funções de produção sem backup e validação.
