# Página de Configurações, Troca de Senha e Backups Modulares [CONCLUÍDO]

Criação de um novo módulo de **Configurações do Sistema** com gestão de credenciais administrativas, exportação de backups modulares em arquivos JSON individuais por domínio (Membros, Frequência, Tesouraria e Eleições) e central de restauração direta de dados.

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> As decisões de formato, restauração e navegação foram alinhadas previamente através do questionário interativo:

- **Formato dos Backups**: Arquivos JSON separados por módulo (`membros_uph.json`, `frequencia_uph.json`, `tesouraria_uph.json`, `eleicoes_uph.json`), garantindo integridade absoluta de tipos e facilidade de restauração tanto pelo desenvolvedor quanto pelo sistema.
- **Restauração de Dados**: Implementação de interface na própria tela de configurações com upload de arquivo JSON e validação estrutural antes de aplicar a restauração.
- **Navegação & Acesso**: Acesso permanente no menu lateral (*Sidebar*) através do item **Configurações** (ícone `Settings`) e atalho direto na caixa de Operador no rodapé da barra lateral.

---

## 1. Visão Geral & Conceito

O módulo de **Configurações** centraliza a administração do sistema da UPH 3ª IPBV, oferecendo três pilares:

1. **Segurança & Acesso**: Troca e validação de senha do Administrador Local com confirmação visual e persistência segura em `localStorage`.
2. **Backups Modulares em JSON**: Exportação granular por entidade, permitindo salvar ou auditar domínios de forma independente:
   - **Rol de Membros** (`membros_uph.json`): dados cadastrais, cargos, títulos, datas e PINs de votação.
   - **Frequência & Chamadas** (`frequencia_uph.json`): atas de presenças, faltas justificadas, convocações e quóruns.
   - **Tesouraria** (`tesouraria_uph.json`): receitas, despesas, saldo acumulado e categorias de lançamentos.
   - **Eleições & Apurações** (`eleicoes_uph.json`): cargos disputados, cédulas e escrutínios registrados.
   - **Backup Completo Unificado** (`backup_completo_uph.json`): pacote único com todas as tabelas para migração rápida.
3. **Central de Restauração de Dados**: Upload e conferência de arquivos JSON com pré-visualização da quantidade de registros antes de aplicar a restauração (com confirmação explícita de segurança).

---

## 2. Experiência do Usuário & Design Visual

Seguindo a identidade visual institucional da UPH (verde clássico `#1B2E24`, dourado `#C2A267`/`#C8A96E`, neutros aquecidos `#FAF8F5`/`#F6F4EF` e tipografia *Cormorant Garamond*):

### Layout e Estrutura da Página
- **Faixa de Status Administrativo (Cards de Topo)**:
  - *Status da Senha*: Indicação de segurança (Personalizada vs Padrão `admin`).
  - *Data do Último Backup*: Timestamp do último backup gerado.
  - *Volume de Dados*: Contagem total de registros em banco (membros + sessões + transações + eleições).
  - *Armazenamento*: Indicação de persistência local SQLite + PWA.

- **Painel 1: Segurança da Diretoria (Troca de Senha)**:
  - Campo de senha atual (com botão de revelar/ocultar).
  - Nova senha e confirmação de senha.
  - Medidor visual de força da senha.
  - Botão de confirmação estilizado no verde institucional.

- **Painel 2: Backups Modulares (Exportação)**:
  - Grid de 4 cartões individuais para exportação:
    - 👥 **Rol de Membros** (com contagem atual de irmãos).
    - 📋 **Chamadas & Presenças** (com total de atas registradas).
    - 💰 **Tesouraria** (com total de lançamentos e saldo).
    - 🗳️ **Eleições & Votações** (com histórico de escrutínios).
  - Botão mestre no topo da seção: **Exportar Backup Completo (.json)**.

- **Painel 3: Restauração de Dados (Importação de Segurança)**:
  - Área de *drag & drop* ou clique para selecionar arquivo `.json`.
  - Detecção automática do tipo de backup (se é Rol, Frequência, Tesouraria ou Backup Completo).
  - Modal de confirmação mostrando resumo dos dados a serem restaurados com aviso de salvaguarda.

---

## 3. Decisões de Produto & Arquitetura de Dados

### 1. Formato JSON Estruturado
- **Decisão**: Gerar arquivos `.json` formatados com indentação legível de 2 espaços e cabeçalho de metadados (`versao`, `dataExportacao`, `sociedade`, `origem`).
- **Motivo**: Permite que qualquer desenvolvedor abra no VS Code ou terminal, inspecione as estruturas sem perdas e execute scripts de restauração ou migração direta no banco SQLite.

### 2. Restauração Segura
- **Decisão**: A restauração valida o esquema do arquivo antes de gravar. Se o usuário subir um arquivo de tesouraria, apenas a tesouraria é atualizada; se subir um backup unificado, todas as coleções são sincronizadas com o banco local e `localStorage`.

---

## 4. Diagrama de Arquitetura Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                    Navegação do Sistema                     │
│  [Painel Geral] [Chamada] [Membros] [Relatórios] ...       │
│  [⚙️ Configurações] ◄── Item Permanente no Menu e Perfil     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               SettingsView (src/components)                 │
├──────────────────────────────┬──────────────────────────────┤
│ 🔒 Gestão de Senha           │ 📦 Backups Modulares JSON    │
│  - Validação de Senha Atual  │  - Exportar Membros (.json)  │
│  - Nova Senha + Confirmação  │  - Exportar Frequência       │
│  - Persistência uph_admin    │  - Exportar Tesouraria       │
│                              │  - Exportar Eleições         │
│                              │  - Backup Completo Global    │
├──────────────────────────────┴──────────────────────────────┤
│ 📥 Restauração via Upload                                   │
│  - Leitura do arquivo JSON via FileReader                   │
│  - Validação de integridade e tipo de payload               │
│  - Dispatch para syncClient / localDB / Eventos             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Camada de Armazenamento e Sincronização           │
│  - Local SQLite (uph_data.db via API Server Express)        │
│  - Offline Cache & State (localDB / localStorage)           │
└─────────────────────────────────────────────────────────────┘
```

## Próximos Passos de Execução
Após sua aprovação, implementaremos:
1. Adição da rota `'settings'` no `App.tsx` e no menu `Sidebar.tsx`.
2. Criação do componente `src/components/SettingsView.tsx` com todo o design institucional.
3. Utilitários de geração e parsing de JSON para cada módulo em `src/lib/backupUtils.ts`.
4. Teste de build e validação final da restauração.
