# UPH - Relatório de Auditoria e Operação de Sistema
**Plenária Ordinária e Eleição da Diretoria 2027**  
*Data de Execução:* 17 de Outubro de 2026  
*Janela Operacional Auditada:* 19:00 às 21:00 (Horário Local)  
*Documento Fonte:* Base de Dados Local (`uph_data.db`) e Registro de Sistema  

---

## 1. Resumo Executivo e Métricas de Infraestrutura

Na noite de 17 de outubro de 2026, entre 19:00 e 21:00, o sistema **Rol de Membros da UPH** operou como a plataforma central e exclusiva para credenciamento/chamada e votação eletrônica da Plenária. O backend executou em ambiente Linux/Node.js sob gestão do systemd (`uph-app.service`) na porta 3000, com persistência transacional ACID em banco SQLite/LibSQL (`uph_data.db`).

| Métrica de Sistema | Registro Operacional |
| :--- | :--- |
| **Horário de Atividade Registrada** | 19:17:32 às 20:49:40 |
| **Total de Votos Computados** | **198 votos** (11 escrutínios × 18 eleitores) |
| **Taxa de Sucesso de Gravação** | **100%** (zero inconsistências ou votos perdidos) |
| **Aparelhos Conectados** | 18 Eleitores + 1 Mesa Diretora/Administração |
| **Pico de Memória RAM** | 123.2 MB |
| **CPU Total Consumida** | 15.93 s |
| **Quórum Homologado** | 18 presentes (Maioria necessária: 10 votos) |

---

## 2. Linha do Tempo Cronológica Completa

| Horário | Descrição do Evento no Sistema |
| :--- | :--- |
| **19:17:32** | Inicialização do serviço `uph-app.service` via `systemd` (Node.js PID 1313 na porta 3000). |
| **19:17:33** | Conexão confirmada com banco de dados `uph_data.db` (LibSQL/SQLite). |
| **19:26:17** | Registro e consolidação da lista de chamada da Plenária (`ses-1792279577313-386sz`) com 17 presentes iniciais e 2 ausências justificadas. |
| **19:44:56** | Cadastro e admissão em tempo real do novo membro **Paulo Silva Ferreira** (`mbr-1792280696464-a7khw`), status sócio, PIN gerado: `7264`. |
| **20:09:53** | Abertura oficial da Urna Eletrônica (`elc-1792282389040-8trhr`) para o 1º Escrutínio de **Presidente**. |
| **20:19:42** | Ajuste administrativo de quórum pela mesa diretora: de 17 para 18 membros presentes (fixando a maioria necessária em 10 votos). |
| **20:20:20** | Início da votação eletrônica para o cargo de **Vice-Presidente**. |
| **20:23:30** | Início da votação eletrônica para o cargo de **1º Secretário**. |
| **20:25:10** | Início da votação eletrônica para o cargo de **2º Secretário**. |
| **20:34:32** | Anulação administrativa do 3º Escrutínio de 2º Secretário por deliberação da mesa para saneamento da cédula. |
| **20:35:21** | Início da votação eletrônica para o cargo de **Tesoureiro**. |
| **20:40:42** | Computação do 198º e último voto da eleição (cargo de Tesoureiro). |
| **20:40:55** | Arquivamento oficial da eleição (`archived: true`) com todos os escrutínios homologados. |
| **20:49:40** | Encerramento formal das sessões da plenária e encerramento do processo. |

---

## 3. Lista de Presença e Quórum da Plenária

### Membros Presentes e Votantes (18)
1. **Antonio Josidelito da Conceição**
2. **Daniel da Silva Viana**
3. **David Andrade de Araújo**
4. **Dwillio Menezes Guimarães**
5. **Edinaldo Sobrinho de Lima**
6. **Hugo Bader**
7. **Isaías Correia Costa**
8. **Jônatas Emanuel Santana da Silva**
9. **Lenixon de Matos Rezende**
10. **Leonardo Sousa de Assis**
11. **Nadyel Veloso Leal**
12. **Paulo José Borges**
13. **Paulo Silva Ferreira** *(Cadastrado e admitido na sessão às 19:44)*
14. **Rarysson Krystian de Castro Lima**
15. **Raydglan Sousa de Meneses**
16. **Wanderson Jairo dos Santos Silva**
17. **Warllen Ronald Silva Guimarães**
18. **Wemeson Jackson dos Santos Silva**

### Faltas Justificadas (2)
* Alcir José de Souza Pereira
* Wannk Gabriel França Bastos

### Ausentes (7)
* Adilio Lima da Silva
* Antonio Angelim Veloso de Lima
* Douglas Augusto de Sousa Simplício
* Eurico da Silva Santos
* Francisco José da Silva
* Natanael Costa Alencar
* Rogério Costa Alencar

---

## 4. Resultado Completo da Eleição por Cargo e Escrutínio

### 1. Presidente (Quórum: 18 | Maioria: 10)
* **1º Escrutínio (20:09:53 – 20:14:58):**
  * Daniel da Silva Viana: **9 votos (50,0%)**
  * Wemeson Jackson dos Santos Silva: 3 votos (16,7%)
  * Rarysson Krystian de Castro Lima: 3 votos (16,7%)
  * Jônatas Emanuel Santana da Silva: 2 votos (11,1%)
  * Edinaldo Sobrinho de Lima: 1 voto (5,6%)
  * *Resultado:* Nenhum candidato atingiu a maioria absoluta (10 votos).
* **2º Escrutínio (20:17:28 – 20:22:25):**
  * Daniel da Silva Viana: **9 votos (50,0%)**
  * Wemeson Jackson dos Santos Silva: 4 votos (22,2%)
  * Rarysson Krystian de Castro Lima: 3 votos (16,7%)
  * Edinaldo Sobrinho de Lima: 1 voto (5,6%)
  * Antonio Josidelito da Conceição: 1 voto (5,6%)
  * *Resultado:* Encaminhado ao 3º escrutínio (segundo turno entre Daniel Viana e Wemeson Jackson).
* **3º Escrutínio — Desempate / Runoff (20:18:10 – 20:23:03):**
  * ⭐ **Wemeson Jackson dos Santos Silva: 11 votos (61,1%) — ELEITO**
  * Daniel da Silva Viana: 7 votos (38,9%)

---

### 2. Vice-Presidente (Quórum: 18 | Maioria: 10)
* **1º Escrutínio (20:20:20 – 20:25:34):**
  * Daniel da Silva Viana: **8 votos (44,4%)**
  * Edinaldo Sobrinho de Lima: 2 votos (11,1%)
  * Warllen Ronald Silva Guimarães: 2 votos (11,1%)
  * Outros com 1 voto cada (Rarysson, Jônatas, Josidelito, Wanderson, Raydglan, Lenixon): 6 votos
* **2º Escrutínio (20:21:13 – 20:26:18):**
  * Daniel da Silva Viana: **8 votos (44,4%)**
  * Edinaldo Sobrinho de Lima: 3 votos (16,7%)
  * Warllen Ronald Silva Guimarães: 2 votos (11,1%)
  * Outros (Rarysson, Josidelito, Raydglan, Jônatas, Lenixon): 1 voto cada
* **3º Escrutínio — Desempate / Runoff (20:21:45 – 20:26:44):**
  * ⭐ **Daniel da Silva Viana: 11 votos (61,1%) — ELEITO**
  * Edinaldo Sobrinho de Lima: 7 votos (38,9%)

---

### 3. 1º Secretário (Quórum: 18 | Maioria: 10)
* **1º Escrutínio (20:23:30 – 20:28:04):**
  * ⭐ **Rarysson Krystian de Castro Lima: 10 votos (55,6%) — ELEITO DE PRIMEIRA**
  * Antonio Josidelito da Conceição: 2 votos (11,1%)
  * Dispersos com 1 voto cada (David, Lenixon, Jônatas, Raydglan, Dwillio, Nadyel): 6 votos
  * *Resultado:* Eleito por maioria absoluta logo no primeiro escrutínio.

---

### 4. 2º Secretário (Quórum: 18 | Maioria: 10)
* **1º Escrutínio (20:25:10 – 20:30:25):**
  * Warllen Ronald Silva Guimarães: 5 votos (27,8%)
  * Jônatas Emanuel Santana da Silva: 5 votos (27,8%)
  * Wanderson Jairo dos Santos Silva: 3 votos (16,7%)
  * Dispersos: 5 votos
* **2º Escrutínio (20:27:42 – 20:32:42):**
  * Jônatas Emanuel Santana da Silva: 7 votos (38,9%)
  * Warllen Ronald Silva Guimarães: 7 votos (38,9%)
  * Wanderson Jairo dos Santos Silva: 2 votos (11,1%)
  * David Andrade: 1 voto | Antonio Josidelito: 1 voto
* **Intervenção da Mesa:**
  * O 3º escrutínio foi aberto e cancelado administrativamente às 20:34:32 e 20:34:36 para garantir a paridade de cédula.
* **3º Escrutínio Definitivo (20:33:02 – 20:37:59):**
  * ⭐ **Warllen Ronald Silva Guimarães: 11 votos (61,1%) — ELEITO**
  * Jônatas Emanuel Santana da Silva: 7 votos (38,9%)

---

### 5. Tesoureiro (Quórum: 18 | Maioria: 10)
* **1º Escrutínio (20:35:21 – 20:40:42):**
  * ⭐ **Edinaldo Sobrinho de Lima: 13 votos (72,2%) — ELEITO DE PRIMEIRA**
  * Lenixon de Matos Rezende: 2 votos (11,1%)
  * Paulo José Borges: 1 voto (5,6%)
  * Antonio Josidelito da Conceição: 1 voto (5,6%)
  * Nadyel Veloso Leal: 1 voto (5,6%)
  * *Resultado:* Eleito por ampla maioria absoluta no primeiro escrutínio.

---

## 5. Diretoria Homologada para o Ano de 2027

| Cargo | Oficial Eleito | Escrutínio Decisivo | Votação Final |
| :--- | :--- | :---: | :---: |
| **Presidente** | **Wemeson Jackson dos Santos Silva** | 3º Escrutínio | 11 votos (61,1%) |
| **Vice-Presidente** | **Daniel da Silva Viana** | 3º Escrutínio | 11 votos (61,1%) |
| **1º Secretário** | **Rarysson Krystian de Castro Lima** | 1º Escrutínio | 10 votos (55,6%) |
| **2º Secretário** | **Warllen Ronald Silva Guimarães** | 3º Escrutínio | 11 votos (61,1%) |
| **Tesoureiro** | **Edinaldo Sobrinho de Lima** | 1º Escrutínio | 13 votos (72,2%) |

*Nota sobre Declínio:* O membro **Raydglan Sousa de Meneses** registrou declínio formal de candidatura, averbado no banco de dados do sistema.

---

## 6. Registro de Intervenções Administrativas da Mesa (Overrides)

Conforme auditoria na tabela `elections`:

1. **20:19:42 - Cargo: PRESIDENT (`ajuste_quorum`):**
   * *Descrição:* "Quórum de presentes ajustado de 17 para 18 (Nova maioria: 10)."
   * *Motivação:* Entrada e admissão do novo membro Paulo Silva Ferreira durante a plenária.
2. **20:34:32 - Cargo: SECRETARY_2 (`anulacao_escrutinio`):**
   * *Descrição:* "O 3º escrutínio para 2º Secretário(a) foi anulado por deliberação da mesa."
3. **20:34:36 - Cargo: SECRETARY_2 (`anulacao_escrutinio`):**
   * *Descrição:* Reconfirmação e reabertura formal da cédula de votação para disputa final.

---

## 7. Desempenho e Conectividade dos Aparelhos

* **100% de Conclusão:** Todos os 18 eleitores presentes votaram em todos os 11 escrutínios sem desconexões no servidor.
* **Aparelho Mais Veloz:** Leonardo Sousa de Assis (submissão imediata via PIN).
* **Maior Tempo de Retenção:** Raydglan Sousa de Meneses (tempo médio de 300,5s devido a retenção no preenchimento e bloqueio de tela do smartphone).
* **Segurança dos Dados:** Zero concorrência destrutiva; transações SQLite preservadas integralmente.
