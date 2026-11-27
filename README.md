# EduConnect

**EduConnect** é um projeto educacional de desenvolvimento web voltado ao ambiente educacional, com o objetivo de oferecer uma plataforma digital que facilite a interação e o acesso a recursos relacionados à educação.

O projeto foi desenvolvido como uma aplicação web estática, utilizando tecnologias fundamentais do desenvolvimento Front-End e persistência local no navegador.

---

## 🌐 Acesse o EduConnect

[**Clique aqui para acessar o projeto**](https://arthur3109.github.io/EduConnectSite/FrontEnd/)

---

## Sobre o projeto

O EduConnect nasceu com a proposta de explorar o desenvolvimento de uma plataforma educacional, aplicando na prática conhecimentos de programação Front-End.

A aplicação busca proporcionar uma experiência de navegação organizada, intuitiva e acessível, utilizando tecnologias web para estruturar suas páginas e manter dados de demonstração no navegador.

Este projeto também representa uma oportunidade de aplicar conceitos importantes da engenharia de software, como organização de código, estruturação de sistemas, integração entre tecnologias e desenvolvimento de interfaces.

## Objetivos

- Desenvolver uma aplicação web voltada ao contexto educacional.
- Aplicar conhecimentos de desenvolvimento Front-End.
- Criar interfaces intuitivas e organizadas.
- Trabalhar com armazenamento local no navegador.
- Organizar dados de demonstração compartilhados entre as interfaces.
- Praticar a organização e manutenção de projetos web.

## Tecnologias utilizadas

O projeto utiliza tecnologias tradicionais do desenvolvimento web:

| Tecnologia | Aplicação                                    |
| ---------- | -------------------------------------------- |
| HTML5      | Estruturação das páginas                     |
| CSS3       | Estilização e identidade visual              |
| JavaScript | Interatividade e comportamentos da interface |
| LocalStorage | Persistência dos dados de demonstração      |

**Observação:** A implementação utiliza tecnologias nativas, sem depender de frameworks JavaScript.

## Arquitetura do projeto

O EduConnect utiliza uma estrutura separada por áreas funcionais no Front-End.

### Front-End

Responsável pela experiência visual e pela interação com o usuário.

- Estrutura das páginas com HTML5.
- Estilização com CSS3.
- Interações e funcionalidades com JavaScript.
- Organização dos elementos da interface.

### Persistência local

Os dados de demonstração são armazenados no `localStorage` do navegador pelo módulo compartilhado em `FrontEnd/assets/js/educonnect-backend.js`.

## Estrutura do projeto

A organização dos diretórios deve acompanhar a estrutura real do repositório. Uma representação conceitual da arquitetura é:

```text
EduConnectSite/
│
├── assets/
│   ├── css/
│   ├── js/
│   └── img/
│
├── assets/
├── alunos/
├── professor/
├── secretaria/
├── login/
├── index.html
├── README.md
└── ...
```

Os diretórios e arquivos podem variar conforme a implementação atual.

## Instalação e execução

Para executar o projeto localmente, basta utilizar um servidor estático ou abrir os arquivos pelo navegador.

### 1. Pré-requisitos

- Servidor web estático opcional.
- Navegador atualizado.
- Git (opcional).

### 2. Clonar o repositório

```bash
git clone https://github.com/Arthur3109/EduConnectSite.git
```

### 3. Acessar o projeto

```bash
cd EduConnectSite
```

### 4. Configurar o ambiente

Nenhuma configuração de banco de dados ou servidor de aplicação é necessária para a demonstração.

### 5. Executar

Acesse o endereço local correspondente à pasta do projeto no servidor web.

Exemplo:

```text
http://localhost/EduConnectSite/
```

**Importante:** Os dados são armazenados no navegador por meio do `localStorage`.

Este repositório é uma demonstração acadêmica local. Os arquivos em `BackEnd/`
contêm o modelo e os dados de exemplo em SQL, mas não precisam estar ativos
para executar as páginas em `FrontEnd/`.

Os dados iniciais do banco e do `localStorage` foram padronizados com os mesmos
nomes, matrículas, turmas, professores, profissionais e disciplinas. Os scripts
SQL continuam separados da execução Front-End e servem para o trabalho acadêmico.

Para recriar os dados SQL, execute primeiro `db_Educonnect-CD 281020261228.sql`
uma única vez para criar o banco e as tabelas; em seguida, execute
`db_Educonnect-Insert 261120261936.sql`. Para apagar todos os registros e manter
o esquema vazio, execute `db_Educonnect-Limpar_Dados.sql`. Esse último script
não remove o banco nem as tabelas; ele exibe a contagem final de registros por
tabela e, depois, o arquivo de INSERT pode ser executado novamente. A limpeza
é destrutiva: use somente no banco de demonstração e após fazer qualquer cópia
de segurança necessária.

### Acessos de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Professor | `professor@gmail.com` | `123` |
| Secretaria | `secretaria@gmail.com` | `123` |
| Aluno | `aluno@gmail.com` | `123` |

Para reiniciar os dados de demonstração, limpe o armazenamento do site nas
configurações do navegador e recarregue a página inicial.

## Segurança

O desenvolvimento de aplicações que trabalham com informações exige atenção a aspectos importantes de segurança, incluindo:

- Validação de informações recebidas.
- Proteção de dados armazenados.
- Controle adequado de acesso.
- Tratamento de requisições.
- Proteção dos dados mantidos no navegador.

## Aprendizados

O desenvolvimento do EduConnect proporciona experiência prática em:

- Desenvolvimento de aplicações web.
- Estruturação de interfaces web.
- Persistência de dados no navegador.
- Estruturação de interfaces com HTML e CSS.
- Utilização de JavaScript para interatividade.
- Organização e manutenção de código.

## Melhorias futuras

O projeto pode evoluir continuamente com a implementação de novas funcionalidades, melhorias de interface, otimizações de desempenho e aprimoramentos de segurança.

---

\<p align="center">
&#x20; Desenvolvido com dedicação e tecnologia.
\</p>
