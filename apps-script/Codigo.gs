
function importarCurriculos() {
  const ID_PASTA = "obterIdPastaBancoTalentos_()";
  const NOME_ABA = "Página1";
  const NOME_ETIQUETA = "CURRICULO_PROCESSADO_V2";

  const pastaPrincipal = DriveApp.getFolderById(ID_PASTA);
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(NOME_ABA);

  if (!aba) {
    throw new Error("A aba Página1 não foi encontrada.");
  }

  // Garantir cabeçalhos das novas colunas
  const cabecalhos = [
    "Área principal",
    "Resumo profissional",
    "Justificativa",
    "Status da análise"
  ];

  cabecalhos.forEach((titulo, indice) => {
    const celula = aba.getRange(1, indice + 6);

    if (!celula.getValue()) {
      celula.setValue(titulo);
    }
  });

  // Criar ou localizar as pastas das áreas
  const areas = [
    "Atendimento e vendas",
    "Estoque e logística",
    "Administrativo",
    "Liderança e supervisão",
    "Marketing e comunicação",
    "Cadastro"
  ];

  const pastasAreas = {};

  areas.forEach(area => {
    pastasAreas[area] = obterOuCriarPastaArea_(
      pastaPrincipal,
      area
    );
  });

  // Etiqueta do Gmail
  let etiqueta = GmailApp.getUserLabelByName(NOME_ETIQUETA);

  if (!etiqueta) {
    etiqueta = GmailApp.createLabel(NOME_ETIQUETA);
  }

  const conversas = GmailApp.search(
    "in:anywhere {in:inbox in:sent} has:attachment -label:" +
    NOME_ETIQUETA,
    0,
    50
  );

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  const assuntosValidos = [
    "curriculo",
    "curriculum",
    "curriculum vitae",
    "cv",
    "candidatura",
    "candidatura espontanea",
    "envio de curriculo",
    "envio de cv"
  ];

  const expressoes = [
    "segue meu curriculo",
    "encaminho meu curriculo",
    "envio meu curriculo",
    "curriculo em anexo",
    "meu cv em anexo",
    "anexo meu curriculo",
    "gostaria de me candidatar",
    "tenho interesse na vaga",
    "tenho interesse na oportunidade",
    "participar do processo seletivo",
    "estou me candidatando",
    "busco uma oportunidade",
    "em busca de uma oportunidade",
    "para futuras oportunidades",
    "candidatura para a vaga",
    "me coloco a disposicao",
    "segue em anexo meu",
    "encaminho em anexo meu"
  ];

  const palavrasProfissionais = [
    "curriculo",
    "curriculum",
    "candidatura",
    "candidato",
    "candidata",
    "processo seletivo",
    "vaga",
    "oportunidade",
    "emprego",
    "recrutamento",
    "experiencia profissional",
    "historico profissional",
    "perfil profissional",
    "estagio",
    "atendimento",
    "estoque",
    "administrativo"
  ];

  const formatos = ["pdf", "doc", "docx"];

  conversas.forEach(conversa => {
    let encontrouCurriculo = false;

    conversa.getMessages().forEach(mensagem => {
      const assunto = normalizar(mensagem.getSubject());
      const corpo = normalizar(mensagem.getPlainBody());

      const anexos = mensagem.getAttachments({
        includeInlineImages: false
      });

      anexos.forEach(anexo => {
        const nome = normalizar(anexo.getName());
        const extensao = nome.split(".").pop();

        if (!formatos.includes(extensao)) return;

        const assuntoValido = assuntosValidos.some(p =>
          assunto.includes(p)
        );

        const expressaoValida = expressoes.some(p =>
          corpo.includes(p)
        );

        const nomeValido = [
          "curriculo",
          "curriculum",
          "cv"
        ].some(p => nome.includes(p));

        const quantidadeTermos = palavrasProfissionais.filter(p =>
          corpo.includes(p)
        ).length;

        const pareceCurriculo =
          assuntoValido ||
          expressaoValida ||
          nomeValido ||
          quantidadeTermos >= 2;

        if (!pareceCurriculo) return;

        // Salvar o arquivo inicialmente na pasta principal
        const arquivo = pastaPrincipal.createFile(
          anexo.copyBlob()
        );

        encontrouCurriculo = true;

        let areaPrincipal = "";
        let resumo = "";
        let justificativa = "";
        let status = "";

        try {
          if (extensao !== "pdf") {
            status = "Pendente: formato DOC/DOCX ainda não integrado.";
          } else {
            // Analisar o currículo com Gemini
            const analise = analisarCurriculoPDF_(arquivo);

            areaPrincipal = analise.area_principal;
            resumo = analise.resumo_profissional || "";
            justificativa = analise.justificativa || "";

            // Mover para a pasta da área principal
            const pastaDestino = pastasAreas[areaPrincipal];

            if (!pastaDestino) {
              throw new Error(
                "Área principal retornada pelo Gemini é inválida."
              );
            }

            arquivo.moveTo(pastaDestino);

            status = "Analisado e organizado";
          }

        } catch (erro) {
          status = "Erro na análise: " + erro.message;

          Logger.log(
            "Erro ao analisar " +
            arquivo.getName() +
            ": " +
            erro.message
          );
        }

        // Registrar tudo na planilha
        aba.appendRow([
          mensagem.getDate(),
          mensagem.getFrom(),
          mensagem.getSubject(),
          arquivo.getName(),
          arquivo.getUrl(),
          areaPrincipal,
          resumo,
          justificativa,
          status
        ]);

        Logger.log(
          "Currículo processado: " +
          arquivo.getName() +
          " | Área: " +
          (areaPrincipal || "Não definida") +
          " | Status: " +
          status
        );
      });
    });

    if (encontrouCurriculo) {
      conversa.addLabel(etiqueta);
    }
  });

  Logger.log("Importação e organização concluídas.");
}

// TESTE DE CONEXÃO COM GEMINI

function testarConexaoGemini() {
  const chave = PropertiesService
    .getScriptProperties()
    .getProperty("GEMINI_API_KEY");

  if (!chave) {
    throw new Error("Chave GEMINI_API_KEY não encontrada.");
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

  const payload = {
    contents: [{
      parts: [{
        text: "Responda apenas: CONEXÃO COM GEMINI REALIZADA COM SUCESSO."
      }]
    }]
  };

  const resposta = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-goog-api-key": chave
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const codigo = resposta.getResponseCode();

  if (codigo !== 200) {
    throw new Error(
      "Erro na API (" + codigo + "): " +
      resposta.getContentText()
    );
  }

  const dados = JSON.parse(resposta.getContentText());
  const texto = dados.candidates[0].content.parts[0].text;

  Logger.log(texto);
}


// LISTAR MODELOS DISPONÍVEIS

function testarLeituraCurriculo() {

  const ID_PASTA = "obterIdPastaBancoTalentos_()";

  const CHAVE = PropertiesService
    .getScriptProperties()
    .getProperty("GEMINI_API_KEY");

  if (!CHAVE) {
    throw new Error("Chave do Gemini não encontrada.");
  }

  // Localizar o PDF mais recentemente atualizado
  const pasta = DriveApp.getFolderById(ID_PASTA);
  const arquivos = pasta.getFilesByType(MimeType.PDF);

  let arquivoEscolhido = null;

  while (arquivos.hasNext()) {
    const arquivo = arquivos.next();

    if (
      !arquivoEscolhido ||
      arquivo.getLastUpdated() > arquivoEscolhido.getLastUpdated()
    ) {
      arquivoEscolhido = arquivo;
    }
  }

  if (!arquivoEscolhido) {
    throw new Error("Nenhum PDF encontrado na pasta.");
  }

  const blob = arquivoEscolhido.getBlob();
  const bytes = blob.getBytes();

  if (bytes.length > 15 * 1024 * 1024) {
    throw new Error("O PDF ultrapassa 15 MB.");
  }

  Logger.log("Arquivo selecionado: " + arquivoEscolhido.getName());

  const prompt = `
Você é um assistente de análise curricular do RH da EPIC ONE.

Leia o currículo e extraia somente informações profissionais
efetivamente presentes no documento.

ÁREAS:
- Atendimento e vendas
- Estoque e logística
- Administrativo
- Liderança e supervisão
- Marketing e comunicação
- Cadastro

REGRAS:
- Um candidato pode pertencer a mais de uma área.
- Considere experiências, atividades, formação e competências.
- Não invente informações.
- Não utilize idade, gênero, raça, religião, deficiência
  ou fotografia para classificar.
- Não elimine nem reprove candidatos.
- Use Cadastro quando não houver evidências suficientes
  para as demais áreas.
- Justifique cada classificação.
- Não atribua notas numéricas.

Retorne somente JSON válido:

{
  "nome": "Nome identificado ou Não identificado",
  "resumo_profissional": "Resumo do perfil",
  "experiencias": [],
  "formacao": [],
  "competencias": [],
  "classificacoes": [
    {
      "area": "Atendimento e vendas",
      "aderencia": "Alta",
      "justificativa": "Evidências do currículo"
    }
  ],
  "informacoes_ausentes": []
}
`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: "application/pdf",
            data: Utilities.base64Encode(bytes)
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  // Modelos atuais disponíveis na lista da sua API
  const modelos = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite"
  ];

  let resposta = null;
  let modeloUtilizado = null;

  for (const modelo of modelos) {

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      modelo + ":generateContent";

    Logger.log("Testando modelo: " + modelo);

    for (let tentativa = 1; tentativa <= 3; tentativa++) {

      resposta = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        headers: {
          "x-goog-api-key": CHAVE
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const codigo = resposta.getResponseCode();

      if (codigo === 200) {
        modeloUtilizado = modelo;
        break;
      }

      Logger.log(
        "Modelo " + modelo +
        " retornou erro " + codigo +
        ": " + resposta.getContentText()
      );

      // Se o modelo não estiver disponível, tenta o próximo
      if (codigo === 404) {
        break;
      }

      // Outros erros que justificam nova tentativa
      if (
        codigo !== 503 &&
        codigo !== 429 &&
        codigo !== 500
      ) {
        throw new Error(
          "Erro na API (" + codigo + "): " +
          resposta.getContentText()
        );
      }

      if (tentativa < 3) {
        Utilities.sleep(3000 * tentativa);
      }
    }

    if (modeloUtilizado) {
      break;
    }
  }

  if (!modeloUtilizado) {
    throw new Error(
      "Nenhum modelo conseguiu processar o currículo. " +
      "Confira os registros de execução para identificar o erro."
    );
  }

  // Interpretar resposta
  const dados = JSON.parse(resposta.getContentText());

  if (
    !dados.candidates ||
    !dados.candidates[0] ||
    !dados.candidates[0].content
  ) {
    throw new Error("O Gemini não retornou uma análise válida.");
  }

  const texto = dados.candidates[0].content.parts
    .map(parte => parte.text || "")
    .join("");

  const analise = JSON.parse(texto);

  Logger.log("==================================");
  Logger.log("MODELO UTILIZADO: " + modeloUtilizado);
  Logger.log("ANÁLISE DO CURRÍCULO:");
  Logger.log(JSON.stringify(analise, null, 2));
  Logger.log("==================================");

  Logger.log("Arquivo: " + arquivoEscolhido.getName());
  Logger.log("Link: " + arquivoEscolhido.getUrl());
}

// LOCALIZAR OU CRIAR PASTA DE UMA ÁREA

function obterOuCriarPastaArea_(pastaPrincipal, nomeArea) {
  const pastas = pastaPrincipal.getFoldersByName(nomeArea);

  if (pastas.hasNext()) {
    return pastas.next();
  }

  return pastaPrincipal.createFolder(nomeArea);
}


// ANALISAR CURRÍCULO PDF COM GEMINI

function analisarCurriculoPDF_(arquivo) {
  const CHAVE = PropertiesService
    .getScriptProperties()
    .getProperty("GEMINI_API_KEY");

  if (!CHAVE) {
    throw new Error("Chave GEMINI_API_KEY não encontrada.");
  }

  const bytes = arquivo.getBlob().getBytes();

  if (bytes.length > 15 * 1024 * 1024) {
    throw new Error("O PDF ultrapassa o limite de 15 MB.");
  }

  const prompt = `
Você é um assistente de organização de currículos do RH da EPIC ONE.

Analise o currículo e identifique a melhor área profissional
para encaminhamento do candidato ao banco de talentos.

AS SEIS ÁREAS DISPONÍVEIS:

1. Atendimento e vendas
2. Estoque e logística
3. Administrativo
4. Liderança e supervisão
5. Marketing e comunicação
6. Cadastro

REGRAS DE CLASSIFICAÇÃO:

- Escolha obrigatoriamente APENAS UMA área principal.
- Considere principalmente experiências profissionais anteriores,
  atividades realizadas, responsabilidades e competências.
- Considere formação e objetivo profissional como informações
  complementares.
- Não escolha uma área apenas porque ela aparece no objetivo
  profissional do currículo, sem evidências que a sustentem.
- Quando houver experiência em várias áreas, escolha aquela
  com maior aderência ao conjunto do histórico profissional.
- Não utilize idade, gênero, raça, religião, deficiência,
  fotografia ou qualquer característica protegida.
- Não invente experiências ou competências.
- Não elimine nem reprove candidatos.
- Se não houver evidências suficientes para as outras cinco áreas,
  escolha Cadastro.

Retorne SOMENTE um JSON válido, seguindo exatamente esta estrutura:

{
  "nome": "Nome identificado ou Não identificado",
  "area_principal": "Uma das seis áreas disponíveis",
  "resumo_profissional": "Resumo objetivo da trajetória profissional",
  "justificativa": "Explique por que esta é a área principal escolhida"
}

Não escreva explicações fora do JSON.
`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: "application/pdf",
            data: Utilities.base64Encode(bytes)
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  const modelos = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite"
  ];

  let resposta = null;
  let modeloUtilizado = null;

  for (const modelo of modelos) {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      modelo +
      ":generateContent";

    Logger.log("Analisando com: " + modelo);

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      resposta = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        headers: {
          "x-goog-api-key": CHAVE
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const codigo = resposta.getResponseCode();

      if (codigo === 200) {
        modeloUtilizado = modelo;
        break;
      }

      Logger.log(
        "Erro " + codigo +
        " no modelo " + modelo +
        ": " + resposta.getContentText()
      );

      if (codigo === 404) {
        break;
      }

      if (
        codigo !== 503 &&
        codigo !== 429 &&
        codigo !== 500
      ) {
        throw new Error(
          "Erro na API Gemini (" +
          codigo +
          "): " +
          resposta.getContentText()
        );
      }

      if (tentativa < 3) {
        Utilities.sleep(3000 * tentativa);
      }
    }

    if (modeloUtilizado) {
      break;
    }
  }

  if (!modeloUtilizado) {
    throw new Error(
      "Os modelos Gemini não conseguiram analisar o currículo."
    );
  }

  const dados = JSON.parse(resposta.getContentText());

  if (
    !dados.candidates ||
    !dados.candidates[0] ||
    !dados.candidates[0].content
  ) {
    throw new Error(
      "O Gemini não retornou uma análise válida."
    );
  }

  const texto = dados.candidates[0].content.parts
    .map(parte => parte.text || "")
    .join("");

  const analise = JSON.parse(texto);

  const areasPermitidas = [
    "Atendimento e vendas",
    "Estoque e logística",
    "Administrativo",
    "Liderança e supervisão",
    "Marketing e comunicação",
    "Cadastro"
  ];

  if (!areasPermitidas.includes(analise.area_principal)) {
    throw new Error(
      "O Gemini retornou uma área principal inválida: " +
      analise.area_principal
    );
  }

  Logger.log(
    "Modelo utilizado: " + modeloUtilizado
  );

  Logger.log(
    "Área principal: " + analise.area_principal
  );

  return analise;
}

function processarCurriculosAvulsos() {

  const ID_PASTA = "obterIdPastaBancoTalentos_()";
  const NOME_ABA = "Página1";
  const LIMITE_POR_EXECUCAO = 5;

  const pastaPrincipal = DriveApp.getFolderById(ID_PASTA);
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(NOME_ABA);

  if (!aba) {
    throw new Error("A aba Página1 não foi encontrada.");
  }

  // Garantir cabeçalhos
  const cabecalhos = [
    "Área principal",
    "Resumo profissional",
    "Justificativa",
    "Status da análise"
  ];

  cabecalhos.forEach((titulo, indice) => {
    const celula = aba.getRange(1, indice + 6);

    if (!celula.getValue()) {
      celula.setValue(titulo);
    }
  });

  // Criar ou localizar as pastas das áreas
  const areas = [
    "Atendimento e vendas",
    "Estoque e logística",
    "Administrativo",
    "Liderança e supervisão",
    "Marketing e comunicação",
    "Cadastro"
  ];

  const pastasAreas = {};

  areas.forEach(area => {
    pastasAreas[area] = obterOuCriarPastaArea_(
      pastaPrincipal,
      area
    );
  });

  // Localizar PDFs diretamente na pasta principal
  const arquivos = pastaPrincipal.getFilesByType(MimeType.PDF);
  const fila = [];

  while (arquivos.hasNext()) {
    fila.push(arquivos.next());
  }

  Logger.log("PDFs avulsos encontrados: " + fila.length);

  let processados = 0;
  let erros = 0;

  for (
    let i = 0;
    i < fila.length && processados < LIMITE_POR_EXECUCAO;
    i++
  ) {

    const arquivo = fila[i];

    Logger.log("Iniciando: " + arquivo.getName());

    try {

      // Analisar currículo
      const analise = analisarCurriculoPDF_(arquivo);

      const area = analise.area_principal;
      const pastaDestino = pastasAreas[area];

      if (!pastaDestino) {
        throw new Error("Área de destino inválida: " + area);
      }

      // Mover arquivo para a pasta correspondente
      arquivo.moveTo(pastaDestino);

      const link = arquivo.getUrl();
      const idArquivo = arquivo.getId();

      // Verificar se já existe na planilha
      const ultimaLinha = aba.getLastRow();
      let linhaExistente = 0;

      if (ultimaLinha >= 2) {
        const links = aba
          .getRange(2, 5, ultimaLinha - 1, 1)
          .getValues();

        for (let j = 0; j < links.length; j++) {
          if (
            String(links[j][0]).includes(idArquivo)
          ) {
            linhaExistente = j + 2;
            break;
          }
        }
      }

      const dadosNovos = [
        area,
        analise.resumo_profissional || "",
        analise.justificativa || "",
        "Analisado e organizado"
      ];

      if (linhaExistente > 0) {

        // Atualizar registro existente
        aba.getRange(linhaExistente, 6, 1, 4)
          .setValues([dadosNovos]);

      } else {

        // Criar novo registro
        aba.appendRow([
          arquivo.getDateCreated(),
          "Importação manual do Drive",
          "Currículo já existente",
          arquivo.getName(),
          link,
          ...dadosNovos
        ]);
      }

      processados++;

      Logger.log(
        "SUCESSO: " + arquivo.getName() +
        " | Área: " + area
      );

    } catch (erro) {

      erros++;

      Logger.log(
        "ERRO em " + arquivo.getName() +
        ": " + erro.message
      );

      // O arquivo permanece na pasta principal
      // para permitir uma nova tentativa.
    }
  }

  Logger.log("==============================");
  Logger.log("VARREDURA CONCLUÍDA");
  Logger.log("Processados: " + processados);
  Logger.log("Erros: " + erros);
  Logger.log(
    "Restantes na pasta principal: " +
    Math.max(0, fila.length - processados - erros)
  );
  Logger.log("==============================");
}

// CONFIGURAÇÃO SEGURA: ID DA PASTA NO SCRIPT PROPERTIES
function obterIdPastaBancoTalentos_() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty("ID_PASTA_BANCO_TALENTOS");

  if (!id) {
    throw new Error(
      "Configure ID_PASTA_BANCO_TALENTOS nas Propriedades do script."
    );
  }

  return id;
}
