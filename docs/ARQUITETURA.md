# Arquitetura do Banco de Talentos

## Componentes

- Gmail: origem dos currículos recebidos por e-mail.
- Google Drive: armazenamento dos arquivos e pastas por área.
- Google Sheets: registro e acompanhamento dos candidatos.
- Google Apps Script: orquestração, importação, processamento em lotes e integração HTTP.
- Provedor de IA: extração e classificação do conteúdo do currículo.

## Classificação

Cada currículo deve receber apenas uma área principal:

1. Atendimento e vendas
2. Estoque e logística
3. Administrativo
4. Liderança e supervisão
5. Marketing e comunicação
6. Cadastro

Usar Cadastro quando o conteúdo não fornecer evidência suficiente para uma classificação mais específica.

## Salvaguardas

A classificação deve considerar somente experiência, competências e conteúdo profissional relevante. Não inferir nem utilizar idade, gênero, raça, religião, deficiência, fotografia ou outras características sensíveis. A classificação não deve rejeitar candidatos automaticamente; a decisão final permanece com a equipe responsável.

## Migração do provedor de IA

A integração será substituída de forma isolada, preservando os contratos de entrada e saída usados pelo importador e pelo processador em lote. A implementação final depende da inspeção do código Apps Script atualmente em produção.
