# Progama-o-WEB
Repositório referente as atividades da matéria de Programação WEB

Aplicação Sistema Web de Organização Financeira Pessoal

📌 Introdução

Muitas pessoas enfrentam dificuldades para controlar suas finanças pessoais, acumulando dívidas e tendo pouco planejamento financeiro. A ausência de ferramentas simples e acessíveis contribui para o descontrole de gastos e dificuldade de poupar.

Diante desse cenário, propõe-se o desenvolvimento de uma aplicação web de organização financeira pessoal que permita registrar e acompanhar receitas e despesas. A solução busca facilitar o controle financeiro e apoiar decisões mais conscientes, ao mesmo tempo em que possibilita aos alunos aplicar conhecimentos práticos de engenharia de software.

Problema

Como auxiliar pessoas a organizarem suas finanças de forma simples, prática e acessível, permitindo o registro e acompanhamento de ganhos e gastos para melhor controle do saldo financeiro?

Requisitos Funcionais (RF)

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

Requisitos Não Funcionais (RNF)

RNF01 – Aplicação web acessível via navegador
RNF02 – Backend desenvolvido em Java
RNF03 – API REST
RNF04 – Arquitetura em camadas (MVC)
RNF05 – Autenticação com token
RNF06 – Versionamento em GitHub
RNF07 – Deploy online simples
RNF08 – Código organizado e documentado

Tecnologias Utilizadas
Backend

Java 17
Linguagem principal do projeto, amplamente utilizada no mercado corporativo e foco da disciplina de desenvolvimento backend.

Spring Boot
Framework que simplifica a criação de APIs REST em Java, reduzindo configuração manual e permitindo estrutura em camadas adequada ao aprendizado acadêmico.

Spring Data JPA
Facilita o acesso ao banco de dados por meio de mapeamento objeto-relacional, permitindo que os alunos trabalhem com entidades em vez de SQL complexo.

Spring Security + JWT
Permite implementar autenticação e controle de acesso com token, atendendo requisitos modernos de segurança em aplicações web.

Frontend

HTML5
Responsável pela estrutura das páginas web, sendo base essencial para qualquer aplicação frontend.

CSS3
Utilizado para estilização e layout da interface, permitindo melhor experiência visual ao usuário.

JavaScript
Permite interatividade e comunicação com a API backend por requisições HTTP.

Bootstrap
Framework CSS que acelera a criação de interfaces responsivas e organizadas, adequado ao nível dos alunos e reduzindo complexidade de design.

Banco de Dados

PostgreSQL
Banco de dados relacional robusto, gratuito e amplamente utilizado no mercado, adequado para armazenar dados financeiros estruturados com segurança e consistência.

Testes

JUnit
Framework padrão de testes em Java, utilizado para validar regras de negócio do sistema e garantir funcionamento correto das funcionalidades principais.

Organização da Dupla
Integrante 1

Desenvolvimento backend (API REST)

Modelagem do banco de dados

Regras de negócio

Autenticação

Integrante 2

Desenvolvimento frontend

Integração com API

Interface do usuário

Testes e documentação
