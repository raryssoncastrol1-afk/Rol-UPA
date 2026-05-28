# Documento de Requisitos de Software (DRS)

## App: UPH Rol de Membros (Gestão de Operações)

---

## 1. Introdução
### 1.1 Objetivo
Este documento especifica os requisitos funcionais, não funcionais e regras de negócio para o aplicativo web "UPH Rol de Membros". O sistema tem como objetivo principal digitalizar e modernizar a gestão de membros, o registro de presenças e a organização de reuniões/plenárias para a União de Presbiterianos Homens (UPH).

### 1.2 Escopo
O aplicativo é uma Single Page Application (SPA) responsiva (Web App), desenvolvida com React e Firebase, que atende acessos por Desktop, Tablets e Smartphones sem a necessidade de instalação nativa via lojas de aplicativos.

---

## 2. Perfis de Usuários (Atores)

1. **Administrador (Diretoria/Secretaria):** Tem acesso total ao sistema. Pode gerenciar reuniões, membros e visualizar relatórios consolidados no painel administrativo.
2. **Visitante/Membro comum (Acesso via PIN):** Perfil de acesso restrito (leitura/interação limitada). Acessa o sistema utilizando um código PIN pré-configurado pelo Administrador para validar presenças, visualizar histórico básico ou participar de eventuais enquetes/votações registradas no sistema.

---

## 3. Requisitos Funcionais (RF)

* **RF01 - Autenticação Administrativa:** O sistema deve permitir o registro e acesso de usuários Administradores utilizando credenciais nativas (E-mail e Senha) ou provedor externo seguro (Google Login).
* **RF02 - Acesso Simples (PIN):** O sistema deve fornecer uma entrada facilitada para os membros baseada em um código (PIN), autenticado de forma anônima no provedor, conferindo acesso sem exigir criação de conta.
* **RF03 - Gestão do Rol de Membros (CRUD):** O Administrador deve poder adicionar, editar, inativar e listar registros completos dos membros da UPH (como cargo e informações cadastrais).
* **RF04 - Gestão de Sessões/Reuniões:** O sistema deve permitir a criação de sessões de reuniões ordinárias, extraordinárias e plenárias.
* **RF05 - Chamadas e Frequência:** Dentro de uma sessão, o Administrador deve poder registrar e alterar a presença dos membros (Presente, Ausente, Justificado).
* **RF06 - Painel de Bordo (Dashboard):** A tela inicial do app, após login, deve apresentar estatísticas gerais consolidadas (Total de membros, porcentagem de frequência média recente).
* **RF07 - Recuperação de Sessão:** O sistema deverá manter o usuário conectado ao fechar e reabrir a janela de navegação (persistência local baseada por tokens de sessão).

---

## 4. Requisitos Não Funcionais (RNF)

* **RNF01 - Plataforma e Responsividade:** O sistema é exclusivamente Web, devendo adaptar dinamicamente seu layout e fluxo de UI para Mobile (celulares), Tablets e Desktops.
* **RNF02 - Tecnologia Front-end:** Construído via framework ReactJS sob o build tool Vite, utilizando TypeScript.
* **RNF03 - Arquitetura de Estilização:** A interface será padronizada e otimizada pelo framework de CSS utilitário (Tailwind CSS), adotando paleta de cores institucional clean/dark.
* **RNF04 - Infraestrutura e Banco de Dados (BaaS):** A base do aplicativo fica no Firebase Cloud Firestore (NoSQL), consumido de forma assíncrona.
* **RNF05 - Segurança (Regras e Autenticação):** Os recursos de dados no Firestore serão protegidos por "Security Rules" para garantir que apenas Administradores ou os respectivos portadores dos tokens consigam escrever e ler arquivos. O Firebase Auth gerenciará a camada de Identidade (E-mail, Google e Anônimo/PIN).

---

## 5. Regras de Negócio (RN)

* **RN01 - Controle Total:** Apenas um usuário validado através da rota de Autenticação Administrativa (Administrador) tem os privilégios totais de leitura e escrita para gerar modificações significativas nos perfis e dados mestre.
* **RN02 - Validação de Login Email/Senha:** A submissão de senha administrativa deve possuir grau mínimo de complexidade imposto pelo Firebase (mínimo de 6 caracteres).
* **RN03 - Isolamento de Instâncias Mobile:** A decisão arquitetural descarta o empacotamento nativo (APK/Android) para garantir 100% de flexibilidade em atualizações Web sem fricção com lojas (Play Store / App Store) e políticas rígidas de webview/caching de terceiros.
