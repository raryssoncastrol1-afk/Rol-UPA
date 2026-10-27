# Registro de Atividades - Sessão Rol UPA
**Data:** 24 de Outubro de 2026  
**Intervalo:** 16:50 às 18:10 (Horário Local)  
**Projeto:** Rol UPA (`Documentos/PROJETOS/Rol UPA`)

---

## 1. Linha do Tempo dos Eventos

- **17:09:16 — Commit & Versão Oficial UPA (`commit 8587308`)**
  - Registro da migração e adaptação do sistema para UPA (*União Presbiteriana de Adolescentes*).
  - Atualização dos arquivos de identidade visual (logos, ícones, fontes), componentes de votação e eleição (`VotingStation.tsx`, `electionUtils.ts`, `UpaLogo.tsx`), e sincronização com banco SQLite `upa_data.db`.
  - Inclusão dos documentos oficiais: `ROL_MEMBROS_UPA_2026.md` e `PINs_Eleitores_UPA_2026.pdf`.

- **17:30:25 — Inicialização do Servidor de Desenvolvimento**
  - Identificada a porta padrão `3000` ocupada pelo sistema UPH.
  - O servidor do projeto UPA foi iniciado na porta **3001** (`http://localhost:3001`).
  - Banco de dados SQLite/LibSQL conectado com sucesso em `upa_data.db`.

- **17:30:50 — Disponibilização para Acesso Móvel**
  - Identificado o IP local da máquina (`192.168.100.109`).
  - Estação de votação e painel disponibilizados para acesso celular via rede local:  
    `http://192.168.100.109:3001`

- **17:44:52 às 17:59:58 — Execução da Eleição Oficial UPA 2027**
  - Sessão de votação iniciada (`id: elc-1792878292404-mjn73`).
  - **14 membros** ativos cadastrados; **13 votantes presentes** (quórum mínimo apurado: 8).
  - Registrado um total de **130 votos computados** em tempo real entre 17:47:50 e 17:59:27.

---

## 2. Resultado da Eleição Concluída (Diretoria UPA 2027)

| Cargo | Eleito(a) | Escrutínio / Detalhe |
| :--- | :--- | :--- |
| **Presidente** | **Felype Vieira Costa** | Eleito(a) no 3º Escrutínio |
| **Vice-Presidente** | **João Lucas de Castro Lima** | Eleito(a) no 1º Escrutínio |
| **1ª Secretária** | **Letícia Bacchus da Conceição** | Eleita no 1º Escrutínio |
| **2ª Secretária** | **Maria Eduarda Angelim P.** | Eleita no 2º Escrutínio |
| **Tesoureiro** | **Nicolas Azaff** | Eleito(a) no 3º Escrutínio |

---

## 3. Estado Atual dos Dados (`upa_data.db`)

- **Tabela `members`**: 14 membros cadastrados.
- **Tabela `sessions`**: 1 sessão de quórum/presença registrada.
- **Tabela `elections`**: 1 eleição completa concluída com todos os cargos preenchidos e votos auditáveis.
- **Tabela `treasury`**: 0 registros financeiros.
