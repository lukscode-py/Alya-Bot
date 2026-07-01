/*
 * Guia rápido da Alya Bot para organização de comandos.
 *
 * A Alya usa comandos separados por arquivo. Essa organização deixa cada recurso
 * mais fácil de encontrar, revisar, testar e manter.
 *
 * ---------------- 🤖 ONDE FICAM OS COMANDOS? 🤖 ----------------
 *
 * Os comandos ficam dentro de "src/commands".
 *
 * Estrutura principal:
 *
 * - 📁 admin: comandos para administradores do grupo
 * - 📁 member: comandos para membros em geral
 * - 📁 owner: comandos restritos ao dono do bot
 *
 * O carregador de comandos identifica a pasta e aplica as permissões
 * correspondentes durante a execução.
 *
 * Para criar um novo comando, use:
 *
 * src/commands/alya-guia-criar-comandos.js
 *
 * ---------------- 🧪 LABORATÓRIO DA ALYA 🧪 ----------------
 *
 * Demonstrações de mensagens, mídias e respostas ricas ficam em:
 *
 * src/commands/member/laboratorio
 *
 * Essa área serve como referência prática para criar comandos novos sem
 * misturar testes visuais com comandos finais do bot.
 *
 * ---------------- 🎨 MENU E BANNER 🎨 ----------------
 *
 * O menu principal fica em:
 *
 * src/menu.js
 *
 * A imagem principal do menu fica em:
 *
 * assets/images/alya-bot-preview.png
 *
 * Também é possível trocar a imagem pelo comando set-menu-image.
 *
 * ---------------- 🚀 IMPORTANTE 🚀 ----------------
 *
 * Antes de editar áreas centrais, leia o README.md e rode os testes.
 *
 * By: Alya Bot
 */
