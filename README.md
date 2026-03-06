# Sistema de Protocolos

Aplicação web em HTML, CSS e JavaScript puro para cadastro e acompanhamento de protocolos administrativos, com persistência local via `localStorage`.

## Objetivo

Organizar solicitações internas por meio de protocolos com controle de prioridade, status, responsável e histórico de atualização.

## Funcionalidades

- Cadastro de protocolo com os campos:
  - `id` (gerado automaticamente)
  - `numero` (único, pode ser gerado automaticamente)
  - `assunto` (mínimo de 3 caracteres)
  - `descricao`
  - `setor`
  - `responsavel`
  - `prioridade` (`baixa`, `média`, `alta`)
  - `status` (`pendente`, `andamento`, `concluido`)
  - `criadoEm` e `atualizadoEm` automáticos
- Edição e exclusão de protocolos
- Avanço rápido de status (`pendente -> andamento -> concluido`)
- Ação para voltar protocolo para `pendente`
- Busca textual por número, assunto e responsável
- Filtros por status e prioridade
- Ordenação por data de criação (mais recentes ou mais antigos)
- Contadores no cabeçalho (total e por status)
- Renderização responsiva:
  - Tabela para desktop
  - Cards para mobile
- Mensagens visuais de validação e toast para ações
- Exportação de dados para JSON
- Importação de JSON com validação

## Como rodar

1. Abra a pasta `protocolos-admin`.
2. Dê duplo clique em `index.html` (ou abra no navegador de sua preferência).
3. O sistema funciona sem servidor.

## Estrutura

```text
/protocolos-admin
  /assets/css/style.css
  /assets/js/app.js
  index.html
  README.md
```

## Exemplos de uso

- Criar protocolo rapidamente:
  - Deixe `Número` vazio para gerar automaticamente (`PROT-YYYY-XXXX`)
  - Preencha `Assunto` e clique em `Salvar`
- Filtrar pendências:
  - Em `Status`, selecione `Pendentes`
- Fechar um protocolo:
  - Clique em `Avançar status` até chegar em `Concluído`
- Reabrir um protocolo:
  - Clique em `Marcar pendente`
- Backup local:
  - Clique em `Exportar JSON`
- Restaurar dados:
  - Clique em `Importar JSON` e selecione o arquivo exportado

## Regras de negócio implementadas

- `numero` é único
- `assunto` obrigatório com pelo menos 3 caracteres
- `status` padrão em `pendente`
- `atualizadoEm` é renovado em edição e alteração de status
- Validações com mensagens na página (sem `alert` para erro de formulário)

## Possíveis melhorias futuras

- Persistência em backend/API REST
- Login e controle de permissões por perfil
- Histórico de auditoria por alteração
- Paginação e busca avançada
- Dashboard com gráficos por setor/status
- Testes automatizados (unitários e integração)
