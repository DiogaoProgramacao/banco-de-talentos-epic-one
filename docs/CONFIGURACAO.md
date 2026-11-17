# Configuração do Google Apps Script

No editor do Apps Script, abra **Configurações do projeto > Propriedades do script** e configure:

| Propriedade | Valor |
|---|---|
| `ID_PASTA_BANCO_TALENTOS` | ID da pasta principal do Banco de Talentos no Drive |
| `GEMINI_API_KEY` | Chave atual da API Gemini (temporária, enquanto a migração não for concluída) |

O código versionado lê o ID da pasta pela propriedade `ID_PASTA_BANCO_TALENTOS`; o identificador operacional não fica exposto no GitHub.

## Cuidados

- Nunca inserir chaves de API no código ou no Git.
- Não enviar currículos, planilhas reais ou dados pessoais para este repositório.
- A propriedade `OPENAI_API_KEY` só será necessária quando a integração OpenAI for implementada e validada.
- A API OpenAI tem cobrança separada da assinatura ChatGPT.
- Antes de enviar currículos a um fornecedor externo, confirmar autorização da empresa, finalidade, retenção e condições de tratamento de dados.

## Compatibilidade

Este commit registra a versão atual baseada em Gemini. Ele ainda não migra chamadas para OpenAI. A migração será feita isoladamente após validação do modelo, formato de entrada PDF, custo e tratamento de erros.
