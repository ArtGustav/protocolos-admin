(function () {
  "use strict";

  var CHAVE_STORAGE = "protocolos_admin_v1";
  var protocolos = [];
  var idEmEdicao = null;
  var timeoutToast = null;

  var elementos = {
    formulario: document.getElementById("formProtocolo"),
    campoId: document.getElementById("protocoloId"),
    campoNumero: document.getElementById("numero"),
    campoAssunto: document.getElementById("assunto"),
    campoDescricao: document.getElementById("descricao"),
    campoSetor: document.getElementById("setor"),
    campoResponsavel: document.getElementById("responsavel"),
    campoPrioridade: document.getElementById("prioridade"),
    campoStatus: document.getElementById("status"),
    erroNumero: document.getElementById("erroNumero"),
    erroAssunto: document.getElementById("erroAssunto"),
    mensagemFormulario: document.getElementById("mensagemFormulario"),
    tituloFormulario: document.getElementById("tituloFormulario"),
    btnCancelarEdicao: document.getElementById("btnCancelarEdicao"),
    buscaTexto: document.getElementById("buscaTexto"),
    filtroStatus: document.getElementById("filtroStatus"),
    filtroPrioridade: document.getElementById("filtroPrioridade"),
    ordenacao: document.getElementById("ordenacao"),
    corpoTabela: document.getElementById("corpoTabelaProtocolos"),
    listaCards: document.getElementById("listaCards"),
    mensagemListaVazia: document.getElementById("mensagemListaVazia"),
    contadorTotal: document.getElementById("contadorTotal"),
    contadorPendentes: document.getElementById("contadorPendentes"),
    contadorAndamento: document.getElementById("contadorAndamento"),
    contadorConcluidos: document.getElementById("contadorConcluidos"),
    btnExportar: document.getElementById("btnExportar"),
    inputImportar: document.getElementById("inputImportar"),
    toast: document.getElementById("toast")
  };

  function iniciar() {
    carregarProtocolos();
    registrarEventos();
    renderizarTudo();
  }

  function carregarProtocolos() {
    try {
      var dadosBrutos = localStorage.getItem(CHAVE_STORAGE);
      if (!dadosBrutos) {
        protocolos = [];
        return;
      }

      var dados = JSON.parse(dadosBrutos);
      if (!Array.isArray(dados)) {
        protocolos = [];
        return;
      }

      protocolos = dados.filter(function (item) {
        return item && typeof item === "object";
      });
    } catch (erro) {
      protocolos = [];
      mostrarToast("Erro ao ler dados locais. A lista foi reiniciada.");
    }
  }

  function salvarProtocolos() {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(protocolos));
  }

  function registrarEventos() {
    elementos.formulario.addEventListener("submit", onEnviarFormulario);
    elementos.btnCancelarEdicao.addEventListener("click", cancelarEdicao);

    elementos.buscaTexto.addEventListener("input", renderizarTudo);
    elementos.filtroStatus.addEventListener("change", renderizarTudo);
    elementos.filtroPrioridade.addEventListener("change", renderizarTudo);
    elementos.ordenacao.addEventListener("change", renderizarTudo);

    elementos.corpoTabela.addEventListener("click", onAcaoLista);
    elementos.listaCards.addEventListener("click", onAcaoLista);

    elementos.btnExportar.addEventListener("click", exportarJson);
    elementos.inputImportar.addEventListener("change", importarJson);
  }

  function onEnviarFormulario(evento) {
    evento.preventDefault();
    limparMensagensFormulario();

    var dadosFormulario = obterDadosFormulario();
    var validacao = validarProtocolo(dadosFormulario, idEmEdicao);

    if (!validacao.valido) {
      exibirErrosFormulario(validacao.erros);
      exibirMensagemFormulario("Corrija os campos em destaque.", "erro");
      return;
    }

    if (idEmEdicao) {
      atualizarProtocolo(idEmEdicao, validacao.protocoloNormalizado);
      mostrarToast("Protocolo atualizado com sucesso.");
      exibirMensagemFormulario("Protocolo atualizado.", "sucesso");
    } else {
      criarProtocolo(validacao.protocoloNormalizado);
      mostrarToast("Protocolo cadastrado com sucesso.");
      exibirMensagemFormulario("Protocolo cadastrado.", "sucesso");
    }

    salvarProtocolos();
    renderizarTudo();
    resetarFormulario();
  }

  function obterDadosFormulario() {
    return {
      numero: (elementos.campoNumero.value || "").trim(),
      assunto: (elementos.campoAssunto.value || "").trim(),
      descricao: (elementos.campoDescricao.value || "").trim(),
      setor: (elementos.campoSetor.value || "").trim(),
      responsavel: (elementos.campoResponsavel.value || "").trim(),
      prioridade: elementos.campoPrioridade.value,
      status: elementos.campoStatus.value || "pendente"
    };
  }

  function validarProtocolo(dados, idAtual) {
    var erros = {};

    if (!dados.assunto || dados.assunto.length < 3) {
      erros.assunto = "O assunto deve ter ao menos 3 caracteres.";
    }

    var numeroFinal = dados.numero;
    if (!numeroFinal) {
      numeroFinal = gerarNumeroAutomatico();
    }

    if (!numeroFinal) {
      erros.numero = "Não foi possível gerar o número automaticamente.";
    } else if (numeroJaExiste(numeroFinal, idAtual)) {
      erros.numero = "Este número já está em uso.";
    }

    var statusValido = ["pendente", "andamento", "concluido"].indexOf(dados.status) >= 0;
    if (!statusValido) {
      dados.status = "pendente";
    }

    var prioridadeValida = ["baixa", "média", "alta"].indexOf(dados.prioridade) >= 0;
    if (!prioridadeValida) {
      dados.prioridade = "baixa";
    }

    var valido = Object.keys(erros).length === 0;

    return {
      valido: valido,
      erros: erros,
      protocoloNormalizado: {
        numero: numeroFinal,
        assunto: dados.assunto,
        descricao: dados.descricao,
        setor: dados.setor,
        responsavel: dados.responsavel,
        prioridade: dados.prioridade,
        status: dados.status
      }
    };
  }

  function numeroJaExiste(numero, idAtual) {
    var numeroNormalizado = numero.toLowerCase();
    var i = 0;

    for (i = 0; i < protocolos.length; i += 1) {
      if ((protocolos[i].numero || "").toLowerCase() === numeroNormalizado) {
        if (!idAtual || protocolos[i].id !== idAtual) {
          return true;
        }
      }
    }

    return false;
  }

  function gerarNumeroAutomatico() {
    var ano = new Date().getFullYear();
    var prefixo = "PROT-" + ano + "-";
    var maiorSequencia = 0;
    var i = 0;

    for (i = 0; i < protocolos.length; i += 1) {
      var atual = protocolos[i];
      if (!atual.numero || atual.numero.indexOf(prefixo) !== 0) {
        continue;
      }

      var parte = atual.numero.slice(prefixo.length);
      var numeroSequencia = parseInt(parte, 10);
      if (!isNaN(numeroSequencia) && numeroSequencia > maiorSequencia) {
        maiorSequencia = numeroSequencia;
      }
    }

    return prefixo + String(maiorSequencia + 1).padStart(4, "0");
  }

  function criarProtocolo(dados) {
    var agoraIso = new Date().toISOString();

    protocolos.push({
      id: gerarId(),
      numero: dados.numero,
      assunto: dados.assunto,
      descricao: dados.descricao,
      setor: dados.setor,
      responsavel: dados.responsavel,
      prioridade: dados.prioridade,
      status: dados.status || "pendente",
      criadoEm: agoraIso,
      atualizadoEm: agoraIso
    });
  }

  function atualizarProtocolo(id, dados) {
    var i = 0;
    for (i = 0; i < protocolos.length; i += 1) {
      if (protocolos[i].id === id) {
        protocolos[i].numero = dados.numero;
        protocolos[i].assunto = dados.assunto;
        protocolos[i].descricao = dados.descricao;
        protocolos[i].setor = dados.setor;
        protocolos[i].responsavel = dados.responsavel;
        protocolos[i].prioridade = dados.prioridade;
        protocolos[i].status = dados.status;
        protocolos[i].atualizadoEm = new Date().toISOString();
        return;
      }
    }
  }

  function excluirProtocolo(id) {
    var indice = buscarIndicePorId(id);
    if (indice < 0) {
      return;
    }

    protocolos.splice(indice, 1);
    salvarProtocolos();
    renderizarTudo();
    mostrarToast("Protocolo excluído.");

    if (idEmEdicao === id) {
      resetarFormulario();
    }
  }

  function avancarStatus(id) {
    var protocolo = buscarPorId(id);
    if (!protocolo) {
      return;
    }

    if (protocolo.status === "pendente") {
      protocolo.status = "andamento";
    } else if (protocolo.status === "andamento") {
      protocolo.status = "concluido";
    } else {
      protocolo.status = "concluido";
    }

    protocolo.atualizadoEm = new Date().toISOString();
    salvarProtocolos();
    renderizarTudo();
    mostrarToast("Status atualizado.");

    if (idEmEdicao === id) {
      preencherFormulario(protocolo);
    }
  }

  function voltarParaPendente(id) {
    var protocolo = buscarPorId(id);
    if (!protocolo) {
      return;
    }

    protocolo.status = "pendente";
    protocolo.atualizadoEm = new Date().toISOString();
    salvarProtocolos();
    renderizarTudo();
    mostrarToast("Protocolo marcado como pendente.");

    if (idEmEdicao === id) {
      preencherFormulario(protocolo);
    }
  }

  function prepararEdicao(id) {
    var protocolo = buscarPorId(id);
    if (!protocolo) {
      return;
    }

    idEmEdicao = protocolo.id;
    preencherFormulario(protocolo);
    elementos.tituloFormulario.textContent = "Editar protocolo";
    elementos.btnCancelarEdicao.hidden = false;
    exibirMensagemFormulario("Editando protocolo " + protocolo.numero + ".", "sucesso");
    elementos.formulario.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function preencherFormulario(protocolo) {
    elementos.campoId.value = protocolo.id;
    elementos.campoNumero.value = protocolo.numero;
    elementos.campoAssunto.value = protocolo.assunto;
    elementos.campoDescricao.value = protocolo.descricao || "";
    elementos.campoSetor.value = protocolo.setor || "";
    elementos.campoResponsavel.value = protocolo.responsavel || "";
    elementos.campoPrioridade.value = protocolo.prioridade || "baixa";
    elementos.campoStatus.value = protocolo.status || "pendente";
  }

  function cancelarEdicao() {
    resetarFormulario();
    exibirMensagemFormulario("Edição cancelada.", "sucesso");
  }

  function resetarFormulario() {
    idEmEdicao = null;
    elementos.formulario.reset();
    elementos.campoStatus.value = "pendente";
    elementos.campoPrioridade.value = "baixa";
    elementos.tituloFormulario.textContent = "Novo protocolo";
    elementos.btnCancelarEdicao.hidden = true;
    limparMensagensFormulario();
  }

  function limparMensagensFormulario() {
    elementos.erroNumero.textContent = "";
    elementos.erroAssunto.textContent = "";
    elementos.mensagemFormulario.textContent = "";
    elementos.mensagemFormulario.className = "mensagem-formulario";
  }

  function exibirErrosFormulario(erros) {
    if (erros.numero) {
      elementos.erroNumero.textContent = erros.numero;
    }
    if (erros.assunto) {
      elementos.erroAssunto.textContent = erros.assunto;
    }
  }

  function exibirMensagemFormulario(texto, tipo) {
    elementos.mensagemFormulario.textContent = texto;
    elementos.mensagemFormulario.className = "mensagem-formulario " + (tipo || "");
  }

  function filtrarEOrdenarProtocolos() {
    var busca = (elementos.buscaTexto.value || "").trim().toLowerCase();
    var status = elementos.filtroStatus.value;
    var prioridade = elementos.filtroPrioridade.value;
    var ordem = elementos.ordenacao.value;

    var itensFiltrados = protocolos.filter(function (item) {
      var correspondeBusca = true;
      var correspondeStatus = true;
      var correspondePrioridade = true;

      if (busca) {
        var baseBusca = (item.numero + " " + item.assunto + " " + (item.responsavel || "")).toLowerCase();
        correspondeBusca = baseBusca.indexOf(busca) >= 0;
      }

      if (status !== "todos") {
        correspondeStatus = item.status === status;
      }

      if (prioridade !== "todas") {
        correspondePrioridade = item.prioridade === prioridade;
      }

      return correspondeBusca && correspondeStatus && correspondePrioridade;
    });

    itensFiltrados.sort(function (a, b) {
      var dataA = new Date(a.criadoEm).getTime();
      var dataB = new Date(b.criadoEm).getTime();

      if (ordem === "antigos") {
        return dataA - dataB;
      }

      return dataB - dataA;
    });

    return itensFiltrados;
  }

  function renderizarTudo() {
    var itens = filtrarEOrdenarProtocolos();
    renderizarTabela(itens);
    renderizarCards(itens);
    renderizarContadores();
    elementos.mensagemListaVazia.hidden = itens.length > 0;
  }

  function renderizarTabela(itens) {
    if (!itens.length) {
      elementos.corpoTabela.innerHTML = "";
      return;
    }

    var linhas = itens.map(function (item) {
      return (
        "<tr data-id=\"" +
        item.id +
        "\">" +
        "<td>" +
        escaparHtml(item.numero) +
        "</td>" +
        "<td>" +
        escaparHtml(item.assunto) +
        (item.descricao ? "<br><small>" + escaparHtml(item.descricao) + "</small>" : "") +
        "</td>" +
        "<td>" +
        escaparHtml(item.setor || "-") +
        "</td>" +
        "<td>" +
        escaparHtml(item.responsavel || "-") +
        "</td>" +
        "<td><span class=\"badge badge-prioridade-" +
        classePrioridade(item.prioridade) +
        "\">" +
        escaparHtml(capitalizar(item.prioridade)) +
        "</span></td>" +
        "<td><span class=\"badge badge-status-" +
        item.status +
        "\">" +
        escaparHtml(capitalizar(item.status)) +
        "</span></td>" +
        "<td>" +
        formatarData(item.atualizadoEm) +
        "</td>" +
        "<td>" +
        gerarHtmlAcoes(item) +
        "</td>" +
        "</tr>"
      );
    });

    elementos.corpoTabela.innerHTML = linhas.join("");
  }

  function renderizarCards(itens) {
    if (!itens.length) {
      elementos.listaCards.innerHTML = "";
      return;
    }

    var cards = itens.map(function (item) {
      return (
        "<article class=\"card\" data-id=\"" +
        item.id +
        "\">" +
        "<h3>" +
        escaparHtml(item.numero) +
        "</h3>" +
        "<p><strong>Assunto:</strong> " +
        escaparHtml(item.assunto) +
        "</p>" +
        "<p><strong>Setor:</strong> " +
        escaparHtml(item.setor || "-") +
        "</p>" +
        "<p><strong>Responsável:</strong> " +
        escaparHtml(item.responsavel || "-") +
        "</p>" +
        "<p><strong>Prioridade:</strong> <span class=\"badge badge-prioridade-" +
        classePrioridade(item.prioridade) +
        "\">" +
        escaparHtml(capitalizar(item.prioridade)) +
        "</span></p>" +
        "<p><strong>Status:</strong> <span class=\"badge badge-status-" +
        item.status +
        "\">" +
        escaparHtml(capitalizar(item.status)) +
        "</span></p>" +
        "<p><strong>Atualizado:</strong> " +
        formatarData(item.atualizadoEm) +
        "</p>" +
        (item.descricao ? "<p><strong>Descrição:</strong> " + escaparHtml(item.descricao) + "</p>" : "") +
        gerarHtmlAcoes(item) +
        "</article>"
      );
    });

    elementos.listaCards.innerHTML = cards.join("");
  }

  function renderizarContadores() {
    var total = protocolos.length;
    var pendentes = 0;
    var andamento = 0;
    var concluidos = 0;
    var i = 0;

    for (i = 0; i < protocolos.length; i += 1) {
      if (protocolos[i].status === "pendente") {
        pendentes += 1;
      } else if (protocolos[i].status === "andamento") {
        andamento += 1;
      } else if (protocolos[i].status === "concluido") {
        concluidos += 1;
      }
    }

    elementos.contadorTotal.textContent = String(total);
    elementos.contadorPendentes.textContent = String(pendentes);
    elementos.contadorAndamento.textContent = String(andamento);
    elementos.contadorConcluidos.textContent = String(concluidos);
  }

  function onAcaoLista(evento) {
    var botao = evento.target.closest("button[data-acao]");
    if (!botao) {
      return;
    }

    var containerItem = botao.closest("tr[data-id], article[data-id]");
    if (!containerItem) {
      return;
    }

    var id = containerItem.getAttribute("data-id");
    var acao = botao.getAttribute("data-acao");

    if (acao === "editar") {
      prepararEdicao(id);
      return;
    }

    if (acao === "excluir") {
      var confirma = window.confirm("Confirma a exclusão deste protocolo?");
      if (confirma) {
        excluirProtocolo(id);
      }
      return;
    }

    if (acao === "avancar") {
      avancarStatus(id);
      return;
    }

    if (acao === "pendente") {
      voltarParaPendente(id);
    }
  }

  function gerarHtmlAcoes(item) {
    var botoes = "<div class=\"acoes-linha\">";

    botoes +=
      "<button type=\"button\" class=\"btn btn-secundario btn-tabela\" data-acao=\"editar\">Editar</button>";

    botoes +=
      "<button type=\"button\" class=\"btn btn-secundario btn-tabela\" data-acao=\"avancar\"" +
      (item.status === "concluido" ? " disabled" : "") +
      ">Avançar status</button>";

    if (item.status !== "pendente") {
      botoes +=
        "<button type=\"button\" class=\"btn btn-secundario btn-tabela\" data-acao=\"pendente\">Marcar pendente</button>";
    }

    botoes +=
      "<button type=\"button\" class=\"btn btn-perigo btn-tabela\" data-acao=\"excluir\">Excluir</button>";

    botoes += "</div>";

    return botoes;
  }

  function exportarJson() {
    try {
      var blob = new Blob([JSON.stringify(protocolos, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      var hoje = new Date();
      var nomeArquivo =
        "protocolos-" +
        hoje.getFullYear() +
        "-" +
        String(hoje.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(hoje.getDate()).padStart(2, "0") +
        ".json";

      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      mostrarToast("Exportação concluída.");
    } catch (erro) {
      mostrarToast("Falha ao exportar JSON.");
    }
  }

  function importarJson(evento) {
    var arquivo = evento.target.files && evento.target.files[0];
    if (!arquivo) {
      return;
    }

    var leitor = new FileReader();
    leitor.onload = function (ev) {
      try {
        var conteudo = String(ev.target.result || "");
        var dados = JSON.parse(conteudo);

        if (!Array.isArray(dados)) {
          throw new Error("Formato inválido");
        }

        var importadosValidos = [];
        var i = 0;
        for (i = 0; i < dados.length; i += 1) {
          var bruto = dados[i];
          if (!bruto || typeof bruto !== "object") {
            continue;
          }

          var normalizado = {
            id: bruto.id || gerarId(),
            numero: (bruto.numero || "").trim(),
            assunto: (bruto.assunto || "").trim(),
            descricao: (bruto.descricao || "").trim(),
            setor: (bruto.setor || "").trim(),
            responsavel: (bruto.responsavel || "").trim(),
            prioridade: bruto.prioridade || "baixa",
            status: bruto.status || "pendente",
            criadoEm: bruto.criadoEm || new Date().toISOString(),
            atualizadoEm: bruto.atualizadoEm || new Date().toISOString()
          };

          var validacao = validarProtocolo(normalizado, normalizado.id);
          if (!validacao.valido) {
            continue;
          }

          normalizado.numero = validacao.protocoloNormalizado.numero;
          normalizado.assunto = validacao.protocoloNormalizado.assunto;
          normalizado.descricao = validacao.protocoloNormalizado.descricao;
          normalizado.setor = validacao.protocoloNormalizado.setor;
          normalizado.responsavel = validacao.protocoloNormalizado.responsavel;
          normalizado.prioridade = validacao.protocoloNormalizado.prioridade;
          normalizado.status = validacao.protocoloNormalizado.status;

          if (numeroDuplicadoNoArray(importadosValidos, normalizado.numero)) {
            continue;
          }

          importadosValidos.push(normalizado);
        }

        protocolos = importadosValidos;
        salvarProtocolos();
        renderizarTudo();
        mostrarToast("Importação concluída com " + importadosValidos.length + " protocolos válidos.");
      } catch (erro) {
        mostrarToast("Arquivo JSON inválido.");
      } finally {
        elementos.inputImportar.value = "";
      }
    };

    leitor.readAsText(arquivo);
  }

  function numeroDuplicadoNoArray(lista, numero) {
    var i = 0;
    var base = numero.toLowerCase();
    for (i = 0; i < lista.length; i += 1) {
      if ((lista[i].numero || "").toLowerCase() === base) {
        return true;
      }
    }
    return false;
  }

  function buscarPorId(id) {
    var i = 0;
    for (i = 0; i < protocolos.length; i += 1) {
      if (protocolos[i].id === id) {
        return protocolos[i];
      }
    }
    return null;
  }

  function buscarIndicePorId(id) {
    var i = 0;
    for (i = 0; i < protocolos.length; i += 1) {
      if (protocolos[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function gerarId() {
    return "prot_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  }

  function formatarData(isoString) {
    var data = new Date(isoString);
    if (isNaN(data.getTime())) {
      return "-";
    }

    return data.toLocaleString("pt-BR");
  }

  function classePrioridade(prioridade) {
    if (prioridade === "média") {
      return "média";
    }
    if (prioridade === "alta") {
      return "alta";
    }
    return "baixa";
  }

  function capitalizar(texto) {
    if (!texto) {
      return "";
    }

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function escaparHtml(texto) {
    if (texto === null || texto === undefined) {
      return "";
    }

    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function mostrarToast(mensagem) {
    elementos.toast.textContent = mensagem;
    elementos.toast.classList.add("mostrar");

    if (timeoutToast) {
      clearTimeout(timeoutToast);
    }

    timeoutToast = setTimeout(function () {
      elementos.toast.classList.remove("mostrar");
    }, 2400);
  }

  iniciar();
})();
