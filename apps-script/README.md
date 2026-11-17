# Google Apps Script

O código de produção ainda está no editor do Google Apps Script. Esta pasta receberá os arquivos-fonte reais após a sincronização controlada com `clasp`.

## Antes de sincronizar

1. Abra o projeto Apps Script atualmente utilizado pela EPIC ONE.
2. Faça uma cópia/backup do projeto.
3. Confirme que não há chaves, tokens, currículos ou dados pessoais no código.
4. Instale e configure o Google clasp no computador.
5. Execute `clasp clone <SCRIPT_ID>` em uma pasta local segura.
6. Copie apenas os arquivos `.gs` e `.html` revisados para este repositório.
7. Não envie `.clasp.json` nem arquivos locais de credenciais ao GitHub.

## Segredos

Guardar a chave da API em Script Properties, por exemplo:

- `OPENAI_API_KEY`

Nunca colocar a chave diretamente em arquivos versionados.

## Observação

Não execute uma implantação ou substituição do projeto de produção apenas por ter sincronizado os arquivos. Primeiro validar em uma cópia de teste.
