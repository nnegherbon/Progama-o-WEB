# Progama-o-WEB
Repositório referente as atividades da matéria de Programação WEB

Aplicação Sistema Web de Organização Financeira Pessoal

**Introdução**

Muitas pessoas enfrentam dificuldades para controlar suas finanças pessoais, acumulando dívidas e tendo pouco planejamento financeiro. A ausência de ferramentas simples e acessíveis contribui para o descontrole de gastos e dificuldade de poupar.

Diante desse cenário, propõe-se o desenvolvimento de uma aplicação web de organização financeira pessoal que permita registrar e acompanhar receitas e despesas. A solução busca facilitar o controle financeiro e apoiar decisões mais conscientes.

**Problema**

Como auxiliar pessoas a organizarem suas finanças de forma simples, prática e acessível, permitindo o registro e acompanhamento de ganhos e gastos para melhor controle do saldo financeiro?

**Requisitos Funcionais (RF)**

RF01 – Cadastrar usuário

RF02 – Autenticar usuário (login)

RF03 – Registrar receita

RF04 – Registrar despesa

RF05 – Editar transação

RF06 – Excluir transação

RF07 – Listar transações do usuário

RF08 – Categorizar transações

RF09 – Calcular saldo (ganhos – gastos)

RF10 – Exibir resumo financeiro

**Requisitos Não Funcionais (RNF)**

RNF01 – Aplicação web acessível via navegador

RNF02 – Backend desenvolvido em Java

RNF03 – API REST

RNF04 – Versionamento em GitHub

RNF05 – Deploy online simples

RNF06 – Código organizado e documentado

**Tecnologias Utilizadas**

Backend:

Java 17
Linguagem principal do projeto, utilizo ela para automação de testes no meu trabalho (Selenium)

Spring Boot
Framework que simplifica a criação de APIs REST em Java, reduzindo configuração manual.

Spring Data JPA
Facilita o acesso ao banco de dados por meio de mapeamento objeto-relacional, permitindo que seja trabalhado com entidades.

Frontend:

HTML5
Responsável pela estrutura das páginas web,.

CSS3
Utilizado para estilização e layout da interface, permitindo melhor experiência visual ao usuário.

JavaScript
Permite interatividade e comunicação com a API backend por requisições HTTP.

Bootstrap
Framework CSS que acelera a criação de interfaces responsivas e organizadas, reduzindo complexidade de design.

**Banco de Dados**

PostgreSQL
Banco de dados relacional robusto, adequado para armazenar dados financeiros estruturados com segurança e consistência.

**Testes**

JUnit
Framework padrão de testes em Java, utilizado para validar regras de negócio do sistema e garantir funcionamento correto das funcionalidades principais.

**Organização da Dupla**

1- Vinícius Clemente

Desenvolvimento backend (API REST)

Modelagem do banco de dados

Regras de negócio

2- Bianca Barp

Desenvolvimento frontend

Integração com API

Interface do usuário

Testes e documentação

**Diagrama de componentes**

<img width="942" height="1506" alt="c4_component_diagram" src="https://github.com/user-attachments/assets/3cd37713-f64b-4922-b845-f6481098c502" />


📄 **Documentação Completa**

Para uma análise mais aprofundada da arquitetura e dos detalhes técnicos do projeto, acesse o documento completo:

[Documento de Arquitetura Monify](https://docs.google.com/document/d/1ZaJzMUKgUVz9wj3EP1fKhpSn_dyCboUW3S9pNngFXUU/edit?usp=sharing)


🎨 **Protótipo da Interface**

Explore o protótipo interativo da interface do usuário no Figma:

[Protótipo Monify no Figma](https://www.figma.com/design/EiYtDYR6MdD2taJwpqnti3/Programa%C3%A7%C3%A3o-WEB---MONIFY?node-id=0-1&m=dev&t=7gMmlB6NqkY08yOj-1)


**Vídeo do projeto funcionando (30%) ->**

[Criando transações e login do sistema](https://drive.google.com/file/d/1OM2IwWkDGXL4QuKV_ATwPsWkqDUg95TQ/view?usp=sharing)

## Deploy

### Escolha de deploy

Para este projeto, a opção mais simples é:

- **Banco online:** Neon PostgreSQL
- **Deploy da aplicação:** Render Web Service no plano Free usando Docker

Essa combinação foi escolhida porque o Monify já é uma aplicação Spring Boot empacotada como `.jar`, com frontend estático dentro de `src/main/resources/static`. Assim, um único serviço Render consegue publicar backend e frontend juntos, enquanto o Neon fornece um PostgreSQL online compatível com Spring Data JPA.

O plano Free do Render é suficiente para demonstrações e projetos acadêmicos. O serviço entra em repouso após um período sem acessos e pode demorar cerca de um minuto para responder à primeira requisição seguinte. O `render.yaml` fixa explicitamente `plan: free` para evitar a criação acidental de uma instância paga.

O projeto foi preparado para não manter URL, usuário ou senha do banco no código. Em produção, essas informações devem ser configuradas somente por variáveis de ambiente.

### Banco online no Neon

1. Crie uma conta em https://neon.tech.
2. Crie um novo projeto PostgreSQL.
3. No painel do projeto, clique em **Connect**.
4. Copie os dados de conexão.
5. Monte a URL JDBC no formato:

```text
jdbc:postgresql://HOST:5432/NOME_DO_BANCO?sslmode=require
```

Exemplo:

```text
jdbc:postgresql://ep-exemplo-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Use essa URL na variável `DB_URL`. O usuário vai em `DB_USERNAME` e a senha vai em `DB_PASSWORD`.

### Variáveis de ambiente

Configure estas variáveis no serviço de deploy:

```text
DB_URL=jdbc:postgresql://HOST:5432/DATABASE?sslmode=require
DB_USERNAME=usuario_do_banco
DB_PASSWORD=senha_do_banco
SPRING_PROFILES_ACTIVE=prod
JPA_DDL_AUTO=update
APP_LOG_LEVEL=INFO
SQL_LOG_LEVEL=WARN
```

O Render também fornece a variável `PORT` automaticamente. A aplicação já está configurada com:

```properties
server.port=${PORT:8080}
```

Nunca coloque senhas reais no GitHub. Use o arquivo `.env.example` apenas como modelo.

### Deploy no Render

1. Crie uma conta em https://render.com.
2. Conecte o Render ao repositório GitHub do projeto.
3. Escolha a opção **New Blueprint** ou **New Web Service**.
4. Se usar Blueprint, o Render lerá o arquivo `render.yaml`.
5. Confirme que o serviço usa Docker.
6. Configure as variáveis `DB_URL`, `DB_USERNAME` e `DB_PASSWORD`.
7. Inicie o deploy.

O arquivo `render.yaml` já define:

- serviço web chamado `monify-app`;
- runtime Docker;
- health check em `/`;
- redeploy automático a cada commit na branch conectada.

O Dockerfile compila o projeto com Maven e executa o jar gerado:

```bash
java -jar /app/app.jar
```

### Rodar localmente

Para rodar localmente com o perfil `local`, use:

```bash
mvn clean test
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

No Windows PowerShell, mantenha o argumento do profile entre aspas, como no exemplo acima.

O perfil `local` usa H2 em memória por padrão para facilitar testes rápidos. Para testar localmente com PostgreSQL, defina as variáveis abaixo antes de iniciar:

```bash
DB_URL=jdbc:postgresql://localhost:5432/monify_db
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DRIVER=org.postgresql.Driver
DB_DIALECT=org.hibernate.dialect.PostgreSQLDialect
JPA_DDL_AUTO=update
```

Depois acesse:

```text
http://localhost:8080/
```

### Gerar pacote para produção

Antes de enviar alterações para deploy, valide:

```bash
mvn clean test
mvn clean package
```

O jar será gerado em:

```text
target/monify-app-1.0.0.jar
```

## Atualizar o projeto publicado

Fluxo recomendado após uma correção:

```bash
mvn clean test
mvn spring-boot:run
```

Depois faça commit e envie para o GitHub:

```bash
git add .
git commit -m "fix: ajuste necessario para deploy"
git push origin main
```

Se o serviço Render estiver conectado ao GitHub com deploy automático habilitado, o redeploy normalmente começará sozinho após o push na branch principal.

Se o redeploy automático estiver desativado:

1. Acesse o painel do Render.
2. Abra o serviço `monify-app`.
3. Clique em **Manual Deploy**.
4. Escolha **Deploy latest commit**.

Sempre confirme no painel do Render se as variáveis `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` e `SPRING_PROFILES_ACTIVE` continuam configuradas.
