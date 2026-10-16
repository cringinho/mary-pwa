MÓDULO IV — AUDITORIA ARQUITETURAL PROFUNDA, INTERATIVIDADE VIVA DO CASAL, GLOSSÁRIO TÉCNICO E MONETIZAÇÃO AUTÔNOMA PRÉ E PÓS-PLAY STORE (v4.0)
Esta seção aprofunda a engenharia do sistema identificando e corrigindo gargalos ocultos de arquitetura em escala, adicionando mecânicas de interatividade síncrona e diária para o casal, documentando um glossário técnico completo das tecnologias e traçando o plano de monetização autônoma (antes e depois da publicação na Google Play Store).
1. Diagnóstico de Nuances e Erros Graves de Arquitetura (E Suas Soluções de Engenharia)
#
	Erro Grave / Nuance Identificada
	O Que Acontece se Não Corrigirmos
	Solução de Engenharia Definitiva
	1
	Contenção de Escrita (SQLITE_BUSY) em Banco SQLite Único Multi-Casal
	Embora o modo SQLite WAL permita múltiplos leitores, ele possui um Single-Writer Lock (apenas 1 gravação por vez no arquivo .db — Isolamento no SQLite). Com centenas de casais enviando pings de GPS, arrastando itens no mural e salvando textos, o banco trava com erros SQLITE_BUSY.
	Arquitetura Database-per-Couple Sharding (inspirada no Turso Multi-Tenancy): um banco core_master.db guarda apenas contas e assinaturas, enquanto cada casal possui seu próprio arquivo isolado data/couples/couple_{id}.db. Zero bloqueio entre casais diferentes, backup instantâneo para o Google Drive e exclusão LGPD imediata.
	2
	Colisão de Dados (Last-Write-Wins) no Mural e no Editor de Texto
	Se o Parceiro A e o Parceiro B arrastarem elementos no Mural ou editarem um texto ao mesmo tempo via requisições REST (PUT/PATCH), o último a salvar apaga as alterações do outro.
	Sincronização via CRDTs com Yjs + Socket.IO: cada ação no Mural ou no Editor Tiptap gera deltas binários livres de conflito (Y.Doc + y-indexeddb + y-websocket), fundindo edições simultâneas em tempo real a 60fps.
	3
	Incompatibilidade da Battery Status API no iOS/Safari e Pausa do GPS em Tela Bloqueada
	A API navigator.getBattery() não é suportada pela Apple no iOS Safari / WebKit. Chamar navigator.getBattery() sem verificação quebra a tela do Mapa no iPhone. Além disso, o iOS/Android congela o watchPosition quando o navegador vai para segundo plano.
	1) Feature detection seguro ('getBattery' in navigator) + integração opcional com Atalhos do iOS (Apple Shortcuts Webhook) para usuários de iPhone enviarem o nível de bateria automaticamente ao carregar/descarregar. 2) Uso da Screen Wake Lock API no modo Me Acompanhe até em Casa + ping via Web Push silencioso ao abrir o mapa.
	4
	Bloqueio da Event Loop do Node.js durante Compressão de Fotos (Sharp)
	Se 5 usuários subirem 10 fotos de 12MP da câmera ao mesmo tempo, o processamento de imagem na thread principal trava os WebSockets e atrasa todas as respostas da API.
	Execução do Sharp isolada em Worker Threads (node:worker_threads) com fila de concorrência limitada a 2 núcleos da CPU ARM64, mantendo a API sempre abaixo de 15ms de latência.
	5
	Travamento da UI Mobile pelo Índice MiniSearch na Thread Principal
	Reindexar centenas de relatos longos com tags HTML do editor rico diretamente na thread de renderização do React causa engasgos (jank) ao digitar em celulares intermediários.
	Extração de texto limpo (plainText) no salvamento e execução do MiniSearch dentro de um Web Worker dedicado (search.worker.js) no navegador.
	2. Glossário Técnico Detalhado das Tecnologias Utilizadas
* CRDT (Conflict-free Replicated Data Type — Yjs): Estrutura de dados matemática que permite que dois dispositivos editem o mesmo documento ou quadro branco simultaneamente (inclusive offline) e converjam automaticamente para o mesmo resultado sem conflitos de mesclagem.
* WAL (Write-Ahead Logging — SQLite WAL): Modo de jornalização do SQLite onde gravações são anexadas sequencialmente em um arquivo -wal separado, permitindo que leituras e escritas ocorram em paralelo sem travar consultas.
* Database-per-Tenant Sharding (Turso Architecture): Padrão onde cada casal recebe uma instância física isolada de banco de dados (couple_{id}.db), garantindo isolamento absoluto de privacidade e escalabilidade horizontal.
* OPFS (Origin Private File System): API moderna de armazenamento de arquivos nativa dos navegadores que permite salvar mídias binárias e bancos SQLite localmente no celular com velocidade próxima à nativa.
* TWA (Trusted Web Activity — Android Developers): Protocolo oficial do Google que executa um PWA em tela cheia dentro de um pacote Android (.aab) na Google Play Store usando o motor do Chrome, validado pelo arquivo .well-known/assetlinks.json.
* VAPID (Voluntary Application Server Identification): Padrão de chaves criptográficas assimétricas (pública e privada) que permite ao servidor Node.js enviar notificações Web Push diretamente aos servidores da Google (FCM) e da Apple (APNs) sem custo por mensagem.
* Optimistic UI (Interface Otimista): Padrão de UX onde a interface reflete a ação do usuário no exato milissegundo do toque antes mesmo da resposta HTTP do servidor, revertendo apenas em caso de falha de rede.
3. Solucionando a Falta de Interatividade: 6 Novas Mecânicas de Conexão Viva para o Casal
Mecânica Interativa
	Como Funciona para o Casal
	Tecnologia Utilizada
	1. Toque de Saudade / Batimento Síncrono (Touch Link)
	Quando ambos estão no app e colocam o dedo na tela, cada um vê a digital brilhante do outro em tempo real. Quando os dois dedos se encontram na mesma coordenada (x, y), a tela explode em partículas e ambos os celulares vibram no ritmo de um coração batendo!
	Socket.IO (volatile.emit a 30Hz) + HTML5 Canvas + navigator.vibrate([100, 80, 100, 400]).
	2. Talão de Cupons do Amor com Raspadinha Digital (Scratch Cards)
	Um parceiro cria um cupom misterioso (ex: Vale uma massagem nas costas, Vale escolher o restaurante hoje). O outro recebe o card coberto por tinta dourada e precisa raspar com o dedo na tela para revelar e resgatar o prêmio!
	HTML5 canvas com globalCompositeOperation = 'destination-out' + detecção de % raspada.
	3. Ofensiva do Casal (Love Streak) + Evolução da Constelação da Mary
	Assim como a ofensiva do Duolingo/TikTok, o casal mantém uma Chama Estelar Diária cumprindo 1 micro-ritual por dia. A Anjinha Mary ganha novos acessórios conforme a ofensiva sobe (7, 30, 100, 365 dias).
	Cron job diário + notificações push de lembrete às 20h.
	4. Roleta de Encontros e Decisões (O Que Vamos Fazer Hoje?)
	Roleta customizável com física de giro e som tátil para sortear Onde comer, Qual filme assistir ou Desafio romântico da noite.
	Canvas 2D / SVG com desaceleração cúbica + sincronização do sorteio ao vivo nas duas telas.
	5. Cápsulas de Voz e Áudio-Notas com Ondas Sonoras
	Permite gravar áudios curtos de até 60s diretamente nos relatos, no Mural ou nas estrelas do Céu de Sentimentos, renderizando as ondas sonoras animadas.
	MediaRecorder (audio/webm;codecs=opus ultraleve ~120 KB/min) + visualizador via Web Audio API.
	6. Sala Ouvindo Juntos (Live Jukebox no Mural)
	Quando os dois estão no Mural do Casal, um botão Sincronizar Player permite ouvir a mesma trilha/embed e reagir com chuva de emojis flutuantes em tempo real.
	Eventos de sala (room:couple_{id}) no Socket.IO.
	4. Auditoria de Marketing: Falhas Atuais, Oportunidades Perdidas e Novas Rotas de Receita Pós-Lançamento
4.1. As 3 Maiores Falhas de Marketing Corrigidas
1. Quebra do Muro do Cadastro Duplo (Funil Jogue Primeiro no WhatsApp, Cadastre Depois): O Parceiro A gera um Link Rápido de Desafio (mary.pyxie.com.br/jogar/convite-xyz) com 5 perguntas de Quem é mais provável e manda no WhatsApp do Parceiro B, que responde direto no navegador em 20 segundos sem criar conta. A criação da conta é pedida apenas na tela de revelação da compatibilidade, triplicando a conversão.
2. Modo Crush / Conhecendo Melhor & Campanhas Sazonais: Abertura do funil para ficantes/namoros recentes com perguntas quebra-gelo e calendário promocional focado no Dia dos Namorados (12 de Junho), Natal e Ano Novo.
3. Múltiplas Fontes de Receita Transacional (Além da Assinatura Mensal): Captura de receita via Pix único para usuários que não possuem cartão de crédito ou preferem compras avulsas.
4.2. Novas Rotas de Renda Pós-Lançamento
* Vitrine Inteligente de Presentes e Afiliados (Amazon Associados Brasil, Shopee, Flores): 10 dias antes do aniversário de namoro ou aniversário do parceiro, a Anjinha Mary cruza as respostas dos Minigames (Prefiro/Não Gosto) e sugere 5 presentes certeiros com link de afiliado (comissão de 4% a 12%).
* O Livro da Nossa História (Exportação Editorial de Luxo em PDF/Impresso — R$ 19,90 avulso via Pix): Gera um e-book diagramado em alta resolução pronto para impressão gráfica com todas as cartas, fotos e constelações do casal.
* Escudo de Ofensiva (R$ 4,90) e Pacotes de Cupons/Stickers Temáticos (R$ 6,90): Microtransações via Pix para recuperar uma ofensiva (Streak) perdida ou liberar novos pacotes de raspadinhas.
* Gift Card Presenteie Seu Amor (R$ 29,90 / 3 meses Romance via Pix Único): Cartão de presente digital animado com abertura de caixa surpresa na tela do parceiro.
5. Como Começar a Lucrar ANTES Mesmo do Lançamento na Play Store (De Forma 100% Autônoma)
1. Rota Autônoma 1 — Criador de Página Surpresa de Declaração + QR Code (Ticket Único R$ 14,90 via Pix):
   * Na rota pública /surpresa, qualquer visitante monta em 2 minutos uma página romântica personalizada (contador de tempo juntos ao vivo, fotos Polaroid, música do Spotify, chuva de estrelas e carta) vendo o preview em tempo real com a Anjinha Mary.
   * Para publicar o link permanente (/s/nome-do-casal), baixar o Cartão QR Code Imprimível e ganhar 30 dias grátis do Plano Romance no PWA completo, o sistema gera um QR Code Pix de R$ 14,90 via API do Asaas ou Stripe Pix. O webhook libera tudo em 3 segundos sem intervenção humana.
2. Rota Autônoma 2 — Passe de Casal Fundador (Pré-Venda Web via Pix Automático Asaas):
   * Oferta limitada para os primeiros 100 casais na web (R$ 69,90/ano ou R$ 9,90/mês via Pix Automático) com emblema dourado vitalício Casal Fundador e 99% de margem líquida (sem a taxa de 15% da Google Play).
3. Rota Autônoma 3 — Bot Gerador de Quizzes para TikTok / Reels / Shorts:
   * Script automatizado que exporta vídeos verticais diários com 3 perguntas do banco de 1.000 questões levando tráfego orgânico direto para o funil /jogar e /surpresa.
6. PROMPT AGENTE 7: Blindagem Arquitetural, Interatividade ao Vivo e Funil Autônomo Pix Pré-Play Store
# [AGENTE 7/7 — BLINDAGEM ARQUITETURAL, INTERATIVIDADE AO VIVO E MOTOR AUTÔNOMO PIX PRÉ-PLAY STORE]


Atue como Arquiteto de Sistemas Distribuídos Sênior e Engenheiro de Growth. Sua missão é eliminar os gargalos de concorrência do projeto, adicionar interatividade em tempo real para o casal e construir o funil autônomo de monetização via Pix (para faturar na Web/PWA antes mesmo do lançamento na Play Store).


## 1. Blindagem Arquitetural (Resolvendo Gargalos de Escala e Compatibilidade iOS)
1. Isolamento de Escrita e Workers (server/workers/imageWorker.js):
   - Mova todo o processamento pesado do Sharp (conversão .webp de uploads) para um worker_thread ou fila assíncrona controlada para nunca bloquear a Event Loop do Express e do Socket.IO.
   - Configure o SQLite com PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000; e crie um buffer em memória para os pings de telemetria/localização (gravando no disco apenas a cada 30 segundos em batch), preparando suporte a sharding por casal (couple_{id}.db).
2. Web Worker para o MiniSearch (client/src/workers/search.worker.js):
   - Remova tags HTML (stripHtml) antes de indexar o texto dos relatos do Tiptap e execute a indexação/busca do MiniSearch em Web Worker para manter a UI a 60fps constantes.
3. Compatibilidade iOS / Safari na Battery API (usePartnerTelemetry.js):
   - Nunca chame navigator.getBattery() diretamente sem verificar if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function').
   - Caso o dispositivo seja iOS (onde getBattery não existe no Safari), exiba um estado elegante iOS (Bateria via Atalho) e crie o endpoint POST /api/telemetry/ios-battery-webhook (com token do usuário) para que usuários de iPhone possam enviar a bateria via app Atalhos (Shortcuts) da Apple.


## 2. Interatividade Síncrona e Rituais Diários do Casal (LiveCoupleInteractions.jsx + Socket.IO)
Integre o socket.io (no servidor porta 3001) e socket.io-client criando uma sala privada por casal (room:couple_${coupleId}):
1. Toque de Saudade / Batimento Síncrono (TouchLinkOverlay.jsx):
   - Quando ambos estão online no app e ativam o Toque de Saudade, transmita as coordenadas (x, y) do toque em tempo real via Socket.IO. Quando a distância entre o dedo do Parceiro A e do Parceiro B for < 40px, dispare uma explosão de partículas douradas/rubi nas duas telas e acione navigator.vibrate?.([100, 80, 100, 400]) simulando um batimento cardíaco.
2. Talão de Cupons do Amor com Raspadinha (LoveCouponsScratchView.jsx):
   - Crie a tabela love_coupons (id, coupleId, createdBy, title, description, iconName, isScratched, isRedeemed, createdAt).
   - Renderize um card coberto por uma camada canvas prateada/dourada que o parceiro raspa com o dedo (globalCompositeOperation = 'destination-out') até atingir 50% de área limpa para revelar o vale.
3. Ofensiva do Casal (LoveStreakBadge.jsx) + Roleta de Encontros (DateRouletteModal.jsx):
   - Adicione currentStreakDays, longestStreakDays e lastInteractionDate na tabela couples, incrementando a chama diária quando ambos interagem no dia, e crie a Roleta de Encontros sincronizada.


## 3. Funil Autônomo de Lucro Pré-Play Store via Pix (SurpriseLandingPage.jsx + /api/payments/pix)
1. Criador Autônomo de Página Surpresa de Declaração + QR Code (/surpresa e /s/:slug):
   - Crie uma rota pública /surpresa onde qualquer visitante monta em 2 minutos uma página romântica personalizada vendo o preview em tempo real.
   - Ao clicar em Publicar Página + Gerar QR Code + Ganhar 30 Dias de App Romance, gere uma cobrança Pix Instantânea de R$ 14,90 (POST /api/payments/create-pix integrado via API REST do Asaas / Stripe Pix).
2. Webhook Automático de Ativação (POST /api/webhooks/payment-confirmed):
   - Assim que o pagamento Pix for confirmado pelo webhook, ative instantaneamente o isPublished = 1 da página /s/:slug, gere o QR Code em alta resolução, atualize couples.planTier automaticamente e registre a venda no Painel SuperAdmin (/admin).
3. Link Rápido Jogue Primeiro no WhatsApp (/jogar/:inviteToken):
   - Permita que um usuário envie um quiz de 5 perguntas para o parceiro responder direto pelo navegador sem cadastro prévio, solicitando a criação da conta apenas na tela final de revelação da compatibilidade.
Documentação Completa Consolidada: PWA mary.pyxie.com.br (v1.0 Inicial + v2.0 Master Blueprint SaaS)
________________
Este documento reúne integralmente:
4. MÓDULO I — Produção Inicial do Aplicativo (v1.0): Configuração do Nginx, DNS, SSL e os 7 Prompts iniciais de construção.
5. MÓDULO II — Master Blueprint v2.0 (SaaS Nacional, Bugfixes & 23 Requisitos): Correção dos bugs de tela preta e grafo, separação do repositório sparkle_heart, plano de negócios (Freemium, Romance R$ 12,90 e Almas Gêmeas R$ 24,90), análise de concorrentes, integração com Google Drive/Fotos e os 5 Prompts divididos por Área de Atuação do Agente de IA.
MÓDULO I — PRODUÇÃO INICIAL DO APLICATIVO (v1.0)
________________
Guia de Execução & Prompts em Partes: PWA mary.pyxie.com.br (Nosso Universo — Plataforma para Casais)
________________
Este documento consolida todas as fontes do seu Notebook (especificações de arquitetura na Oracle Cloud, configurações de DNS/Nginx/PM2, referências visuais do app Paired, mockups do Nosso Universo — Diário Secreto do Casal e o histórico real de conversas do projeto original) em uma sequência modular de 7 Prompts de Engenharia.
Para obter a melhor execução sem estourar o limite de contexto do seu agente de código (Cursor, Roo Code, Cline, Windsurf ou Claude Code), execute a Parte 1 no terminal da sua VM (ou peça para o agente gerar os arquivos de configuração) e depois envie do Prompt 1 ao Prompt 7 em etapas sequenciais, aguardando o agente concluir e validar cada etapa antes de colar a próxima.
Visão Geral da Arquitetura e das Funcionalidades Integradas
Camada / Módulo
	Tecnologias Modernas Escolhidas
	Detalhes de Implementação
 
	Infraestrutura & Domínio
	Nginx (HTTP/2 + SSL) + PM2 + Cloudflare/Certbot
	Subdomínio isolado mary.pyxie.com.br apontando para a porta interna 3001 (client_max_body_size 50M para uploads de fotos).
	Front-end SPA & UI
	Vite 6 + React 19 + Tailwind CSS v4 + Framer Motion
	Design Dark-Glassmorphism / Cyber-Kawaii mobile-first, transições elásticas e feedback tátil (navigator.vibrate).
	Bibliotecas de Ícones
	lucide-react + @phosphor-icons/react
	Ícones vetoriais duotone e lineares consistentes em todas as abas, reações, humores e controles (zero emojis crus na interface).
	Back-end & Banco de Dados
	Node.js (Express 5) + SQLite (better-sqlite3 WAL) + Drizzle ORM
	Banco local ultrarrápido blindado contra concorrência em server/data/mary_diary.db, com autenticação JWT httpOnly exclusiva para os 2 usuários.
	Pipeline de Imagens
	Canvas API (Client) + Multer + Sharp (Server)
	Compressão dupla automática gerando .webp otimizados (full + thumbnail) para fotos de perfil, imagens de relatos e fotos avulsas da galeria.
	Busca Instantânea Offline
	MiniSearch + idb-keyval (IndexedDB)
	Indexação em memória no cliente com busca fuzzy tolerante a erros de digitação em menos de 10ms, funcionando 100% offline.
	Grafo de Memórias & Palavras
	@xyflow/react (React Flow) ou vis-network
	Modo duplo: Grafo de Relatos (memórias conectadas) e Grafo Semântico de Palavras (cadastro manual + sugestões automáticas via NLP das palavras que mais se repetem).
	Versículo Bíblico Diário (Opcional)
	bible-api.com (translation=almeida) + Cache + Fallback Local
	Card especial estilizado na Home do Casal (quando ativado) com semente diária, tradução em português, botão de favoritar e banco local de versículos reconfortantes para modo offline.
	Resumo Mensal (Recap)
	HTML5 Canvas / html-to-image + Agregador SQL
	Montagem automática estilo Polaroid/Story com as fotos do mês, total de relatos, likes trocados, top palavras do casal e exportação em PNG.
	Etapa 0: Configuração Direta do Nginx, DNS e SSL para mary.pyxie.com.br
Antes de iniciar os prompts no editor ou logo após o build, configure o subdomínio na sua máquina virtual (Oracle Cloud / Ubuntu):
1. Apontamento DNS (Cloudflare ou Registro.br)
Crie uma entrada DNS para o subdomínio mary: * Tipo: A (apontando para o IP público fixo da sua VM) ou CNAME (apontando para pyxie.com.br). * Nome: mary (resultando em mary.pyxie.com.br).
2. Arquivo de Configuração do Nginx (/etc/nginx/sites-available/mary.pyxie.com.br)
Crie o bloco do servidor preparado para uploads múltiplos de fotos, cache inteligente de PWA e proxy reverso para a porta 3001:
sudo nano /etc/nginx/sites-available/mary.pyxie.com.br

Cole o conteúdo abaixo:
server {
   listen 80;
   listen [::]:80;
   server_name mary.pyxie.com.br diario.pyxie.com.br;

   # Essencial para permitir anexos de múltiplas fotos da câmera do celular
   client_max_body_size 50M;

   # Compressão Gzip moderna para respostas da API e bundles
   gzip on;
   gzip_vary on;
   gzip_min_length 1024;
   gzip_proxied any;
   gzip_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/json application/manifest+json image/svg+xml;

   # Cabeçalhos de Segurança e Privacidade (impede indexação em buscadores)
   add_header X-Robots-Tag "noindex, nofollow, nosnippet, noarchive" always;
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header Referrer-Policy "strict-origin-when-cross-origin" always;

   # Service Worker e Manifest NUNCA devem ficar presos em cache antigo
   location ~* ^/(sw\.js|manifest\.webmanifest|manifest\.json|registerSW\.js)$ {
       proxy_pass http://127.0.0.1:3001;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
       expires off;
   }

   # Proxy principal para o servidor Node.js na porta 3001
   location / {
       proxy_pass http://127.0.0.1:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
       proxy_read_timeout 90s;
   }
}

Ative o site e gere o certificado HTTPS (caso não esteja usando proxy laranja da Cloudflare):
sudo ln -sf /etc/nginx/sites-available/mary.pyxie.com.br /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Se usar DNS direto (Registro.br) ou Cloudflare Full (Strict):
sudo certbot --nginx -d mary.pyxie.com.br

PROMPT 1 (Parte 1 de 7): Fundação, Banco de Dados SQLite + Drizzle, Auth Blindada e Troca de Foto de Perfil
Copie e envie o bloco abaixo para o seu Agente de Código:
# [PARTE 1/7] FUNDAÇÃO FULLSTACK, BANCO DE DADOS (SQLITE + DRIZZLE), AUTH E PERFIL CUSTOMIZÁVEL

Atue como um Engenheiro de Software Fullstack Sênior e Creative Technologist. Vamos construir o PWA privado **"Nosso Universo — Plataforma para Casais"** para o subdomínio `mary.pyxie.com.br`.
O sistema deve rodar de forma totalmente isolada na porta `3001` (para não conflitar com o bot do Discord na porta `3000`).

Nesta **Parte 1**, sua missão é criar a estrutura base do projeto (`apps/mary-pwa/`), o servidor back-end Express, a camada de banco de dados SQLite em modo WAL com Drizzle ORM, a autenticação restrita aos 2 usuários e o sistema completo de **Troca de Imagem de Perfil** com compressão `.webp`.

## 1. Estrutura de Diretórios e Pacotes
Crie a estrutura dentro de `apps/mary-pwa/`:
- `server/`: Node.js (ESM) com `express`, `better-sqlite3`, `drizzle-orm`, `bcrypt`, `jsonwebtoken`, `cookie-parser`, `multer`, `sharp`, `web-push`, `cors`, `helmet`, `dotenv`.
- `client/`: Vite + React + Tailwind CSS + `framer-motion` + `lucide-react` + `@phosphor-icons/react` + `@xyflow/react` + `minisearch` + `idb-keyval` + `date-fns` + `canvas-confetti` + `html-to-image`.
- Configure um `package.json` raiz em `apps/mary-pwa/` com scripts para rodar `dev`, `build` (compila o Vite em `client/dist` para o Express servir em produção) e `start` (porta 3001), além do arquivo `ecosystem.config.cjs` para o PM2 (`name: "mary-pwa"`, `PORT: 3001`).
- Garanta que `server/data/` e `server/uploads/` estejam no `.gitignore`.

## 2. Modelagem Completa do Banco de Dados (`server/db/schema.js`)
Configure o SQLite (`server/data/mary_diary.db`) com `PRAGMA journal_mode = WAL;` e crie o schema cobrindo todas as funcionalidades do projeto:
1. `users`:
  - `id` (integer PK), `username` (text unique: `'parceiro_a'` e `'parceiro_b'`), `displayName` (text: `'Parceiro A'` e `'Parceiro B'`), `nickname` (text: `'Meu Amor'` e `'Minha Vida'`), `passwordHash` (text), `avatarUrl` (text), `bannerColor` (text), `bio` (text), `moodStatus` (text), `theme` (text default `'dark-romantic'`), `updatedAt` (text).
2. `memories` (Relatos):
  - `id` (integer PK), `authorId` (integer FK -> users.id), `title` (text), `content` (text), `memoryDate` (text ISO), `mood` (text), `tags` (text JSON array), `location` (text), `isCapsule` (integer boolean default 0), `unlockAt` (text nullable), `createdAt` (text), `updatedAt` (text).
3. `memory_media` (Imagens dos Relatos & Galeria Separada):
  - `id` (integer PK), `memoryId` (integer nullable FK -> memories.id — quando `null`, é uma foto avulsa enviada direto para a Galeria Separada!), `uploadedBy` (integer FK -> users.id), `albumName` (text default `'Geral'`), `caption` (text), `fileUrl` (text), `thumbUrl` (text), `width` (integer), `height` (integer), `isFavorite` (integer boolean default 0), `takenAt` (text), `createdAt` (text).
4. `memory_likes` (Likes e Reações nos Relatos):
  - `id` (integer PK), `memoryId` (integer FK -> memories.id), `userId` (integer FK -> users.id), `reaction` (text default `'heart'`), `createdAt` (text). (Unique constraint em `memoryId + userId`).
5. `memory_connections` (Árvore de Relações entre Relatos):
  - `id` (integer PK), `sourceMemoryId` (integer FK -> memories.id), `targetMemoryId` (integer FK -> memories.id), `label` (text), `createdAt` (text).
6. `word_nodes` (Grafo de Palavras Repetidas & Cadastradas):
  - `id` (integer PK), `word` (text unique), `normalizedWord` (text unique), `meaningOrNote` (text), `color` (text default `'#EC4899'`), `iconName` (text default `'Sparkles'`), `createdBy` (integer FK -> users.id), `isCustom` (integer boolean default 1), `createdAt` (text).
7. `favorite_verses` (Versículos Favoritados da Mary):
  - `id` (integer PK), `reference` (text), `text` (text), `bookName` (text), `chapter` (integer), `verse` (integer), `savedBy` (integer FK -> users.id), `note` (text), `createdAt` (text).
8. `couple_settings`:
  - `id` (integer PK), `anniversaryDate` (text default `'2026-01-30'`), `specialDatesJson` (text JSON), `pushSubscriptionsJson` (text JSON).

## 3. Seed Inicial Personalizado (`server/db/seed.js`)
Crie um script de seed automático que inicializa os dois únicos usuários (senhas configuráveis via `.env` `LEH_PASSWORD` e `MARY_PASSWORD`, com hash `bcrypt`):
- Usuário 1: `username: 'demo_a'`, `displayName: 'Usuário Demo A'`, `nickname: 'Meu Amor'`, `theme: 'cyber-goth'`, `bio: 'Construindo nossa história juntos'`.
- Usuário 2: `username: 'demo_b'`, `displayName: 'Usuária Demo B'`, `nickname: 'Minha Vida'`, `theme: 'dark-romantic'`, `bio: 'Unicórnio com glitter, música e arte'`.
- Popule o banco inicial de `word_nodes` com palavras afetivas reais do casal: `Meu Amor`, `Minha Vida`, `Nossa Viagem`, `Promessa`, `Nosso Cantinho`, `Primeiro Encontro`, `Saudade`, `Futuro`.

## 4. Autenticação Blindada & Troca de Imagem de Perfil (`server/routes/auth.js` e `profile.js`)
- Zero rota de cadastro público. Login via `POST /api/auth/login` gerando cookie `httpOnly`, `secure`, `sameSite: 'lax'`.
- Implemente `POST /api/profile/avatar` usando `Multer` (em memória) + `Sharp`:
 - Recebe a nova foto de perfil (ou recorte enviado pelo usuário), redimensiona com `sharp(buffer).resize(400, 400, { fit: 'cover' }).webp({ quality: 85 })`, salva em `server/uploads/avatars/`, remove o arquivo antigo para economizar disco na VM e atualiza `avatarUrl` no SQLite.
- Implemente `PATCH /api/profile` para atualizar `displayName`, `nickname`, `bio`, `moodStatus` e `theme`.
- Sirva os arquivos de `server/uploads/` apenas para requisições autenticadas pelo middleware de sessão (`/api/uploads/*`).

Implemente todos esses arquivos do servidor, teste a criação do banco SQLite e confirme que a API responde na porta 3001.

PROMPT 2 (Parte 2 de 7): Design System, Ícones Modernos, Temas Dinâmicos e Versículo Bíblico Diário (Opcional)
Assim que o Agente concluir a Parte 1, envie a Parte 2:
# [PARTE 2/7] DESIGN SYSTEM, FRAMEWORKS DE ÍCONES, TEMAS DINÂMICOS E VERSÍCULO BÍBLICO DIÁRIO DA MARY

Agora vamos construir a fundação visual do Front-end em `apps/mary-pwa/client/` com Vite + React + Tailwind CSS + Framer Motion.

## 1. Frameworks de Ícones e Estética Visual
- Utilize exclusivamente **`lucide-react`** e **`@phosphor-icons/react`** (pesos `duotone`, `fill` e `regular`) para todos os ícones da interface. Não use emojis genéricos do sistema para botões ou navegação.
- Configure fontes modernas no `index.html`: `'Plus Jakarta Sans'` (corpo), `'Space Grotesk'` ou `'Fredoka'` (títulos) e `'Cormorant Garamond'` ou `'Playfair Display'` (itálico elegante para o Versículo Bíblico Diário (Opcional) e cartas).
- Implemente 4 Temas Dinâmicos instantâneos via atributo `data-theme` no `document.documentElement` (gerenciados por `useTheme.js` e sincronizados com o perfil do usuário):
 1. `dark-romantic`: Fundo `#0B090E`, cards `rgba(24, 18, 30, 0.72)` com `backdrop-blur-xl`, destaque `#E60067` (Rosa Carmesim) e `#F43F5E`.
 2. `neon-rose`: Fundo `#120714`, destaque `#FF2A85` e `#FF75B5` com glow néon intenso.
 3. `cyber-goth`: Estética Noite Violeta — Fundo `#09070F`, destaque `#9333EA` (Roxo Escuro) com detalhes em dourado glitter (`#F59E0B`) e lilás (`#C084FC`).
 4. `starry-night`: Estética Céu Sereno / Noite Estrelada — Fundo azul meia-noite `#070B19`, destaque `#38BDF8` e `#818CF8` com partículas de estrelas sutis no canvas de fundo.

## 2. Header do Casal & Troca de Foto de Perfil Instantânea (`CoupleHeader.jsx` + `ProfileModal.jsx`)
- No topo do app, exiba os avatares circulares do **Parceiro A** e **Parceiro B** conectados por um ícone pulsante (`Heart` duotone com animação de batimento em Framer Motion) e o contador dinâmico de tempo juntos (dias, horas e minutos).
- Ao clicar no próprio avatar, abra o `ProfileModal.jsx`:
 - Permite selecionar uma nova foto da galeria/câmera do celular, visualizar o preview circular com ajuste de zoom/enquadramento em um `<canvas>` client-side, e enviar para `POST /api/profile/avatar`.
 - Também permite editar o apelido atual (`Meu Amor` / `Minha Vida`), bio e status de humor (com ícones Phosphor).

## 3. Card de Versículo Bíblico Diário Opcional (`DailyBibleVerseCard.jsx`)
Na Home (especialmente destacado quando a opção de Versículos estiver ativada nas Configurações), crie um componente de **Versículo Bíblico Diário** ricamente estilizado (bordas sutis douradas/rosé, efeito aurora no fundo, tipografia serifada `'Playfair Display'` ou `'Cormorant Garamond'`, ícone `BookOpenText` ou `Sparkle` duotone):
- **Integração Corrigida com `https://bible-api.com` + Cache Diário + Fallback Resiliente**:
 - Como a URL raiz `https://bible-api.com` sozinha não retorna JSON, implemente um serviço `bibleService.js` que busca em português (tradução João Ferreira de Almeida) usando:
   `https://bible-api.com/?random=verse&translation=almeida`
 - **Consistência Diária + Sorteio Manual**: Salve o versículo obtido no `localStorage` vinculado à data atual (`YYYY-MM-DD`) para que o "Versículo do Dia" da Mary permaneça o mesmo durante todo o dia quando ela abrir o app, mas inclua um botão elegante com ícone `RefreshCw` (*"Receber nova palavra"*) caso ela queira sortear outro versículo na hora!
 - **Lista Curada de Fallback em Português**: Inclua um array local de 30 versículos bíblicos acolhedores sobre amor, paz, força e cuidado (ex: *1 Coríntios 13:4-7, Cânticos 8:6-7, Salmos 23:1-4, Filipenses 4:6-7, Isaías 41:10, Mateus 11:28, Romanos 8:38-39, Provérbios 3:3*) para que, se a internet oscilar ou a API externa demorar mais de 3 segundos, o card exiba imediatamente um versículo lindo sem nunca mostrar erro.
 - **Ações no Card**: Botão para **Favoritar Versículo** (salva na tabela `favorite_verses` via `POST /api/verses/favorite` com uma nota pessoal opcional do usuário) e botão para **Transformar em Relato** (abre o modal de nova memória já citando aquele versículo).

Construa a navegação inferior (`BottomNav.jsx`) com 5 abas fluidas: **Início & Feed**, **Galeria**, **Grafo & Palavras**, **Recap Mensal** e **Ajustes**.

PROMPT 3 (Parte 3 de 7): Feed de Relatos, Imagens nos Relatos, Sistema de Likes e Busca Instantânea (<10ms)
Envie a Parte 3 para o Agente:
# [PARTE 3/7] FEED DE MEMÓRIAS, MÚLTIPLAS IMAGENS NOS RELATOS, LIKES AFETIVOS E BUSCA INSTANTÂNEA

Agora vamos construir a experiência completa da **Timeline Viva (Feed de Relatos)**, o sistema de **Likes/Reações nos Relatos**, o **Anexo de Múltiplas Imagens** e a **Busca Instantânea Offline**.

## 1. Backend de Relatos, Upload de Imagens e Likes (`server/routes/memories.js`)
1. `GET /api/memories`: Retorna todos os relatos ordenados por `memoryDate DESC`, incluindo dados do autor (`displayName`, `nickname`, `avatarUrl`), array de imagens (`memory_media`), lista de likes/reações (`memory_likes` com usuário e tipo de reação) e conexões do grafo (`memory_connections`). Se `isCapsule === 1` e `new Date(unlockAt) > new Date()`, oculte o `content` e as imagens no servidor, retornando apenas os metadados de bloqueio.
2. `POST /api/memories`: Cria um relato com suporte a upload de até 10 imagens simultâneas (`multer`).
  - Cada imagem passa pelo `sharp`: gera versão principal (`.webp`, máx 1600px de largura/altura, qualidade 82, preservando aspect ratio) e miniatura (`.webp`, 400px, qualidade 75), salvando ambas e registrando em `memory_media`.
  - Permite vincular `connectedMemoryIds` (memórias anteriores relacionadas) e `customWords` (palavras para o grafo).
3. `POST /api/memories/:id/like`: Alterna (toggle) ou atualiza a reação/like do usuário logado naquele relato. Suporte tanto o **Like rápido de Coração** (1 clique) quanto reações especiais do casal (`heart`, `sparkle`, `sparkle_heart`, `fire`, ` emotional`). Retorna a contagem atualizada e dispara notificação push para o parceiro (*"Seu amor curtiu o seu relato!"*).

## 2. Cards de Relatos (`MemoryCard.jsx`) e Criação (`NewMemoryModal.jsx`)
- **Estilo Polaroid / Dark-Glass**:
 - Cabeçalho com avatar atualizado do autor, nome/apelido, data formatada em português (`date-fns/locale/pt-BR`), badge de humor e tags clicáveis (`#viagem`, `#datas`, `#promessas`, `#desabafo`).
 - **Mosaico / Carrossel de Imagens**: Se o relato tiver 1 foto, exiba em destaque com bordas arredondadas; se tiver 2 ou mais fotos, exiba um grid/carrossel elegante com indicador de quantidade. Clicar em qualquer foto abre o **Lightbox Cinemático** com zoom.
 - **Botão de Like Afetivo**: Botão de coração (`Heart` do Phosphor/Lucide) com animação elástica (`scale: [1, 1.35, 0.9, 1]`) e partículas ao curtir, exibindo o mini-avatar de quem curtiu (Parceiro A e/ou Parceiro B) e permitindo segurar para escolher reações extras.
 - **Chip de Conexões**: Mostra quantas memórias estão conectadas àquele relato no grafo; clicar abre um preview das memórias ligadas.
- **Modal de Novo Relato (`NewMemoryModal.jsx`)**:
 - Compressão prévia no cliente via HTML5 Canvas antes do upload (para envio rápido mesmo no 4G).
 - Preview das fotos anexadas com opção de remover ou adicionar legenda.
 - Seletor "Relacionar com outra memória" (busca rápida de relatos existentes para conectar no grafo).
 - Opção "Selar como Cápsula do Tempo" (define data/hora futura de desbloqueio).

## 3. Pesquisa Ultrarrápida Instantânea (`SearchBar.jsx` + `searchEngine.js`)
- Configure o `MiniSearch` no cliente indexando `title`, `content`, `tags`, `location` e `authorName` com suporte a prefixos e *fuzzy matching* (`fuzzy: 0.2`), persistindo o cache dos relatos no `IndexedDB` (`idb-keyval`).
- A barra de busca (acessível no topo ou via atalho `Ctrl+K`) filtra a timeline em menos de 10ms enquanto o usuário digita, destacando os termos encontrados e oferecendo filtros rápidos por chips: *Todos*, *Só com Fotos*, *Curtidos por Nós*, *Por Autor (Parceiro A / Parceiro B)* e *Por Tags*.

PROMPT 4 (Parte 4 de 7): Galeria de Imagens Separada & Resumo Mensal com Montagem ("Recap do Casal")
Envie a Parte 4 para o Agente:
# [PARTE 4/7] GALERIA DE IMAGENS SEPARADA E RESUMO MENSAL COM MONTAGEM ("RECAP DO CASAL")

Nesta etapa, vamos implementar duas funcionalidades centrais do projeto: a **Galeria de Imagens Separada** e o **Resumo Mensal Automático com Montagem de Fotos e Estatísticas Fofas do Casal**.

## 1. Galeria de Imagens Separada (`PhotoGalleryView.jsx` + `server/routes/gallery.js`)
O casal precisa de uma aba dedicada de **Galeria** que funcione tanto como acervo visual de todas as mídias do diário quanto como um mural de fotos independente (onde podem subir fotos juntas, prints, selfies ou memórias visuais sem precisar criar um relato de texto).
- **Rotas de Back-end (`/api/gallery`)**:
 - `GET /api/gallery`: Retorna todas as imagens de `memory_media` (tanto as vinculadas a relatos quanto as avulsas onde `memoryId IS NULL`), com filtros por `month` (`YYYY-MM`), `albumName`, `uploadedBy` e `isFavorite`.
 - `POST /api/gallery/upload`: Permite upload direto de múltiplas fotos avulsas para a galeria com `albumName` (ex: *"Nossas Fotos"*, *"Prints & Memes"*, *"Saídas"*, *"Gatinhos"*), `caption` opcional e `takenAt`, processadas em `.webp` via `Sharp`.
 - `PATCH /api/gallery/:id/favorite`: Marca/desmarca uma foto como favorita do casal.
- **Interface da Galeria (`PhotoGalleryView.jsx`)**:
 - Layout em **Masonry Grid** responsivo (2 colunas no celular, 3 a 4 no desktop) com efeito Polaroid opcional ou bordas *dark-glass*.
 - Barra de filtros no topo: *Todas*, *Favoritas ❤️*, *Fotos de Relatos*, *Fotos Avulsas*, seletor de *Álbuns* e filtro por *Mês/Ano*.
 - Botão flutuante *"Adicionar Fotos à Galeria"* com upload múltiplo direto.
 - **Lightbox Cinemático em Tela Cheia (`LightboxModal.jsx`)**: Ao clicar na foto, abre visualizador imersivo com suporte a swipe lateral, zoom, legenda, data, autor do envio, botão de favoritar e — se a foto pertencer a um relato — um botão *"Ler relato desta foto"* que leva direto à memória correspondente!

## 2. Resumo Mensal com Montagem & Estatísticas Fofas (`MonthlyRecapView.jsx`)
Crie uma experiência interativa e emocionante onde os dois parceiros podem ver o resumo de cada mês juntos (com geração automática ao final do mês ou seleção de qualquer mês no histórico):
- **Endpoint de Agregação (`GET /api/recap/:yearMonth`)**:
 - Calcula e retorna para o mês selecionado (ex: `2026-08`):
   1. `totalMemories`: Quantos relatos foram escritos no mês (e divisão entre Parceiro A e Parceiro B).
   2. `totalPhotos`: Total de fotos adicionadas (nos relatos + na galeria separada).
   3. `totalLikes`: Quantos corações e reações vocês trocaram no mês.
   4. `topWords`: As 5 palavras afetivas mais escritas nos relatos daquele mês.
   5. `topMoods`: Os sentimentos/humores predominantes do mês.
   6. `highlightMemory`: O relato mais curtido/longo ou especial do mês.
   7. `collagePhotos`: Seleção automática (ou customizável pelo usuário) das melhores fotos daquele mês (priorizando as marcadas com `isFavorite` e fotos de relatos curtidos).
- **Montagem Visual & Card Exportável**:
 - Renderize um **Pôster / Montagem Polaroid do Mês** (com templates alternáveis: *Grid Polaroid Romântico*, * Tira de Cabine de Fotos / Photobooth*, e *Card Story Estilo Spotify Wrapped*).
 - Inclua no card da montagem: As fotos do mês em molduras elegantes, o título *"Nosso Mês de [Mês/Ano] — Parceiro A & Parceiro B"*, badges fofos com os números do mês (ex: *"X memórias eternizadas • Y fotos • Z corações trocados • Palavra do mês: 'Saudade'"*) e uma frase final romântica.
 - **Botão de Download / Compartilhamento**: Use `html-to-image` (`toPng`) para permitir que qualquer um dos parceiros baixem a montagem pronta em PNG de alta definição direto para a galeria do celular!

PROMPT 5 (Parte 5 de 7): Grafo Interativo de Memórias + Grafo Semântico de Palavras Repetidas & Sugestões
Envie a Parte 5 para o Agente:
# [PARTE 5/7] ÁRVORE DE RELAÇÕES (GRAFO DE MEMÓRIAS) + GRAFO DE PALAVRAS REPETIDAS & SUGESTÕES INTELIGENTES

Nesta etapa, vamos construir a **Aba 2: Grafo do Nosso Universo (`RelationshipGraphView.jsx`)**, unindo duas camadas visuais interativas com física elástica (`@xyflow/react` ou `vis-network`): o **Grafo de Memórias** e o **Grafo de Palavras Repetidas & Cadastradas**.

## 1. Motor de Extração e Sugestão de Palavras Frequentes (`server/utils/wordAnalyzer.js`)
Crie um analisador semântico leve no backend (e espelhado no cliente) que:
1. Varre o texto e título de todos os relatos salvos em `memories`.
2. Tokeniza em português, normaliza acentos/caixa e remove uma lista abrangente de *stopwords* (preposições, pronomes comuns, artigos, verbos auxiliares).
3. Calcula a frequência exata de cada palavra e identifica em quais `memoryId` cada palavra aparece.
4. **Rota `GET /api/graph/data`**:
  - Retorna:
    - `memoryNodes`: Todos os relatos (com miniatura da foto, título, data, autor e tags).
    - `memoryEdges`: Conexões diretas entre relatos (`memory_connections`).
    - `registeredWords`: Todas as palavras cadastradas na tabela `word_nodes`, já acompanhadas da contagem real de ocorrências (`count`) e da lista de `memoryIds` onde elas aparecem!
    - `suggestedWords`: As **15 palavras mais frequentes** que se repetem nos relatos (com `count >= 2`) mas que **ainda não foram cadastradas** em `word_nodes`, prontas para serem sugeridas aos usuários!
5. **Rotas de Gestão de Palavras**:
  - `POST /api/graph/words`: Permite ao usuário cadastrar manualmente qualquer palavra, apelido ou expressão (ex: `"Meu Amor"`, `"Minha Vida"`, `"Nosso Dia"`, `"Saudade"`, `"Praia"`, `"Viagem"`), escolhendo uma cor neon, categoria (`Afeto`, `Piada Interna`, `Lugar`, `Música`, `Promessa`) e nota opcional, ou aprovar com 1 clique uma palavra da lista de `suggestedWords`.
  - `DELETE /api/graph/words/:id`: Remove uma palavra do grafo visual.

## 2. Interface Interativa do Grafo (`RelationshipGraphView.jsx`)
Crie um canvas cósmico escuro (com estrelas sutis ao fundo, zoom, pan, física de atração/repulsão suave e minimapa opcional) com um seletor de modo no topo:
- **Modo A — Constelação de Memórias**:
 - Cada relato é um nó circular brilhante (com a foto de capa da memória dentro ou ícone do humor).
 - Linhas neon conectam relatos relacionados. Clicar em uma conexão ou em um nó abre o modal **Evolução da História**, mostrando a linha cronológica daqueles momentos conectados.
- **Modo B — Grafo de Palavras & Afetos (Híbrido Palavras + Memórias)**:
 - Renderiza os **Nós de Palavras Cadastradas (`word_nodes`)** como estrelas/hubs maiores cujo tamanho e brilho escalam proporcionalmente à quantidade de vezes que a palavra se repete nos relatos!
 - Conecta automaticamente cada Palavra-Hub a todos os relatos onde ela foi mencionada (e cria ligações tracejadas entre duas palavras quando elas aparecem juntas no mesmo relato).
 - Ao clicar em uma palavra no grafo, destaca todas as memórias conectadas a ela e abre uma gaveta lateral mostrando os trechos exatos onde vocês usaram aquela palavra!
- **Drawer/Barra de "Sugestões de Palavras Repetidas" + Cadastro Manual**:
 - Na parte superior ou lateral do Grafo, exiba uma seção recolhível **"✨ Palavras que vocês mais repetem (Sugestões)"** listando os chips retornados em `suggestedWords` com sua contagem (ex: `➕ "amor" (14x)`, `➕ "viagem" (9x)`). Clicar no chip adiciona a palavra instantaneamente ao grafo visual com animação!
 - Ao lado, inclua o botão **"+ Cadastrar Palavra"** para digitar qualquer palavra nova, escolher a cor e o ícone Lucide/Phosphor e adicioná-la ao universo do casal.

PROMPT 6 (Parte 6 de 7): PWA Instalável, Service Worker, Sincronização Offline e Web Push Notifications (VAPID)
Envie a Parte 6 para o Agente:
# [PARTE 6/7] PWA STANDALONE, SERVICE WORKER (OFFLINE SYNC), WEB PUSH API (VAPID) E AJUSTES

Agora vamos transformar `mary.pyxie.com.br` em um **Progressive Web App (PWA)** de nível nativo para iOS e Android, com funcionamento offline e notificações push reais em tempo real.

## 1. Web App Manifest (`client/public/manifest.webmanifest`)
Configure o manifest para abertura em tela cheia (`standalone`), orientação `portrait`, cores integradas ao tema e atalhos rápidos (*App Shortcuts*):
- `name`: `"Nosso Universo — Diário & Espaço de Casal"`
- `short_name`: `"Parceiro A & Parceiro B"`
- `start_url`: `"/"`
- `display`: `"standalone"`
- `background_color`: `"#0B090E"`
- `theme_color`: `"#E60067"`
- `shortcuts`: Atalhos de ícone longo no celular para *"Novo Relato"*, *"Galeria de Fotos"* e *"Versículo do Dia"*.
- Adicione as meta tags da Apple no `index.html` (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style="black-translucent"`, `apple-touch-icon`).

## 2. Service Worker & Sincronização Offline (`client/public/sw.js` + `offlineStorage.js`)
- Estratégia **Cache-First** para fontes, ícones e bundles estáticos (JS/CSS) e **Stale-While-Revalidate** para imagens de avatares e miniaturas da galeria (`/api/uploads/*`).
- Estratégia **Network-First com Fallback em IndexedDB** para `/api/memories`, `/api/gallery` e `/api/graph/data`, garantindo que os dois parceiros consigam abrir o app, ler todos os relatos, ver o versículo diário e usar a busca instantânea mesmo no metrô ou totalmente sem internet.
- **Fila de Sincronização (Background Sync)**: Se um usuário escrever um novo relato enquanto estiver offline, salve na fila local do `IndexedDB` com badge *"Aguardando conexão para sincronizar"* e envie automaticamente assim que o evento `online` disparar.

## 3. Web Push API Nativa com Chaves VAPID (`server/pushService.js` + `usePushNotifications.js`)
- Gere (ou leia do `.env` `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` — crie um script utilitário que gera e salva automaticamente as chaves VAPID caso ainda não existam) e configure a biblioteca `web-push`.
- Crie as rotas `GET /api/push/vapid-public-key`, `POST /api/push/subscribe` e `POST /api/push/test`.
- Dispare notificações push automaticamente para o celular do parceiro nos seguintes eventos:
 1. **Novo Relato Publicado**: *"💌 [Autor] adicionou uma nova memória: '[Título]'"*
 2. **Novo Like / Reação**: *"❤️ [Autor] amou o seu relato '[Título]'!"*
 3. **Novas Fotos na Galeria**: *"📸 [Autor] adicionou X novas fotos na Galeria de vocês!"*
 4. **Pergunta Diária Respondida**: *"✨ [Autor] respondeu à pergunta de hoje! Responda para revelar."*
- Na **Aba Ajustes (`SettingsView.jsx`)**:
 - Seletor visual dos 4 Temas (`dark-romantic`, `neon-rose`, `cyber-goth`, `starry-night`).
 - Interruptores (toggles) de Notificações Push + botão *"Enviar Notificação de Teste / Mandar um 'Pensando em você' 💭"* (que envia um push instantâneo de carinho para o celular do outro!).
 - Gerenciador de Datas Comemorativas e Aniversário (com contador regressivo para o próximo marco do casal).

PROMPT 7 (Parte 7 de 7): Integração Final, Build de Produção, PM2 e Validação Ponta a Ponta
Por fim, envie a Parte 7 para o Agente concluir e colocar em produção:
# [PARTE 7/7] INTEGRAÇÃO FINAL, BUILD DE PRODUÇÃO, PM2 E VALIDAÇÃO PONTA A PONTA

Para finalizar o projeto do PWA `mary.pyxie.com.br`, execute a revisão e integração final:

1. **Servindo o Build no Express (`server/server.js`)**:
  - Configure o Express na porta `3001` para servir os arquivos estáticos gerados em `client/dist` com cache otimizado para `assets/` e fallback SPA (`index.html`) para qualquer rota não-API.
  - Certifique-se de que erros de tamanho de arquivo do Multer ou rotas não autenticadas retornem respostas JSON limpas e amigáveis em português.
2. **Validação de Todos os Requisitos**:
  - [ ] Troca de imagem de perfil funcionando com preview e compressão `.webp`.
  - [ ] Likes e reações afetivas nos relatos funcionando com animação e persistência no SQLite.
  - [ ] Anexo de múltiplas imagens nos relatos com carrossel e Lightbox.
  - [ ] Galeria de imagens separada funcionando (exibindo fotos de relatos + upload direto de fotos avulsas/álbuns).
  - [ ] Resumo Mensal (Recap do Casal) gerando estatísticas fofas e montagem visual de fotos exportável em PNG.
  - [ ] Grafo interativo funcionando nos 2 modos: Grafo de Relatos Conectados e Grafo de Palavras Repetidas (com sugestões automáticas de palavras frequentes + cadastro manual de palavras).
  - [ ] Card de Versículo Bíblico Diário na Home do Casal (quando ativado) buscando em português (`https://bible-api.com/?random=verse&translation=almeida`), com cache diário, botão de favoritar e fallback offline.
3. **Build & Inicialização no PM2**:
  - Execute `npm run build` para gerar o bundle de produção do cliente.
  - Inicie ou recarregue o processo isolado no PM2 na porta `3001` (`pm2 start ecosystem.config.cjs` e `pm2 save`) e verifique os logs (`pm2 logs mary-pwa --lines 30`) garantindo zero erros.

MÓDULO II — MASTER BLUEPRINT v2.0 (SAAS NACIONAL, CORREÇÃO DE BUGS & 23 NOVOS REQUISITOS)
________________
Master Blueprint v2.0 (SaaS Nacional & Bugfix): App de Casais mary.pyxie.com.br
________________
Este documento foi integralmente atualizado para resolver os 2 bugs críticos de execução encontrados na versão gerada pelo Cline/Gemini Flash 3.8 e expandir o projeto para uma arquitetura SaaS Multi-Casal pronta para comercialização na Google Play Store, cobrindo todos os 23 pontos solicitados e organizando os prompts por Área de Atuação do Agente de IA.
1. Diagnóstico Técnico dos 2 Bugs Atuais (E Como o Prompt 1 os Corrige)
Bug Relatado
	Causa Raiz no Código Gerado pelo Cline
	Correção Definitiva Implementada no Prompt 1
 
	1. Tela preta após postar memória (só volta limpando cache e cookies)
	O endpoint POST /api/memories retorna o objeto recém-criado com campos em formato diferente do GET /api/memories (ex: tags como string JSON '["#amor"]' em vez de Array ['#amor'], ou sem os arrays media: [] e likes: []). Quando o React tenta rodar .map() e salva esse objeto malformado no IndexedDB / MiniSearch, o app quebra na renderização em todo F5 até o cache ser apagado.
	1) Normalizador único formatMemoryDTO() no backend garantindo que POST e GET retornem exatamente a mesma estrutura.
2) Sanitizador defensivo no offlineStorage.js + MiniSearch.replace() seguro.
3) ErrorBoundary global que limpa automaticamente apenas o cache corrompido do IndexedDB sem deslogar o usuário.
	2. Grafos não ligam manualmente entre si e perdem a posição após arrastar
	1) Os nós customizados do React Flow (@xyflow/react) foram criados sem os conectores <Handle type="source" /> e <Handle type="target" />, ou sem disparar POST /api/graph/connections no evento onConnect.
2) O evento onNodeDragStop não estava persistindo as coordenadas positionX e positionY no banco SQLite.
	1) Adição de <Handle /> interativos visíveis no hover/touch e persistência imediata no onConnect.
2) Novas colunas positionX e positionY nas tabelas memories e word_nodes, salvas via PATCH /api/graph/node-position no onNodeDragStop.
	2. Separação do Repositório do Bot (sparkle_heart) Mantendo o Subdomínio (Item 4)
Para desvincular profissionalmente o aplicativo de casais do repositório do bot sparkle_heart sem perder o subdomínio mary.pyxie.com.br:
# 1. Na sua VM (ou máquina local), crie uma pasta fora do repositório kuromi:
mkdir -p ~/nosso-universo-app
cp -r ~/kuromi/apps/mary-pwa/* ~/nosso-universo-app/

# 2. Inicialize um repositório Git 100% independente:
cd ~/nosso-universo-app
git init
git branch -M main
# Crie um repositório privado novo no GitHub (ex: zululuga/nosso-universo-app) e conecte:
git remote add origin git@github.com:zululuga/nosso-universo-app.git
git add .
git commit -m "chore: repositorio independente SaaS de casais"
git push -u origin main

# 3. Atualize o PM2 para apontar para a nova pasta (mantendo a porta 3001 do Nginx!):
pm2 delete mary-pwa
cd ~/nosso-universo-app
pm2 start ecosystem.config.cjs
pm2 save

(Como o Nginx em /etc/nginx/sites-available/mary.pyxie.com.br faz proxy para http://127.0.0.1:3001, o subdomínio continuará funcionando sem tocar no código da Pyxie).
3. Análise de Concorrentes, Referências de Mercado e Como Superamos (Itens 13 e 20)
App de Referência / Concorrente
	Pontos Fortes Deles
	Pontos Fracos no Brasil
	Como o Nosso App Supera
 
	Paired
	Perguntas diárias e quizzes de relacionamento (Google Play).
	Assinatura cara convertida do dólar (~R$ 39,90/mês), sem diário rico, sem grafo visual e sem mapa.
	Preço nacional acessível (R$ 12,90/mês), banco de 1.000 questões (500 Prefiro/Não Gosto + 500 Quem Faria) e criação de perguntas próprias.
	Between
	Chat privado, calendário e álbum compartilhado (Google Play).
	Interface datada, editor de texto simples e armazenamento pago na nuvem deles.
	Editor Literário rico (estilo Blogger + Google Docs + Wattpad) e Backup direto no Google Drive/Fotos do próprio casal (custo zero de disco!).
	SumOne
	Mascote fofo que cresce com respostas diárias.
	Focado apenas em 1 pergunta curta por dia; sem espaço livre de mural ou constelação de memórias.
	Assistente Cupido Anjinha "Mary" + Céu Estelar de Sentimentos Diários + Grafo Interativo de Memórias e Palavras.
	Widgetable
	Widgets de tela inicial, humor e distância (Google Play).
	Excesso de anúncios intrusivos, sem histórico literário profundo nem mural multimídia com Spotify.
	Mural Infinito Arrastável (desenhos, Spotify, vídeos, links), Rastreio em Tempo Real (Mapa + Bateria) e Social Wrappers prontos para Stories/TikTok.
	Questão de Arquitetura: Usar o Google Drive e Google Fotos dos Usuários em vez do Disco da VM (Item 7)
Sim, é totalmente possível e é a melhor decisão de engenharia para um SaaS com planos de R$ 12,90 e R$ 24,90! * Como funciona (Arquitetura Bring Your Own Cloud): 1. Ao conectar a conta Google via OAuth 2.0 com o escopo não-sensível https://www.googleapis.com/auth/drive.appdata (Documentação Oficial Google Drive appDataFolder) e https://www.googleapis.com/auth/drive.file, o aplicativo ganha permissão para salvar as fotos originais, vídeos do mural e o backup do banco SQLite/JSON diretamente nos 15 GB gratuitos do Google Drive do próprio casal. 2. Para importar fotos existentes sem ocupar seu servidor, utilizamos a Google Photos Picker API, que abre o seletor seguro do Google Fotos do usuário. 3. No disco da sua VM ficam apenas: Os metadados de texto (SQLite super leve, poucos kilobytes por casal) e miniaturas .webp de cache temporário (30 KB), reduzindo seu custo de armazenamento em mais de 95%.
4. Engenharia de Planos, Google Ads e Metas de Captação (Itens 8, 12, 16 e 21)
Matriz de Planos e Assinaturas (1 Assinatura libera os recursos para os 2 parceiros!)
Recurso / Funcionalidade
	Plano Gratuito (Freemium)
	Plano Romance (R$ 12,90/mês ou R$ 109,90/ano — 29% OFF)
	Plano Almas Gêmeas VIP (R$ 24,90/mês ou R$ 199,90/ano — 33% OFF)
 
	Exibição de Anúncios (Google AdMob / AdSense)
	Sim (Banner discreto + 1 anúncio ao abrir Recap/Minigame)
	Zero Anúncios para o casal
	Zero Anúncios para o casal
	Editor de Relatos (Blogger + Docs + Wattpad)
	Completo (até 3 fotos por relato)
	Completo (até 15 fotos por relato + Capítulos)
	Ilimitado + Exportação de Livro em PDF
	Grafo de Memórias & Palavras Repetidas
	Até 20 nós de memórias e 10 palavras
	Ilimitado + Sugestões automáticas via NLP
	Ilimitado + Customização de cores/ícones dos nós
	Céu Estelar de Sentimentos Diários & Calendário
	Últimos 14 dias no Céu Estelar
	Histórico Anual Completo + Calendário Emocional
	Histórico Vitalício + Insights de Sintonia do Casal
	Minigames (500 Prefiro/Não Gosto + 500 Quem Faria)
	5 rodadas por dia
	Acesso Ilimitado às 1.000 questões
	Ilimitado + Criar Perguntas Próprias para o Parceiro
	Espaço do Casal (Mural Arrastável)
	Até 10 elementos (post-its e texto)
	Até 50 elementos (inclui fotos e 1 playlist Spotify)
	Mural Infinito (Desenhos livres, Spotify, Vídeos, Sites/Embeds)
	Rastreio em Tempo Real (Mapa + % de Bateria)
	Visualização de distância em km
	Mapa ao vivo sob demanda
	Tempo Real Contínuo + Alertas de Bateria Fraca e Chegada
	Backup Google Drive & Google Fotos
	Backup manual sob demanda
	Backup automático diário no Google Drive
	Sync Contínuo Google Drive + Integração Google Fotos
	Temas, Widgets & Social Wrappers
	2 Temas base + Wrappers com marca d'água
	6 Temas + Wrappers HD sem marca d'água
	Todos os Temas Imersivos Animados + Widgets de Tela Inicial
	Plano de Divulgação, Google Ads e Metas de Investimento (Item 8 e 21)
Para posicionar o aplicativo no meio de outros aplicativos de relacionamento, calendários menstruais, jogos de casal e redes sociais, a estratégia combina Campanhas para Apps do Google Ads (UAC) (que exibem anúncios nativos na pesquisa da Play Store quando alguém digita "Paired", "Widgetable", "app de casal", "diário de namoro", além de YouTube Shorts e rede AdMob dentro de outros apps) com Viralização Orgânica via Social Wrappers (Item 15):
Cenário de Investimento
	Gasto Mensal em Ads
	Instalações Estimadas (CPI ~R$ 1,50 a R$ 2,20)
	Meta de Casais Ativos (MAU)
	Conversão Estimada Pagantes (5%)
	Receita Mensal Estimada (Assinaturas + AdMob)
 
	1. Validação (Mínimo)
	R$ 300 a R$ 500/mês
	200 a 330 instalações + orgânico
	~250 casais
	12 a 15 casais assinantes
	R$ 260 a R$ 380/mês (Empate técnico no 2º mês devido à retenção cumulativa)
	2. Tração (Moderado)
	R$ 1.500/mês
	800 a 1.000 instalações + viralização TikTok/Stories
	~1.200 casais
	60 casais novos/mês (acumulando ~350 no semestre)
	**R$ 1.100/mês no Mês 1 $
	ightarrow$ R$ 6.200/mês no Mês 6**
	

	

	

	

	

	3. Escala Nacional (Máximo Inicial)
	R$ 4.500 a R$ 6.000/mês
	2.500 a 4.000 instalações + micro-influenciadores de casais
	~5.000 casais
	250 casais novos/mês (acumulando >1.500 no semestre)
	**R$ 4.500/mês no Mês 1 $
	ightarrow$ >R$ 26.000/mês no Mês 6**
	

	

	

	

	

	5. Design System (Especificação Figma), Novos Temas e Assistente Anjinha "Mary" (Itens 9, 21 e 22)
Mudança Completa de Temas (Desvinculado da Pyxie/Kuromi)
O aplicativo abandona as referências ao bot do Discord e adota 4 paletas nacionais sofisticadas (configuradas via tokens CSS para prototipação direta no Figma e no Tailwind): 1. Aurora Romântica (Padrão Dark): Fundo #0E0B16, Superfície Glass rgba(28, 21, 42, 0.75), Primária #F43F5E (Rosa Rubi), Secundária #FBBF24 (Dourado Estelar), Texto #FAF5FF. 2. Solaris & Luna (Modo Claro Editorial): Fundo #FFFDF9 (Papel Creme Wattpad), Superfície #F5EFE6, Primária #E11D48, Secundária #D97706, Texto #1C1917. 3. Cosmos Aveludado (Imersivo Premium): Fundo #060814 com partículas estelares em Canvas, Superfície rgba(15, 23, 42, 0.78), Primária #818CF8 (Índigo Celestial), Secundária #38BDF8 (Azul Nebulosa). 4. Jardim de Cerejeira (Sakura Premium): Fundo #1A0F16, Superfície rgba(45, 22, 36, 0.75), Primária #FB7185 (Sakura), Secundária #34D399 (Folha de Chá).
Especificação Visual da Assistente Introdutória: Anjinha Cupido "Mary" (Item 22)
* Conceito & Personalidade: Uma cupido guardiã das memórias do casal — acolhedora, bem-humorada, delicada e prestativa.
* Aparência & Estética Visual (Design Sheet para SVG/Lottie/Ilustração):
* Silhueta: Estilo Chibi/Kawaii moderno com proporções suaves, cabelo ondulado em tom rosa-champanhe perolado (#FBCFE8 com mechas iluminadas #FEF08A).
* Acessórios: Uma auréola dourada flutuante (#FBBF24) que pulsa suavemente acima da cabeça, asinhas de anjo translúcidas com brilho iridescente, vestido fluido branco-nuvem com detalhes em fita carmesim (#F43F5E) e um pequeno arco de cupido dourado que dispara estrelas em vez de flechas comuns.
* 5 Expressões do Componente <MaryCupidAvatar state="..." />: welcoming (acenando com sorriso doce), explaining (segurando um pergaminho luminoso), excited (olhos brilhando em formato de estrela ao mostrar recursos Premium), love (abraçando um coração pulsante) e sleeping (dormindo sobre uma nuvem nos estados vazios).
6. Estrutura de Prompts Dividida por Área de Atuação do Agente de IA (Item 20)
Copie e envie cada um dos 5 Prompts Especializados abaixo em sequência no Cline / VS Code.
PROMPT AGENTE 1: Engenheiro de Core, Bugfix (Tela Preta & Grafo), Multi-Tenancy SaaS e Cadastro com Signos (Itens 1, 2, 3, 6, 10, 11 e 14)
# [AGENTE 1/5 — CORE & BACKEND SAAS] CORREÇÃO DOS BUGS CRÍTICOS, MULTI-TENANCY, CADASTRO COM SIGNOS E CRUD DE PERSONALIZAÇÃO

Atue como Arquiteto de Software Sênior. O projeto atual apresentou dois bugs críticos em produção e agora será elevado para uma arquitetura **Multi-Casal (Multi-Tenant SaaS)** pronta para a Google Play Store.

## 1. CORREÇÃO DEFINITIVA DO BUG 1 (Tela Preta após Postar Memória)
O aplicativo fica com a tela preta após criar uma memória porque o retorno do `POST /api/memories` diverge do formato do `GET /api/memories` (causando exceção em `.map()` de `tags`, `media` ou `likes` e corrompendo o cache do `IndexedDB`/`MiniSearch`).
Execute obrigatoriamente:
1. No Backend (`server/routes/memories.js`), crie uma função utilitária `normalizeMemoryDTO(rawMemory, mediaList, likesList, connectionsList)` que SEMPRE garanta:
  - `tags`: sempre um Array de strings válido (`Array.isArray(parsed) ? parsed : []`).
  - `media`: sempre um Array válido (`mediaList || []`).
  - `likes`: sempre um Array válido (`likesList || []`).
  - `connections`: sempre um Array válido (`connectionsList || []`).
  Use `normalizeMemoryDTO` tanto no retorno do `GET /api/memories` quanto no retorno do `POST /api/memories` e `PUT /api/memories/:id`.
2. No Frontend (`offlineStorage.js` e `searchEngine.js`):
  - Antes de indexar no `MiniSearch`, use `miniSearch.discard(id)` caso o ID já exista ou reconstrua o índice com `try/catch` sem jamais lançar exceção não tratada na árvore do React.
  - Crie um componente `<AppErrorBoundary>` envolvendo a aplicação: se ocorrer qualquer erro de renderização, ele limpa automaticamente a chave de cache do `IndexedDB` (`idb-keyval`), exibe uma animação amigável de 1 segundo e recarrega o estado limpo sem exigir que o usuário limpe cookies manualmente!
3. Implemente **Optimistic UI + Shimmer Skeletons (Item 10)**:
  - Adicione skeletons animados com brilho suave (`animate-pulse` + gradiente temático) para carregamentos que demorem mais de 150ms, mantendo transições instantâneas para ações locais.

## 2. CORREÇÃO DEFINITIVA DO BUG 2 (Grafo Manual e Persistência de Posição)
1. Adicione as colunas `positionX` (`real default 0`) e `positionY` (`real default 0`) nas tabelas `memories` e `word_nodes`.
2. Crie a rota `PATCH /api/graph/node-position` recebendo `{ nodeType: 'memory' | 'word', id, x, y }` e salvando imediatamente no SQLite.
3. Crie a rota `POST /api/graph/connections` recebendo `{ sourceMemoryId, targetMemoryId, label }` e `DELETE /api/graph/connections/:id`.
4. No componente do Grafo (`RelationshipGraphView.jsx` com `@xyflow/react`):
  - Nos componentes de nó customizados, adicione explicitamente `<Handle type="target" position={Position.Top} className="w-3 h-3 bg-rose-500" />` e `<Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-400" />`.
  - Habilite `nodesConnectable={true}` e `nodesDraggable={true}`.
  - Implemente `onConnect={(params) => ...}` chamando `POST /api/graph/connections` e adicionando a aresta com `addEdge`.
  - Implemente `onNodeDragStop={(event, node) => ...}` chamando `PATCH /api/graph/node-position` para que a posição fique salva permanentemente no banco de dados!

## 3. ARQUITETURA MULTI-CASAL (MULTI-TENANCY) E CADASTRO COM SIGNOS (Itens 3 e 6)
1. Crie a tabela `couples`:
  - `id` (PK), `coupleName` (text), `inviteCode` (text unique de 6 caracteres, ex: `'AMOR99'`), `anniversaryDate` (text), `planTier` (`'freemium' | 'romance' | 'almas_gemeas'`, default `'freemium'`), `planExpiresAt` (text), `enableBibleVerses` (integer default `0` — **desabilitado por padrão conforme Item 14**), `googleDriveFolderId` (text nullable), `createdAt` (text).
2. Adicione `coupleId` (FK -> `couples.id`) em todas as tabelas (`users`, `memories`, `memory_media`, `word_nodes`, `custom_tags`, `custom_albums`, `custom_moods`, `daily_feelings`, `canvas_items`, `custom_questions`).
3. No módulo de **Cadastro e Onboarding de Novos Usuários (`/api/auth/register` e `RegisterWizard.jsx`)**:
  - Campos de cadastro: Nome de exibição, Apelido carinhoso, E-mail, Senha, **Data de Nascimento**, **Data de Início do Relacionamento**, e opção de *"Criar Novo Espaço de Casal (gerar código)"* ou *"Entrar com Código do Parceiro"*.
  - **Cálculo Automático de Signo + Ícones de Biblioteca**: A partir da data de nascimento, calcule automaticamente o signo (`aries`, `taurus`, `gemini`, `cancer`, `leo`, `virgo`, `libra`, `scorpio`, `sagittarius`, `capricorn`, `aquarius`, `pisces`) e salve em `users.zodiacSign`. No frontend, instale `@iconify/react` e renderize o ícone vetorial oficial de cada signo (`<Icon icon={`mdi:zodiac-${user.zodiacSign}`} />`).

## 4. CRUD COMPLETO DE TAGS, ÁLBUNS, HUMORES E TOGGLE DE VERSÍCULOS (Itens 11 e 14)
1. Crie as tabelas `custom_tags`, `custom_albums` e `custom_moods` vinculadas ao `coupleId` (populadas inicialmente com padrões no cadastro do casal, mas permitindo **criar novas** com nome, cor e ícone Lucide/Phosphor e **excluir ou editar qualquer uma das pré-existentes**).
2. Nas Configurações, adicione o interruptor `"Exibir Versículo Bíblico Diário na Home"` (`enableBibleVerses`), que vem **desabilitado por padrão (`false`)** para novos casais e pode ser ativado por qualquer usuário a qualquer momento.

PROMPT AGENTE 2: Designer de UI/UX, Assistente Anjinha Cupido "Mary" e Editor Literário Blogger + Docs + Wattpad (Itens 9, 19, 21 e 22)
# [AGENTE 2/5 — UI/UX, ASSISTENTE MARY & EDITOR LITERÁRIO] NOVOS TEMAS, ANJINHA CUPIDO MARY E EDITOR TIPTAP (BLOGGER + GOOGLE DOCS + WATTPAD)

Atue como Especialista em Design System (Figma-to-Code) e Engenheiro Front-end React.

## 1. Nova Identidade Visual Distanciada do Bot Pyxie (Itens 9 e 21)
Substitua completamente qualquer referência visual ao bot Pyxie/Kuromi por 4 temas nacionais elegantes em variáveis CSS (`data-theme`):
- `aurora-romantica` (Dark Rubi & Dourado Estelar)
- `solaris-luna` (Modo Claro Editorial Creme & Terracota estilo leitura Wattpad)
- `cosmos-aveludado` (Premium: Azul Nebulosa & Índigo com partículas estelares)
- `jardim-sakura` (Premium: Sakura Pastel & Verde Chá)

## 2. Assistente Introdutória Fofa: Anjinha Cupido "Mary" (`MaryCupidAssistant.jsx` — Item 22)
Crie a mascote e guia oficial do aplicativo chamada **Mary**, uma anjinha cupido fofa:
- **Componente Visual (`MaryCupidAvatar.jsx`)**: Renderize um SVG vetorial rico e animado com Framer Motion contendo: auréola dourada flutuante (`animate={{ y: [-3, 3, -3] }}`), asinhas de cupido translúcidas que batem suavemente, cabelos rosa-champanhe, bochechas coradas e arco de cupido com estrelas, suportando as expressões `welcoming`, `explaining`, `excited`, `love` e `sleeping`.
- **Tour Guiado Pós-Cadastro (`MaryOnboardingTour.jsx`)**:
 - Assim que o usuário conclui o cadastro, a Anjinha Mary aparece em um card flutuante interativo com balões de fala animados passo a passo:
   1. Dá as boas-vindas ao casal e mostra como copiar/enviar o **Código de Pareamento** para o parceiro.
   2. Apresenta as abas principais (*Diário Literário, Céu de Sentimentos, Mural do Casal, Grafo de Conexões, Mapa ao Vivo e Minigames*).
   3. Explica com carisma as vantagens dos planos **Romance (R$ 12,90/mês)** e **Almas Gêmeas VIP (R$ 24,90/mês)**, oferecendo um botão para testar ou continuar no plano Gratuito.
 - Adicione um botão discreto da Anjinha Mary no canto da tela para reabrir dicas ou ajuda quando o usuário quiser.

## 3. Novo Editor de Relatos: Inspiração Blogger + Google Docs + Wattpad (`RichStoryEditor.jsx` — Item 19)
Instale e configure o **Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-color`, `@tiptap/extension-highlight`, `@tiptap/extension-text-align`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`, `@tiptap/extension-character-count`)**:
- **Barra de Ferramentas Estilo Google Docs / Blogger**:
 - Seletor de Tipografia do Relato (Serifada Literária `'Merriweather'`, Moderna `'Plus Jakarta Sans'`, Manuscrita Romântica `'Caveat'`).
 - Formatação completa: Títulos (H1, H2, H3), Negrito, Itálico, Sublinhado, Tachado, Seletor de Cores de Texto e Marca-texto (Highlight pastel), Alinhamento (Esquerda, Centro, Direita, Justificado), Citações em destaque, Divisores ornamentados (`---` com estrela central) e **Inserção de Fotos Inline entre os parágrafos** (com ajuste de alinhamento e legenda).
- **Modo Escrita Imersiva Estilo Wattpad**:
 - Botão *"Modo Foco / Wattpad"* que recolhe menus laterais, aplica fundo de página literária aconchegante, exibe **Contador de Palavras e Tempo Estimado de Leitura** no topo, **Salvamento Automático de Rascunho (`autosave`)** a cada 2 segundos no `IndexedDB`/servidor, suporte a dividir relatos longos em **Capítulos / Partes** e permitir que o parceiro deixe **reacões ou comentários inline em parágrafos específicos** (exatamente como no Wattpad!).

PROMPT AGENTE 3: Céu Estelar de Sentimentos Diários + Calendário + Espaço do Casal (Mural Arrastável) (Itens 18 e 23)
# [AGENTE 3/5 — CÉU DE SENTIMENTOS & MURAL COLABORATIVO] GRAFO ESPACIAL DE SENTIMENTOS DIÁRIOS E ESPAÇO DO CASAL ARRASTÁVEL

Atue como Creative Developer especialista em Canvas Interativo, SVG e Framer Motion.

## 1. Grafo Espacial de Sentimentos Diários + Calendário (`DailyFeelingsSkyView.jsx` — Item 18)
Crie um módulo onde cada parceiro registra como está se sentindo no dia (escolhendo entre os humores customizáveis do casal + uma nota curta do motivo):
- **Tabela `daily_feelings`**: `id`, `coupleId`, `userId`, `feelingDate` (`YYYY-MM-DD`), `moodId`, `moodLabel`, `moodColor`, `moodIcon`, `intensity` (1 a 5), `note`, `createdAt`.
- **Visualização 1: Formato de Espaço com Estrelas (Padrão)**:
 - Renderize um céu noturno profundo onde **cada sentimento registrado é uma estrela luminosa** com a cor e o brilho daquela emoção.
 - **Alinhamento Temporal Vertical**: Os sentimentos do **dia atual (`Hoje`) ficam alinhados no topo do céu** (lado a lado: a estrela de hoje de um parceiro conectada por um feixe de luz à estrela de hoje do outro, permitindo ver imediatamente como o parceiro está se sentindo hoje!).
 - **Descida Cósmica conforme os dias passam**: Conforme novos dias chegam, as estrelas dos dias anteriores **vão descendo suavemente pelo eixo Y** (formando uma constelação vertical cronológica que desce pelo espaço!). Clicar em qualquer estrela abre o balão com o sentimento e a nota daquele dia.
- **Visualização 2: Calendário Emocional & Resumo Mensal**:
 - Botão de alternância no topo (`Céu de Estrelas` | `Calendário Mensal`) que exibe o mês em grade, pintando cada dia com um círculo bicolor (metade a cor do sentimento do Parceiro A, metade a cor do Parceiro B) e alimentando automaticamente o **Resumo Mensal (Recap)**.

## 2. Espaço do Casal: Mural em Branco Arrastável (`CoupleSpaceCanvas.jsx` — Item 23)
Crie uma aba dedicada chamada **"Nosso Mural"** — um quadro infinito (com pan e zoom suaves) onde os elementos são livremente arrastáveis, redimensionáveis e rotacionáveis em tempo real:
- **Tabela `canvas_items`**: `id`, `coupleId`, `createdBy`, `itemType` (`'note' | 'drawing' | 'photo' | 'spotify' | 'video' | 'link' | 'sticker'`), `x` (real), `y` (real), `width` (real), `height` (real), `rotation` (real), `zIndex` (integer), `payloadJson` (text JSON), `updatedAt`.
- **Tipos de Elementos Suportados no Mural**:
 1. **Desenhos à Mão Livre (`drawing`)**: Ferramenta de pincel/caneta neon e pastel onde um pode desenhar no mural para o outro ver.
 2. **Playlists e Músicas do Spotify (`spotify`)**: O usuário cola o link de uma música ou playlist do Spotify e o sistema converte automaticamente para o player oficial `https://open.spotify.com/embed/playlist/...` ou `track/...` arrastável no mural!
 3. **Vídeos e Embeds (`video` / `link`)**: Suporte a embeds do YouTube, TikTok ou cards de sites favoritos do casal com preview.
 4. **Post-its, Stickers e Polaroids (`note` / `photo`)**: Notas adesivas coloridas e fotos recortadas.
- **Trava Inteligente por Plano de Assinatura**:
 - No plano `freemium`, permita até 10 itens leves no mural.
 - Nos planos `romance` (até 50 itens) e `almas_gemeas` (ilimitado + desenhos pesados, vídeos e múltiplos embeds), libere todas as ferramentas avançadas de personalização.

PROMPT AGENTE 4: Rastreio em Tempo Real (Mapa + Bateria), Google Drive/Fotos e Minigames 1.000 Questões (Itens 5, 7 e 17)
# [AGENTE 4/5 — MAPA AO VIVO, GOOGLE CLOUD BYOS & MINIGAMES] LOCALIZAÇÃO + BATERIA EM TEMPO REAL, GOOGLE DRIVE/FOTOS E 1.000 QUESTÕES DE CASAL

Atue como Engenheiro Fullstack especialista em Geolocalização, APIs do Google e Gamificação.

## 1. Rastreio em Tempo Real do Parceiro: Localização + Bateria (`LivePartnerTracker.jsx` — Item 5)
Implemente um sistema de presença ao vivo (com consentimento mútuo ativável pelo casal):
- **Captura no Cliente (`usePartnerTelemetry.js`)**:
 - Usa `navigator.geolocation.watchPosition` (alta precisão) para obter `latitude`, `longitude`, `accuracy` e `speed`.
 - Usa a **Battery Status API (`navigator.getBattery()`)** para ler `level` (0 a 100%) e `charging` (`true/false`), atualizando via WebSocket ou polling leve (`POST /api/telemetry/ping`).
- **Mapa Interativo (`Leaflet` + camadas customizadas / suporte a chave `VITE_GOOGLE_MAPS_API_KEY`)**:
 - Exibe no mapa os avatares dos dois parceiros com **indicador ao vivo da porcentagem de bateria** (ícone `BatteryCharging`, `BatteryFull` ou alerta vermelho `BatteryWarning` se `< 15%`), horário da última atualização, **distância exata entre o casal** (em metros ou km) e botão *"Traçar Rota até Meu Amor"*.

## 2. Integração com Google Fotos & Backup no Google Drive dos Usuários (`googleCloudSync.js` — Item 7)
Implemente a arquitetura *Bring Your Own Storage (BYOS)* para economizar disco do servidor:
- Crie o fluxo OAuth2 e serviços para:
 1. **Backup no Google Drive do Casal**: Usando a Google Drive API v3 (`appDataFolder` ou pasta visível `"Nosso Universo - Backup"`), permita exportar e sincronizar automaticamente o pacote de memórias e mídias diretamente para o Google Drive dos usuários (`POST /api/cloud/drive-backup` e `POST /api/cloud/drive-restore`).
 2. **Importação via Google Photos Picker API**: Botão *"Escolher do Google Fotos"* na Galeria e no Editor de Relatos para importar fotos diretamente da biblioteca do casal.

## 3. Módulo de Minigames do Casal: 1.000 Questões + Perguntas Próprias (`CoupleMinigamesView.jsx` — Item 17)
Crie o hub de jogos de sintonia do casal com dois modos principais e geração/seed estruturada de **1.000 questões em português**:
1. **Jogo 1 — "Prefiro / Não Gosto" (Banco de 500 Questões de Compatibilidade)**:
  - Crie um script gerador de seed (`server/db/seedQuestions.js`) que popula **500 questões categorizadas** (Cotidiano, Viagens, Romantismo, Gastronomia, Futuro & Casa, Lazer & Filmes, Finanças, Hábitos) onde cada parceiro vota em *"Prefiro / Amo"*, *"Neutro"* ou *"Não Gosto"*.
  - Quando ambos respondem, o sistema calcula a **Porcentagem de Compatibilidade Geral e por Categoria**, exibindo onde vocês combinam e onde se completam!
2. **Jogo 2 — "Quem Faria Tal Coisa?" (Banco de 500 Questões Divertidas)**:
  - Popule **500 perguntas no estilo "Quem é mais provável de..."** (ex: *"Quem dormiria nos primeiros 10 minutos do filme?"*, *"Quem gastaria todo o dinheiro em comida?"*, *"Quem pediria desculpas primeiro depois de uma discussão boba?"*).
  - Cada um vota em `[Eu]` ou `[Meu Amor]` e a tela revela se vocês concordaram!
3. **Feature Premium (Planos Pagos) — Criar Perguntas Próprias (`CustomQuestionModal.jsx`)**:
  - Permite que qualquer um dos parceiros crie perguntas personalizadas de *"Prefiro/Não Gosto"*, *"Quem Faria"* ou *"Pergunta Aberta"* exclusivas para o parceiro responder, disparando uma notificação Push imediata!

PROMPT AGENTE 5: Monetização (Freemium / Romance / Almas Gêmeas), Social Wrappers Virais e Widgets (Itens 8, 12, 15 e 16)
# [AGENTE 5/5 — MONETIZAÇÃO, SOCIAL WRAPPERS & WIDGETS] PLANOS DE ASSINATURA, ANÚNCIOS, COMPARTILHAMENTO PARA REDES SOCIAIS E WIDGETS

Atue como Engenheiro de Growth, Monetização Mobile e Front-end Criativo.

## 1. Sistema de Planos, Paywall e Anúncios (`PricingAndPlansModal.jsx` — Itens 8 e 12)
Implemente o controle de assinaturas (onde 1 assinatura ativa no `coupleId` libera os benefícios para ambos os parceiros):
1. **Plano Gratuito (Freemium)**:
  - Exibe componente `<AdBannerSlot />` (compatível com Google AdSense Web / AdMob via WebView/TWA) de forma limpa entre seções não sensíveis e antes de desbloquear o Recap Mensal gratuito.
2. **Plano Romance — R$ 12,90/mês (ou Anual por R$ 109,90/ano — 29% de desconto)**:
  - Remove 100% dos anúncios para o casal, libera as 1.000 questões dos minigames sem limite diário, histórico anual do Céu de Sentimentos, até 50 itens no Mural e backup automático no Google Drive.
3. **Plano Almas Gêmeas (VIP) — R$ 24,90/mês (ou Anual por R$ 199,90/ano — 33% de desconto)**:
  - Libera tudo do Romance + Criação de Perguntas Próprias nos Minigames, Mural do Casal Infinito com Spotify/Vídeos/Desenhos, Rastreio em Tempo Real contínuo (Mapa + Bateria), Temas Imersivos animados e Widgets exclusivos.
4. Adicione um seletor de ciclo de cobrança (`Mensal` vs. `Anual com Desconto` com badge *"Mais Popular / Economize até 33%"*) e rotas de webhook preparadas para Google Play Billing / RevenueCat / Stripe Pix.

## 2. Social Wrappers Compartilháveis para Instagram Stories, TikTok e WhatsApp (`SocialShareWrapperModal.jsx` — Item 15)
Crie um gerador de cards verticais (`1080x1920px` proporção 9:16 para Stories/TikTok e `1080x1350px` para Feed) usando `html-to-image` + **Web Share API nativa (`navigator.share({ files, title, text })`)**:
- O casal pode gerar e compartilhar com 1 clique:
 1. **Wrapper de Resumo do Mês (Recap Polaroid + Estatísticas)**.
 2. **Wrapper de Compatibilidade dos Minigames** (ex: *"Temos 94% de sintonia em Viagens & Romance!"*).
 3. **Wrapper do Céu de Sentimentos do Mês** (constelação das emoções do casal).
 4. **Wrapper do Contador de Tempo Juntos + Signos do Casal** (ex: *"Leão + Libra • 250 Dias Juntos"*).
- Inclua botões diretos com ícones vetoriais para *"Compartilhar nos Stories"*, *"Enviar no WhatsApp"* e *"Baixar Imagem HD"*.

## 3. Widgets de Tela Inicial & Atalhos Dinâmicos (`WidgetDataEndpoint` — Item 16)
- Crie o endpoint autenticado `GET /api/widgets/summary` (e suporte a *PWA Web App Widgets* / *Android App Widgets* via TWA/Capacitor) retornando um JSON ultraleve com:
 - Dias juntos, humor atual do parceiro (com cor e ícone da estrela de hoje), distância atual em km, bateria do parceiro e última foto favorita da galeria.
- Na aba de Ajustes Premium, crie um **Preview Interativo de Widgets** mostrando como os 3 estilos de Widget (*Widget de Humor & Bateria*, *Widget de Foto Polaroid do Dia* e *Widget de Contador & Distância*) ficam na tela inicial do celular.

MÓDULO III — ATUALIZAÇÃO v3.0: ARMAZENAMENTO UNIVERSAL (SEM CONTA GOOGLE), ABA DE RECOMPENSAS & TRENDS VIRAIS, PAINEL ADMIN DE MÉTRICAS, ESTRATÉGIA DE AGENTES/FIGMA E TERMOS LEGAIS (LGPD)
________________
Esta seção consolida as novas diretrizes de produção comercial, removendo qualquer referência pessoal (mantendo única e exclusivamente a homenagem à Mary na mascote Anjinha Cupido Mary) e adicionando a arquitetura para usuários sem conta Google, o sistema de recompensas virais estilo Widgetable, o painel administrativo de métricas e os textos legais obrigatórios da LGPD.
1. Arquitetura de Armazenamento Universal: Acolhendo Todos os Cenários de Usuários (Com e Sem Conta Google)
Para que nenhum usuário seja excluído ou tenha uma experiência inferior caso não possua conta no Google, use iPhone (iCloud)/Outlook ou prefira não vincular seu Google Drive, o aplicativo opera com um Motor de Armazenamento Triplo Transparente (StorageRouterService):
Cenário do Usuário / Casal
	Onde os Dados e Fotos ficam Salvos
	Como Funciona na Prática (Sem fricção para o usuário)
 
	Cenário 1: Usuário SEM Conta Google (Cadastro por E-mail/Senha, Outlook, iCloud) ou que não ativou o Drive
	Nuvem Própria do App (VM + Cloudflare R2) + Cache Persistente Local (IndexedDB / OPFS)
	Todas as fotos enviadas passam pelo pipeline Sharp convertendo para .webp/.avif ultracompactos (~30 KB a 45 KB por foto).
• Plano Gratuito: Recebe 150 MB na Nuvem do App (suficiente para ~4.000 fotos otimizadas!).
• Plano Romance: Recebe 2 GB na Nuvem do App (~50.000 fotos).
• Plano Almas Gêmeas: Recebe 10 GB na Nuvem do App.
O usuário não precisa configurar nada: basta criar conta com qualquer e-mail e usar normalmente.
	Cenário 2: Usuário COM Conta Google Conectada (BYOS — Bring Your Own Storage)
	Google Drive do Usuário (appDataFolder) + Google Photos Picker API
	Desbloqueia armazenamento de mídia em resolução original usando os 15 GB gratuitos do Google Drive do próprio usuário, aliviando o armazenamento do servidor do app e dando bônus de espaço ilimitado no aplicativo.
	Cenário 3: Casal Misto (Parceiro A tem Conta Google, Parceiro B não tem)
	Cofre Compartilhado Híbrido
	Se apenas um dos parceiros vincular o Google Drive, o sistema permite usar esse Drive como cofre de backup automático para ambos os membros do casal, mantendo espelhamento transparente para o parceiro sem conta Google.
	Cenário 4: Uso Offline / Sem Internet (Viagens, Avião, Subsolo)
	Origin Private File System (OPFS) + IndexedDB (navigator.storage.persist())
	O app solicita armazenamento persistente no navegador/PWA. Relatos, desenhos do mural, votos nos minigames e fotos ficam salvos no dispositivo e sincronizam silenciosamente via Background Sync assim que houver conexão.
	Cenário 5: Troca de Celular sem Conta Google (Backup Portátil Criptografado)
	Login Direto na Nuvem do App + Arquivo .universo (ZIP/AES-256)
	Além de recuperar tudo apenas fazendo login com E-mail e Senha em um celular novo, qualquer casal pode clicar em "Baixar Cofre de Backup (.universo)" para salvar um arquivo único criptografado no celular, iCloud, WhatsApp ou computador.
	2. Aba de Recompensas & Central de Trends Virais (Estilo Widgetable)
Inspirado no motor de crescimento viral do Widgetable, o aplicativo conta com uma Aba Dedicada de Recompensas & Trends (RewardsAndTrendsView.jsx), além de gatilhos contextuais automáticos ao final de cada rodada dos Minigames (Prefiro/Não Gosto e Quem Faria), no Resumo Mensal e no Céu de Sentimentos:
Como funciona o Gerador de Vídeos e Templates de Trends de Casal
4. Gerador Nativo de Vídeos Curtos (9:16 para TikTok / Reels / Shorts):
5. Utilizando um <canvas> oculto em 1080x1920px (60fps) gravado em tempo real via MediaRecorder API, o app gera vídeos animados de 10 a 15 segundos com a estética do casal, animações da Anjinha Mary e trilha sonora instrumental livre de direitos:
   * Template 1 (Pós-Minigame): "Respondemos 10 perguntas de 'Quem é mais provável' e nossa compatibilidade deu X%!" (mostra as perguntas e os avatares dos dois votando).
   * Template 2 (Thread de Casal / Carrossel): Gera de 3 a 5 imagens prontas no formato de Thread de Casal para TikTok Photo Mode / Instagram Carrossel ("1. Nosso signo e tempo juntos $ ightarrow$ 2. Nosso Céu de Sentimentos do mês $ ightarrow$ 3. Nossa palavra mais repetida $ ightarrow$ 4. Nosso Mural").
   * Template 3 (Tour pelo Mural & Constelação): Vídeo curto dando zoom cinematográfico pela Árvore de Memórias ou pelo Céu de Sentimentos do casal.
6. Sistema de Missões e Recompensas (Share-to-Earn):
7. Dentro da Aba Recompensas (corações/estrelas douradas), os usuários encontram missões claras:
   * Missão Diária — Compartilhar Resultado do Minigame nos Stories/Status: +20 Cristais de Cupido (libera +5 rodadas extras nos Minigames ou stickers exclusivos no Mural).
   * Missão Criador — Postar Vídeo/Trend no TikTok ou Instagram Reels com a hashtag oficial do app e colar o link da postagem no app: O sistema valida a URL pública da postagem e concede automaticamente 7 dias grátis do Plano Romance (e se o vídeo bater 5.000 visualizações, concede 1 mês grátis do Plano Almas Gêmeas VIP!).
   * Missão Convite de Casais (Referral): A cada casal amigo que se cadastrar e parear usando o código de indicação do usuário, ambos os casais ganham 15 dias de Plano Romance sem anúncios!
3. Estratégia de Execução: Qual Modelo Usar, Design no Figma, Assets e Controle de Métricas
3.1. Qual Modelo de Agente Entrega a Melhor Qualidade Visual e Código Sem Gargalos?
Considerando que você possui Claude Code (R$ 120/mês), Google AI Pro (Gemini 2.5 Pro) e possibilidade de DeepSeek API (Pay-as-you-go), a combinação abaixo extrai o máximo de qualidade visual sem estourar os limites de mensagens:
Ferramenta / Assinatura
	Onde ela é Imbatível
	Quais Tarefas e Prompts Executar Nela
 
	Claude Code (Assinatura R$ 120 — Sonnet 4 / 3.7 Sonnet)
	Qualidade Visual de UI/UX, CSS Avançado, Animações Framer Motion e Arquitetura React Complexa
	Use exclusivamente para construir as telas visuais (Design System, Editor Tiptap, Grafo Interativo, Céu de Sentimentos, Mural Arrastável e Correção de Bugs de Estado). O Claude evita "layouts quadrados genéricos" e escreve componentes Tailwind com profundidade visual superior.
	Google AI Pro (Gemini 2.5 Pro — Janela de 1M+ Tokens)
	Auditoria de Repositório Inteiro, Integrações Google (Drive/Photos/Maps) e Arquitetura de Segurança
	Use para revisar todo o código de uma vez quando o projeto crescer, validar as rotas da Google Drive API, gerar scripts de deploy/Nginx e auditar regras de negócio multi-tenant.
	DeepSeek API (deepseek-chat V3 / R1) (Pay-as-you-go no Cline)
	Volume Massivo de Dados, Geração das 1.000 Questões, Seeds SQL e Testes Automatizados a Custo Quase Zero
	Use no Cline para gerar os arquivos JSON/SQL com as 500 questões de "Prefiro/Não Gosto" e as 500 questões de "Quem Faria", criar migrations longas do Drizzle ORM e páginas estáticas (Termos/Privacidade). Assim você economiza 100% da cota do Claude Code para o código nobre!
	3.2. Como Fazer Designs Ricos no Figma (Sem "Quadrados Básicos") e Gerar Assets Sob Demanda
1. Conectando o Figma direto ao Claude Code via Figma MCP Server:
2. No Figma, utilize kits de UI modernos com bordas squircle (border-radius: 28px), gradientes radiais multi-ponto (Mesh Gradients), camadas de ruído sutil (svg noise overlay 3%), sombras coloridas difusas (box-shadow: 0 20px 50px -12px rgba(244, 63, 94, 0.25)) e divisores curvos/orgânicos.
3. Ative o Figma MCP Server no seu Claude Code: basta colar o link do frame do Figma no prompt e o Claude Code lê as medidas exatas, tokens de cores e auto-layout em vez de improvisar caixas quadradas.
4. Pipeline de Geração de Assets Visuais e da Mascote Anjinha "Mary":
5. Vetores e Ilustrações Escaláveis (.svg): Use o Recraft AI Vector Generator (modo Vector SVG). Defina uma paleta fixa e gere em .svg puro as 5 expressões da Anjinha Cupido Mary, os ícones especiais de humor, as molduras de avatar e os pacotes de stickers do Mural.
6. Animações Interativas Leves (.riv / .json): Importe o SVG da Anjinha Mary no Rive ou no LottieFiles para criar uma State Machine de 15 KB onde as asinhas batem continuamente, a auréola flutua e os olhos brilham quando o casal ganha uma recompensa.
3.3. Como Controlar Usuários, Armazenamento (Próprio vs. App), Assinantes por Plano e Funções Mais Usadas
O sistema inclui um Painel SuperAdmin de Telemetria e Negócios (/admin/metrics) protegido por chave mestra no seu backend (combinado opcionalmente com o plano gratuito de 1 milhão de eventos/mês do PostHog Product Analytics): * Métricas em Tempo Real no seu Banco SQLite + Dashboard Admin: 1. Usuários e Casais: Total de usuários cadastrados, total de casais pareados, novos cadastros hoje/semana/mês e usuários ativos (DAU/MAU). 2. Auditoria de Armazenamento (storage_metrics): - Espaço total ocupado no disco da VM / Cloudflare R2 (em MB e GB). - Quantos casais/indivíduos estão usando Armazenamento Próprio (Google Drive conectado) vs. quantos estão usando Armazenamento Interno do App (Sem Google Drive). - Top 20 casais que mais consomem espaço e alerta automático se o disco da VM passar de 75%. 3. Assinaturas e Receita (MRR): Contagem exata de casais no plano Freemium, Romance (Mensal e Anual) e Almas Gêmeas VIP (Mensal e Anual), taxa de conversão e receita recorrente estimada. 4. Ranking das Funções Mais Usadas (feature_usage_logs): Tabela leve que incrementa contadores diários por funcionalidade (diario_post, mural_edit, grafo_view, ceu_sentimentos, minigame_prefiro, minigame_quem_faria, mapa_ao_vivo, wrapper_compartilhado, recompensa_resgatada), exibindo gráficos de barras de quais recursos mais retêm os casais!
4. Termos de Uso e Política de Privacidade (Em Conformidade com a LGPD e Google Play Console)
Abaixo está o texto jurídico estruturado de acordo com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) e com a Política de Dados do Usuário e Exclusão de Conta do Google Play Console, pronto para ser exibido no modal de cadastro (com checkbox obrigatório) e na rota pública /privacidade e /termos (exigida na ficha da Play Store):
# TERMOS DE USO E POLÍTICA DE PRIVACIDADE — NOSSO UNIVERSO

**Última atualização:** Outubro de 2026
**Responsável pelo Desenvolvimento / Operação:** Cringe Studio
**Canal Oficial de Suporte e Encarregado de Dados (DPO):** cringe.support@gmail.com

## PARTE I — POLÍTICA DE PRIVACIDADE (CONFORMIDADE LGPD - LEI Nº 13.709/2018)

### 1. Dados Coletados e Finalidade
Para fornecer o espaço compartilhado do casal, coletamos e tratamos apenas os dados estritamente necessários, mediante o seu consentimento expresso (Art. 7º, I e V da LGPD):
a) **Dados de Cadastro e Perfil:** Nome de exibição, apelido, endereço de e-mail, senha criptografada (hash irreversível via bcrypt), data de nascimento (utilizada para validação de idade mínima e cálculo opcional de signo solar), data de início do relacionamento e foto de perfil.
b) **Conteúdo Criado pelo Casal:** Relatos de texto, fotos da galeria, conexões do grafo, registros diários de humor/sentimento, itens do mural interativo e respostas aos minigames.
c) **Dados de Geolocalização e Nível de Bateria (Opcionais e Mediante Permissão Explícita):** Quando ativado por ambos os parceiros no módulo "Mapa em Tempo Real", o aplicativo coleta coordenadas de localização (GPS) e status de bateria do dispositivo exclusivamente para exibi-los ao seu parceiro(a) vinculado(a). Você pode pausar ou revogar essa permissão a qualquer instante nas configurações do aplicativo ou do sistema operacional.
d) **Métricas Técnicas e de Uso Anonimizadas:** Contagem de uso de funcionalidades, cota de armazenamento utilizada e logs técnicos de erro para manutenção de estabilidade e segurança.

### 2. Modalidades de Armazenamento (Nuvem do Aplicativo vs. Armazenamento Próprio do Usuário)
O usuário pode utilizar o aplicativo de duas formas, à sua escolha:
a) **Armazenamento Gerenciado pelo Aplicativo (Padrão — Sem necessidade de Conta Google):** Suas memórias e mídias otimizadas ficam armazenadas de forma segura e isolada nos servidores do aplicativo, respeitando os limites de espaço do seu plano (Gratuito, Romance ou Almas Gêmeas).
b) **Armazenamento Próprio Opcional (Integração Google Drive / Google Fotos):** Caso o usuário opte voluntariamente por vincular sua conta Google, o aplicativo utilizará exclusivamente a pasta de aplicação isolada (`appDataFolder` / pasta de backup do app) para salvar mídias e cópias de segurança diretamente no Google Drive do usuário, não tendo acesso a nenhum outro arquivo pessoal do seu Google Drive.

### 3. Compartilhamento de Dados e Publicidade
- **Não vendemos seus dados pessoais ou relatos íntimos a terceiros sob nenhuma hipótese.**
- No **Plano Gratuito (Freemium)**, o aplicativo exibe anúncios gerenciados pelo Google AdMob / AdSense, que podem utilizar identificadores publicitários padrão do dispositivo para limitar a frequência de anúncios. Assinantes dos planos **Romance** e **Almas Gêmeas** têm 100% dos anúncios removidos.

### 4. Direitos do Titular e Exclusão Definitiva de Conta (Art. 18 da LGPD e Regras da Google Play)
A qualquer momento, você pode:
- **Exportar todos os seus dados** em formato portátil diretamente nas Configurações do aplicativo.
- **Excluir sua conta e todos os seus dados permanentemente** com 1 clique através do menu *Ajustes -> Privacidade e Conta -> Excluir Minha Conta e Dados*, ou solicitando via web/e-mail para **cringe.support@gmail.com**. Após a confirmação, todos os relatos, fotos armazenadas nos nossos servidores, registros de localização e dados pessoais são permanentemente expurgados em até 48 horas.

## PARTE II — TERMOS E CONDIÇÕES DE USO

### 1. Elegibilidade e Vinculação de Casal
O uso do aplicativo requer idade mínima de 16 anos (ou 13 anos com assistência dos responsáveis legais, conforme legislação aplicável). O pareamento entre dois usuários ocorre mediante código de convite voluntário, podendo qualquer uma das partes desfazer o vínculo a qualquer momento nas Configurações.

### 2. Planos de Assinatura (Romance e Almas Gêmeas) e Cancelamento
- As assinaturas (**Plano Romance a R$ 12,90/mês** e **Plano Almas Gêmeas a R$ 24,90/mês**, ou suas respectivas modalidades anuais com desconto) concedem benefícios compartilhados para os 2 membros do casal vinculado.
- A renovação é automática ao final de cada ciclo, podendo ser cancelada a qualquer momento sem multa pelo Google Play ou painel de assinatura, mantendo os benefícios ativos até o fim do período já pago.
- Caso uma assinatura expire, o casal retorna ao Plano Gratuito sem perder seus textos já escritos; mídias que excedam a cota gratuita permanecem seguras por 60 dias para download ou vinculação ao Google Drive.

### 3. Programa de Recompensas e Conteúdo Compartilhado
Ao utilizar os geradores de *Social Wrappers* ou vídeos de *Trends* e compartilhá-los voluntariamente em redes sociais externas (TikTok, Instagram, WhatsApp), o usuário é o único responsável pelas informações que decide tornar públicas fora do ambiente privado do aplicativo.

### 4. Contato e Suporte
Dúvidas técnicas, solicitações de reembolso, denúncias ou requisições relativas à privacidade devem ser encaminhadas para: **cringe.support@gmail.com** (Operado por Cringe).

5. PROMPT AGENTE 6: Armazenamento Híbrido (Sem Conta Google), Aba de Recompensas & Trends Virais, Painel SuperAdmin de Métricas e Aceite Obrigatório LGPD
Copie e envie este 6º Prompt ao seu Agente de Código para implementar todas as diretrizes comerciais desta atualização:
# [AGENTE 6/6 — ARMAZENAMENTO UNIVERSAL, RECOMPENSAS VIRAIS, SUPERADMIN & LGPD]

Atue como Arquiteto Fullstack Sênior e Engenheiro de Produto. Sua missão é implementar os 4 módulos finais para lançamento comercial do aplicativo na Google Play Store, garantindo **zero referências pessoais a desenvolvedores no conteúdo do app** (mantendo apenas a mascote **Anjinha Cupido Mary**).

## 1. Remoção de Referências Pessoais & Aceite Legal Obrigatório no Registro (LGPD)
1. Remova qualquer seed ou texto que mencione nomes pessoais de testes anteriores. Mantenha apenas a **Anjinha Cupido Mary** como mascote oficial do aplicativo.
2. Crie as rotas públicas `/termos` e `/privacidade` (e o modal `LegalTermsModal.jsx`) exibindo os Termos de Uso e Política de Privacidade oficiais (com contato técnico `cringe.support@gmail.com` discreto apenas no rodapé legal).
3. Na tabela `users`, adicione `termsAcceptedAt` (text ISO), `privacyAcceptedAt` (text ISO) e `termsVersion` (text default `'v1.0-2026'`).
4. No formulário de Cadastro (`RegisterWizard.jsx`), adicione o checkbox obrigatório: *"Li e concordo com os Termos de Uso e com a Política de Privacidade (LGPD)"*, bloqueando o botão de criar conta enquanto não estiver marcado, e adicione em `SettingsView.jsx` o botão **"Excluir Minha Conta e Todos os Dados Permanentemente"** (`DELETE /api/account/purge`) conforme exigido pelo Google Play Console.

## 2. Motor de Armazenamento Universal: Suporte Completo para Quem NÃO Tem Conta Google (`storageRouter.js`)
O usuário NUNCA deve ser obrigado a ter ou conectar uma conta Google para usar o aplicativo:
1. Na tabela `couples`, adicione:
  - `storageMode`: `'internal_cloud' | 'google_drive' | 'hybrid'` (default `'internal_cloud'`).
  - `internalStorageUsedBytes`: integer default `0`.
  - `internalStorageQuotaBytes`: integer (`157286400` [150 MB] no `freemium`, `2147483648` [2 GB] no `romance`, `10737418240` [10 GB] no `almas_gemeas`).
2. Quando um usuário sem conta Google subir fotos, áudios ou desenhos do mural:
  - Comprima automaticamente a imagem com `Sharp` para `.webp` otimizado (~35 KB por imagem), salve no armazenamento gerenciado do servidor (`server/uploads/couples/:coupleId/` ou bucket Cloudflare R2 compatível com S3) e some os bytes em `internalStorageUsedBytes`.
  - Sincronize também no cache persistente local do dispositivo (`IndexedDB` + `navigator.storage.persist()`).
3. Crie a funcionalidade de **Cofre de Backup Portátil Sem Google (`GET /api/backup/export-file` e `POST /api/backup/import-file`)**:
  - Permite que qualquer usuário (mesmo sem conta Google) baixe um arquivo único `.universo` contendo todas as suas memórias e fotos para guardar no celular, iCloud ou computador, e restaurar quando trocar de aparelho.

## 3. Aba de Recompensas & Central de Trends Virais Estilo Widgetable (`RewardsAndTrendsView.jsx`)
Crie uma nova aba/central de crescimento viral chamada **"Recompensas & Trends"** (e adicione um botão de atalho para ela na tela final de cada Minigame de perguntas!):
1. **Gerador de Vídeos de Trends de Casal (`TrendVideoGenerator.jsx`)**:
  - Usando um `<canvas>` `1080x1920` (9:16) e a **`MediaRecorder API`**, gere vídeos curtos de 10s a 15s (`.webm`/`.mp4`) e *Templates de Threads de Casal* (carrossel de imagens) mostrando:
    - As respostas que o casal acabou de dar nos Minigames (*Prefiro/Não Gosto* ou *Quem Faria*) + % de Compatibilidade.
    - A evolução do Céu de Sentimentos e a Constelação de Memórias.
2. **Sistema de Missões e Recompensas (`couple_rewards` e `reward_submissions`)**:
  - Exiba missões gamificadas guiadas pela **Anjinha Cupido Mary**:
    - *"Compartilhar Wrapper após um Minigame"* $
ightarrow$ ganha `+25 Cristais de Cupido` (desbloqueia stickers exclusivos do Mural ou rodadas extras).
    - *"Postar nossa Trend no TikTok / Reels / Shorts"* $
ightarrow$ o usuário cola o link do vídeo publicado (`POST /api/rewards/submit-social-link`), e o sistema libera dias de degustação do **Plano Romance / Almas Gêmeas VIP**!
    - *"Convidar um Casal Amigo"* $
ightarrow$ código de indicação único que dá **7 a 15 dias de Plano Romance sem anúncios** quando o casal convidado se cadastra.

## 4. Painel SuperAdmin de Controle e Telemetria (`AdminDashboardView.jsx` + `/api/admin/metrics`)
Crie uma rota e painel administrativo protegido por `ADMIN_MASTER_KEY` no `.env` (acessível em `/admin`):
1. Crie um middleware leve `featureTrackerMiddleware` que registra eventos agregados na tabela `feature_usage_stats` (`featureKey`, `eventDate`, `usageCount`) toda vez que uma função principal é usada (`diary_post`, `gallery_upload`, `graph_connect`, `feelings_sky_log`, `canvas_mural_edit`, `minigame_play`, `live_map_ping`, `social_wrapper_share`, `reward_claim`).
2. Na rota `GET /api/admin/metrics`, retorne e exiba em cards e gráficos no `/admin`:
  - **Usuários & Casais:** Total de indivíduos cadastrados, total de casais pareados, ativos hoje (DAU) e no mês (MAU).
  - **Raio-X de Armazenamento:** Uso total de disco do servidor (MB/GB), quantidade exata de indivíduos/casais usando **Armazenamento Próprio (Google Drive)** vs. quantidade usando **Armazenamento Interno do App (Sem Google)**.
  - **Assinantes por Plano & Receita:** Quantidade exata de casais em `Freemium`, `Romance (Mensal/Anual)` e `Almas Gêmeas (Mensal/Anual)`, mais cálculo automático de MRR (Receita Mensal Recorrente).
  - **Ranking das Funções Mais Usadas:** Gráfico ordenado mostrando quais módulos do aplicativo têm maior engajamento diário e mensal.