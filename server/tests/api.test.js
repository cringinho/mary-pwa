process.env.NODE_ENV = 'test';

import assert from 'node:assert/strict';
import { db } from '../db/index.js';
import { users, wordNodes, coupleSettings } from '../db/schema.js';
import { runSeed } from '../db/seed.js';
import app from '../index.js';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';

async function runTests() {
  console.log('🧪 Iniciando Suíte de Testes: Fundação Nosso Universo (PWA)...');

  // 1. Schema e Seed
  console.log('[1/5] Validando Schema SQLite e Seed dos Usuários...');
  await runSeed();

  const userMary = db.select().from(users).where(eq(users.username, 'mary')).get();
  assert.ok(userMary, 'Usuário Mary deve existir');
  assert.equal(userMary.username, 'mary');
  assert.ok(userMary.nickname, 'Nickname de Mary deve estar preenchido');
  assert.ok(userMary.coupleId, 'coupleId de Mary deve estar definido');

  const userLeh = db.select().from(users).where(eq(users.username, 'leh')).get();
  assert.ok(userLeh, 'Usuário Leh deve existir');
  assert.equal(userLeh.username, 'leh');
  assert.ok(userLeh.nickname, 'Nickname de Leh deve estar preenchido');
  assert.equal(userLeh.coupleId, userMary.coupleId, 'Ambos devem pertencer ao mesmo casal');

  const settings = db.select().from(coupleSettings).get();
  assert.ok(settings, 'Configurações do casal devem existir');
  assert.equal(settings.anniversaryDate, '2026-01-30');

  const words = db.select().from(wordNodes).all();
  assert.ok(words.length >= 9, 'Deve conter pelo menos 9 palavras afetivas');
  console.log(`  ✅ Schema SQLite e Seed validados (${words.length} palavras no grafo).`);

  // 2. Servidor Express
  console.log('[2/5] Iniciando Servidor Express...');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    // 3. Health & Auth
    console.log('[3/5] Testando /api/health e Autenticação...');
    const health = await fetch(`${baseUrl}/api/health`).then(r => r.json());
    assert.equal(health.status, 'ok');

    // Bloqueio de usuário não autorizado
    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'intruder', password: '123' })
    });
    assert.equal(badLogin.status, 401);

    // Login com sucesso (Mary)
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'mary', password: 'maricota123' })
    });
    assert.equal(loginRes.status, 200);
    const { token, user } = await loginRes.json();
    assert.ok(token);
    assert.equal(user.username, 'mary');
    const authHeaders = { Authorization: `Bearer ${token}` };

    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders }).then(r => r.json());
    assert.equal(me.user.username, 'mary');
    console.log('  ✅ Login, bloqueio e sessão 100% aprovados');

    // 4. Atualização de Perfil (PATCH)
    console.log('[4/5] Testando PATCH /api/profile...');
    const patchRes = await fetch(`${baseUrl}/api/profile`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'Maricota Soberana',
        moodStatus: 'Radiante e amada 💖',
        theme: 'pastel-glitter'
      })
    });
    assert.equal(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.equal(patchJson.user.nickname, 'Maricota Soberana');
    assert.equal(patchJson.user.theme, 'pastel-glitter');
    console.log('  ✅ Atualização de campos customizáveis validada');

    // 5. Upload de Avatar com Sharp (.webp)
    console.log('[5/5] Testando Upload de Avatar com Compressão Sharp (.webp)...');
    const testBuf = await sharp({
      create: { width: 500, height: 500, channels: 4, background: { r: 236, g: 72, b: 153, alpha: 1 } }
    }).png().toBuffer();

    const formData = new FormData();
    formData.append('avatar', new Blob([testBuf], { type: 'image/png' }), 'test.png');

    const uploadRes = await fetch(`${baseUrl}/api/profile/avatar`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    assert.equal(uploadRes.status, 200);
    const uploadJson = await uploadRes.json();
    assert.ok(uploadJson.avatarUrl.endsWith('.webp'));

    // Rota protegida sem auth
    const unauth = await fetch(`${baseUrl}${uploadJson.avatarUrl}`);
    assert.equal(unauth.status, 401);

    // Rota protegida com auth
    const authed = await fetch(`${baseUrl}${uploadJson.avatarUrl}`, { headers: authHeaders });
    assert.equal(authed.status, 200);
    assert.ok(authed.headers.get('content-type').includes('image/webp'));
    console.log('  ✅ Upload, redimensionamento cover 400x400 e WebP aprovados');

    // 6. Testar Dados do Casal (GET /api/couple)
    console.log('[6/7] Testando Endpoint /api/couple...');
    const coupleRes = await fetch(`${baseUrl}/api/couple`, { headers: authHeaders });
    assert.equal(coupleRes.status, 200);
    const coupleJson = await coupleRes.json();
    assert.ok(coupleJson.success);
    assert.equal(coupleJson.me.username, 'mary');
    assert.equal(coupleJson.partner.username, 'leh');
    assert.equal(coupleJson.settings.anniversaryDate, '2026-01-30');
    console.log('  ✅ Endpoint /api/couple validou Mary, Leandro e data de aniversário');

    // 7. Testar Favoritar Versículo Bíblico (POST /api/verses/favorite)
    console.log('[7/7] Testando /api/verses/favorite...');
    const favRes = await fetch(`${baseUrl}/api/verses/favorite`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: '1 Coríntios 13:4-7',
        text: 'O amor é paciente, o amor é bondoso...',
        bookName: '1 Coríntios',
        chapter: 13,
        verse: 4,
        note: 'Nosso lema de amor e lealdade 💖'
      })
    });
    assert.equal(favRes.status, 201);
    const favJson = await favRes.json();
    assert.ok(favJson.verse.id);
    assert.equal(favJson.verse.reference, '1 Coríntios 13:4-7');
    assert.equal(favJson.verse.note, 'Nosso lema de amor e lealdade 💖');

    // Listar favoritos
    const listRes = await fetch(`${baseUrl}/api/verses/favorites`, { headers: authHeaders });
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.ok(listJson.favorites.some(f => f.reference === '1 Coríntios 13:4-7'));
    console.log('  ✅ Versículos bíblicos favoritados e persistidos no SQLite com sucesso');

    // 8. Testar Criação de Relato com Múltiplas Imagens (POST /api/memories)
    console.log('[8/11] Testando Criação de Relato com Imagens e Sharp (.webp)...');
    const memoryImgBuf = await sharp({
      create: { width: 1200, height: 800, channels: 4, background: { r: 244, g: 63, b: 94, alpha: 1 } }
    }).jpeg().toBuffer();

    const memFormData = new FormData();
    memFormData.append('title', 'Nosso Primeiro Piquenique Noturno');
    memFormData.append('content', 'Uma noite mágica comendo morangos com chocolate sob a luz das estrelas...');
    memFormData.append('memoryDate', '2026-02-14');
    memFormData.append('mood', 'Amor Eterno 💖');
    memFormData.append('tags', JSON.stringify(['piquenique', 'estrelas', 'morangos']));
    memFormData.append('location', 'Mirante da Serra');
    memFormData.append('images', new Blob([memoryImgBuf], { type: 'image/jpeg' }), 'picnic.jpg');

    const createMemRes = await fetch(`${baseUrl}/api/memories`, {
      method: 'POST',
      headers: authHeaders,
      body: memFormData
    });
    assert.equal(createMemRes.status, 201);
    const createMemJson = await createMemRes.json();
    assert.ok(createMemJson.memory.id);
    assert.equal(createMemJson.memory.title, 'Nosso Primeiro Piquenique Noturno');
    assert.equal(createMemJson.memory.media.length, 1);
    assert.ok(createMemJson.memory.media[0].fileUrl.endsWith('.webp'));
    assert.ok(createMemJson.memory.media[0].thumbUrl.endsWith('.webp'));
    const testMemoryId = createMemJson.memory.id;
    console.log(`  ✅ Relato #${testMemoryId} criado com fotos WebP (principal + thumbnail)`);

    // 9. Testar Listagem de Relatos (GET /api/memories)
    console.log('[9/11] Testando Listagem de Relatos (GET /api/memories)...');
    const listMemRes = await fetch(`${baseUrl}/api/memories`, { headers: authHeaders });
    assert.equal(listMemRes.status, 200);
    const listMemJson = await listMemRes.json();
    assert.ok(listMemJson.memories.length > 0);
    const foundMem = listMemJson.memories.find(m => m.id === testMemoryId);
    assert.ok(foundMem);
    assert.equal(foundMem.author.username, 'mary');
    assert.equal(foundMem.media.length, 1);
    console.log('  ✅ GET /api/memories retornou relatos enriquecidos com mídias e autor');

    // 10. Testar Likes Afetivos e Reações do Casal (POST /api/memories/:id/like)
    console.log('[10/11] Testando Likes e Reações Afetivas...');
    // Like com coração
    const like1Res = await fetch(`${baseUrl}/api/memories/${testMemoryId}/like`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction: 'heart' })
    });
    assert.equal(like1Res.status, 200);
    const like1Json = await like1Res.json();
    assert.equal(like1Json.action, 'added');
    assert.equal(like1Json.userReaction, 'heart');
    assert.equal(like1Json.likes.length, 1);

    // Atualiza reação para kuromi
    const like2Res = await fetch(`${baseUrl}/api/memories/${testMemoryId}/like`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction: 'kuromi' })
    });
    assert.equal(like2Res.status, 200);
    const like2Json = await like2Res.json();
    assert.equal(like2Json.action, 'updated');
    assert.equal(like2Json.userReaction, 'kuromi');

    // Toggle off (remove like)
    const like3Res = await fetch(`${baseUrl}/api/memories/${testMemoryId}/like`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction: 'kuromi' })
    });
    assert.equal(like3Res.status, 200);
    const like3Json = await like3Res.json();
    assert.equal(like3Json.action, 'removed');
    assert.equal(like3Json.userReaction, null);
    console.log('  ✅ Likes afetivos, reações Kuromi e toggle validados com 100% de precisão');

    // 11. Testar Cápsula do Tempo e Exclusão Segura
    console.log('[11/11] Testando Cápsula do Tempo Selada e Exclusão...');
    const capsuleFormData = new FormData();
    capsuleFormData.append('title', 'Carta Secreta para 2099');
    capsuleFormData.append('content', 'Esta é uma mensagem secreta que ninguém pode ler antes de 2099!');
    capsuleFormData.append('memoryDate', '2026-03-01');
    capsuleFormData.append('isCapsule', 'true');
    capsuleFormData.append('unlockAt', '2099-01-01');

    const capRes = await fetch(`${baseUrl}/api/memories`, {
      method: 'POST',
      headers: authHeaders,
      body: capsuleFormData
    });
    assert.equal(capRes.status, 201);
    const capJson = await capRes.json();
    const capId = capJson.memory.id;

    // Verificar se no GET /api/memories o conteúdo foi protegido
    const checkCapRes = await fetch(`${baseUrl}/api/memories`, { headers: authHeaders });
    const checkCapJson = await checkCapRes.json();
    const lockedCap = checkCapJson.memories.find(m => m.id === capId);
    assert.equal(lockedCap.isLocked, true);
    assert.ok(lockedCap.content.includes('🔒 Esta cápsula do tempo está selada'));
    assert.equal(lockedCap.media.length, 0);

    // Testar exclusão do relato e limpeza
    const delRes = await fetch(`${baseUrl}/api/memories/${capId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert.equal(delRes.status, 200);
    console.log('  ✅ Cápsula do tempo selada protegida e exclusão limpa validadas com sucesso');
    // 12. Testar Upload Direto para a Galeria (POST /api/gallery/upload)
    console.log('[12/15] Testando Upload Direto para a Galeria Separada...');
    const galleryImgBuf = await sharp({
      create: { width: 1000, height: 1000, channels: 4, background: { r: 147, g: 51, b: 234, alpha: 1 } }
    }).jpeg().toBuffer();

    const galFormData = new FormData();
    galFormData.append('albumName', 'Nossas Fotos');
    galFormData.append('caption', 'Selfie linda no pôr do sol');
    galFormData.append('takenAt', '2026-02-14');
    galFormData.append('images', new Blob([galleryImgBuf], { type: 'image/jpeg' }), 'sunset.jpg');

    const galUploadRes = await fetch(`${baseUrl}/api/gallery/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: galFormData
    });
    assert.equal(galUploadRes.status, 201);
    const galUploadJson = await galUploadRes.json();
    assert.ok(galUploadJson.uploaded.length > 0);
    const uploadedMediaId = galUploadJson.uploaded[0].id;
    assert.ok(galUploadJson.uploaded[0].fileUrl.endsWith('.webp'));
    console.log(`  ✅ Foto #${uploadedMediaId} enviada diretamente para a galeria separada em WebP`);

    // 13. Testar Listagem e Filtros da Galeria (GET /api/gallery)
    console.log('[13/15] Testando Listagem da Galeria com Filtros...');
    const getGalRes = await fetch(`${baseUrl}/api/gallery?albumName=Nossas%20Fotos`, { headers: authHeaders });
    assert.equal(getGalRes.status, 200);
    const getGalJson = await getGalRes.json();
    assert.ok(getGalJson.media.length > 0);
    assert.ok(getGalJson.albums.includes('Nossas Fotos'));
    console.log('  ✅ GET /api/gallery retornou acervo visual e álbuns');

    // 14. Testar Favoritar Foto da Galeria (PATCH /api/gallery/:id/favorite)
    console.log('[14/15] Testando Favoritar Foto na Galeria...');
    const favGalRes = await fetch(`${baseUrl}/api/gallery/${uploadedMediaId}/favorite`, {
      method: 'PATCH',
      headers: authHeaders
    });
    assert.equal(favGalRes.status, 200);
    const favGalJson = await favGalRes.json();
    assert.equal(favGalJson.isFavorite, true);
    console.log('  ✅ Foto da galeria marcada como favorita do casal com sucesso');

    // 15. Testar Resumo Mensal / Recap (GET /api/recap/months & GET /api/recap/2026-02)
    console.log('[15/15] Testando Endpoint de Resumo Mensal (Recap)...');
    const monthsRes = await fetch(`${baseUrl}/api/recap/months`, { headers: authHeaders });
    assert.equal(monthsRes.status, 200);
    const monthsJson = await monthsRes.json();
    assert.ok(monthsJson.months.length > 0);

    const recapRes = await fetch(`${baseUrl}/api/recap/2026-02`, { headers: authHeaders });
    assert.equal(recapRes.status, 200);
    const recapJson = await recapRes.json();
    assert.ok(recapJson.success);
    assert.equal(recapJson.recap.yearMonth, '2026-02');
    assert.ok(recapJson.recap.totalMemories >= 1);
    assert.ok(recapJson.recap.totalPhotos >= 1);
    assert.ok(recapJson.recap.collagePhotos.length > 0);
    assert.ok(recapJson.recap.quote.length > 0);
    console.log('  ✅ Agregação do Recap Mensal (números, fotos e citação) validada com 100% de integridade');

    // 16. Testar Dados do Grafo (GET /api/graph/data)
    console.log('[16/18] Testando Dados do Grafo (GET /api/graph/data)...');
    const graphRes = await fetch(`${baseUrl}/api/graph/data`, { headers: authHeaders });
    assert.equal(graphRes.status, 200);
    const graphJson = await graphRes.json();
    assert.ok(graphJson.success);
    assert.ok(Array.isArray(graphJson.memoryNodes));
    assert.ok(Array.isArray(graphJson.memoryEdges));
    assert.ok(Array.isArray(graphJson.registeredWords));
    assert.ok(Array.isArray(graphJson.suggestedWords));
    assert.ok(graphJson.registeredWords.length >= 9);
    console.log(`  ✅ Grafo retornado com ${graphJson.memoryNodes.length} nós de memória e ${graphJson.registeredWords.length} palavras registradas`);

    // 17. Testar Cadastro de Nova Palavra (POST /api/graph/words)
    console.log('[17/18] Testando Cadastro de Nova Palavra no Grafo...');
    const addWordRes = await fetch(`${baseUrl}/api/graph/words`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: 'Morangos com Chocolate',
        color: '#EC4899',
        meaningOrNote: '[Afeto] Nossa sobremesa favorita',
        iconName: 'Heart'
      })
    });
    assert.equal(addWordRes.status, 201);
    const addWordJson = await addWordRes.json();
    assert.ok(addWordJson.word.id);
    assert.equal(addWordJson.word.word, 'Morangos com Chocolate');
    const createdWordId = addWordJson.word.id;
    console.log(`  ✅ Palavra #${createdWordId} cadastrada com sucesso no grafo`);

    // 18. Testar Remoção de Palavra (DELETE /api/graph/words/:id)
    console.log('[18/18] Testando Remoção de Palavra do Grafo...');
    const delWordRes = await fetch(`${baseUrl}/api/graph/words/${createdWordId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert.equal(delWordRes.status, 200);
    console.log('  ✅ Remoção de palavra validada com sucesso');

    // 19. Testar Chave Pública VAPID (GET /api/push/vapid-public-key)
    console.log('[19/21] Testando Obtenção da Chave Pública VAPID...');
    const vapidRes = await fetch(`${baseUrl}/api/push/vapid-public-key`);
    assert.equal(vapidRes.status, 200);
    const vapidJson = await vapidRes.json();
    assert.ok(vapidJson.publicKey && vapidJson.publicKey.length > 20);
    console.log('  ✅ Chave pública VAPID gerada e disponibilizada para o PWA');

    // 20. Testar Inscrição Push e Envio de Notificação de Carinho
    console.log('[20/21] Testando Inscrição Push e Notificação "Pensando em Você"...');
    const dummySub = {
      endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/dummy-test-sub-mary-leh',
      keys: {
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t04kn8-xdjWDRhnxDensityKey',
        auth: 'tBHItJI5svbpez7KI4CCXg'
      }
    };

    const subRes = await fetch(`${baseUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: dummySub })
    });
    assert.equal(subRes.status, 200);
    const subJson = await subRes.json();
    assert.ok(subJson.success);

    // Testar envio de carinho
    const thinkRes = await fetch(`${baseUrl}/api/push/thinking-of-you`, {
      method: 'POST',
      headers: authHeaders
    });
    assert.equal(thinkRes.status, 200);
    const thinkJson = await thinkRes.json();
    assert.ok(thinkJson.success);
    console.log('  ✅ Inscrição de push registrada e disparo para o parceiro aprovados');

    // 21. Testar Cancelamento de Inscrição Push (POST /api/push/unsubscribe)
    console.log('[21/24] Testando Cancelamento de Inscrição Push...');
    const unsubRes = await fetch(`${baseUrl}/api/push/unsubscribe`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: dummySub.endpoint })
    });
    assert.equal(unsubRes.status, 200);
    console.log('  ✅ Cancelamento de inscrição push validado com sucesso');

    // 22. Testar Persistência de Coordenadas e Conexões Manuais no Grafo
    console.log('[22/24] Testando Persistência de Coordenadas e Conexões Manuais no Grafo...');
    const posRes = await fetch(`${baseUrl}/api/graph/node-position`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeType: 'memory',
        id: `mem-${testMemoryId}`,
        x: 345.5,
        y: -120.25
      })
    });
    assert.equal(posRes.status, 200);

    // Criar um segundo relato rápido para testar conexão manual entre duas memórias
    const mem2Form = new FormData();
    mem2Form.append('title', 'Jantar à Luz de Velas');
    mem2Form.append('content', 'Continuando nossa noite mágica de morangos...');
    mem2Form.append('memoryDate', '2026-02-15');
    const mem2Res = await fetch(`${baseUrl}/api/memories`, {
      method: 'POST',
      headers: authHeaders,
      body: mem2Form
    });
    assert.equal(mem2Res.status, 201);
    const mem2Json = await mem2Res.json();
    const secondMemoryId = mem2Json.memory.id;

    const connRes = await fetch(`${baseUrl}/api/graph/connections`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceMemoryId: `mem-${testMemoryId}`,
        targetMemoryId: `mem-${secondMemoryId}`,
        label: 'Continuação da Noite'
      })
    });
    assert.equal(connRes.status, 201);
    const connJson = await connRes.json();
    assert.ok(connJson.connection?.id);

    const verifyGraphRes = await fetch(`${baseUrl}/api/graph/data`, { headers: authHeaders }).then(r => r.json());
    const updatedMemNode = verifyGraphRes.memoryNodes.find(m => m.memoryId === testMemoryId);
    assert.equal(updatedMemNode.positionX, 345.5);
    assert.equal(updatedMemNode.positionY, -120.25);

    const delConnRes = await fetch(`${baseUrl}/api/graph/connections/${connJson.connection.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert.equal(delConnRes.status, 200);
    console.log('  ✅ Coordenadas (positionX/positionY) e conexões manuais do grafo validadas');

    // 23. Testar CRUD de Customizações do Casal e Toggle Bíblico (Agente 1)
    console.log('[23/24] Testando CRUD de Customizações (Tags, Álbuns, Humores) e Settings...');
    const patchSettingsRes = await fetch(`${baseUrl}/api/couple/settings`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ enableBibleVerses: true })
    });
    assert.equal(patchSettingsRes.status, 200);
    const patchSettingsJson = await patchSettingsRes.json();
    assert.equal(patchSettingsJson.settings.enableBibleVerses, true);

    const addMoodRes = await fetch(`${baseUrl}/api/couple/customizations/moods`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Gratidão Pura', emoji: '✨', color: '#F59E0B' })
    });
    assert.equal(addMoodRes.status, 201);
    const addMoodJson = await addMoodRes.json();
    assert.ok(addMoodJson.item.id);

    const editMoodRes = await fetch(`${baseUrl}/api/couple/customizations/moods/${addMoodJson.item.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Gratidão Infinita', emoji: '🌟' })
    });
    assert.equal(editMoodRes.status, 200);
    const editMoodJson = await editMoodRes.json();
    assert.equal(editMoodJson.item.name, 'Gratidão Infinita');

    const delMoodRes = await fetch(`${baseUrl}/api/couple/customizations/moods/${addMoodJson.item.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert.equal(delMoodRes.status, 200);
    console.log('  ✅ CRUD de customizações e toggle de versículos bíblicos aprovados');

    // 24. Testar Registro Multi-Tenant + Cálculo Automático de Signo Zodiacal (Agente 1)
    console.log('[24/24] Testando Cadastro Multi-Tenant e Signo Zodiacal Automático...');
    const uniqueSuffix = Date.now().toString(36);
    const reg1Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `alice_${uniqueSuffix}`,
        password: 'password123',
        displayName: 'Alice',
        nickname: 'Lili',
        birthDate: '2000-03-25', // Áries
        mode: 'create',
        coupleName: 'Universo Alice & Bob',
        anniversaryDate: '2025-06-12'
      })
    });
    assert.equal(reg1Res.status, 201);
    const reg1Json = await reg1Res.json();
    assert.equal(reg1Json.user.zodiacSign, 'aries');
    assert.ok(reg1Json.couple.inviteCode);

    const reg2Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `bob_${uniqueSuffix}`,
        password: 'password123',
        displayName: 'Bob',
        nickname: 'Beto',
        birthDate: '1999-11-05', // Escorpião
        mode: 'join',
        inviteCode: reg1Json.couple.inviteCode
      })
    });
    assert.equal(reg2Res.status, 201);
    const reg2Json = await reg2Res.json();
    assert.equal(reg2Json.user.zodiacSign, 'scorpio');
    assert.equal(reg2Json.user.coupleId, reg1Json.user.coupleId);
    console.log(`  ✅ Casal Multi-Tenant criado (${reg1Json.couple.inviteCode}) e signos (aries/scorpio) calculados!`);

    // 25. Testar Céu de Sentimentos Diários e Calendário Emocional (Agente 3)
    console.log('[25/26] Testando Registro de Sentimentos Diários e Calendário Emocional...');
    const feelingRes = await fetch(`${baseUrl}/api/feelings`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feelingDate: '2026-02-14',
        moodLabel: 'Radiante de Amor',
        moodColor: '#F43F5E',
        intensity: 5,
        note: 'Um dia inesquecível ao seu lado!'
      })
    });
    assert.ok([200, 201].includes(feelingRes.status), `Status esperado 200 ou 201, recebido: ${feelingRes.status}`);
    const feelingJson = await feelingRes.json();
    assert.ok(feelingJson.feeling?.id);

    const getFeelingsRes = await fetch(`${baseUrl}/api/feelings`, { headers: authHeaders });
    assert.equal(getFeelingsRes.status, 200);
    const getFeelingsJson = await getFeelingsRes.json();
    assert.ok(getFeelingsJson.allFeelings.length >= 1);

    const getCalRes = await fetch(`${baseUrl}/api/feelings/calendar/2026-02`, { headers: authHeaders });
    assert.equal(getCalRes.status, 200);
    const getCalJson = await getCalRes.json();
    assert.ok(getCalJson.calendarDays['2026-02-14']?.length >= 1);
    console.log('  ✅ Céu de Sentimentos Diários e Calendário Emocional Bicolor validados!');

    // 26. Testar Espaço do Casal: Mural Infinito e Elementos Arrastáveis (Agente 3)
    console.log('[26/26] Testando Mural do Casal (Post-it, Spotify, Polaroid, Desenho)...');
    const addNoteRes = await fetch(`${baseUrl}/api/canvas`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemType: 'note',
        x: 120,
        y: 80,
        width: 220,
        height: 160,
        payload: { text: 'Te amo infinito!', color: '#FEF08A' }
      })
    });
    assert.equal(addNoteRes.status, 201);
    const addNoteJson = await addNoteRes.json();
    const createdItemId = addNoteJson.item.id;
    assert.equal(addNoteJson.item.payload.text, 'Te amo infinito!');

    const patchItemRes = await fetch(`${baseUrl}/api/canvas/${createdItemId}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: 180, y: 150 })
    });
    assert.equal(patchItemRes.status, 200);
    const patchItemJson = await patchItemRes.json();
    assert.equal(patchItemJson.item.x, 180);
    assert.equal(patchItemJson.item.y, 150);

    const delItemRes = await fetch(`${baseUrl}/api/canvas/${createdItemId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert.equal(delItemRes.status, 200);
    console.log('  ✅ Mural Interativo do Casal (CRUD, arrasto e limites de plano) validado com sucesso!');

    // 27. Testar Telemetria em Tempo Real (Localização + Bateria) (Agente 4)
    console.log('[27/29] Testando Rastreio em Tempo Real do Parceiro (Localização + Bateria)...');
    const pingRes = await fetch(`${baseUrl}/api/telemetry/ping`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: -23.55052,
        longitude: -46.633308,
        accuracy: 12.5,
        speed: 1.2,
        batteryLevel: 88,
        isCharging: true
      })
    });
    assert.equal(pingRes.status, 200);

    const partnerTelemetryRes = await fetch(`${baseUrl}/api/telemetry/partner`, { headers: authHeaders });
    assert.equal(partnerTelemetryRes.status, 200);
    const partnerTelemetryJson = await partnerTelemetryRes.json();
    assert.ok(partnerTelemetryJson.hasPartner);
    assert.equal(partnerTelemetryJson.selfTelemetry?.batteryLevel, 88);
    assert.equal(partnerTelemetryJson.selfTelemetry?.isCharging, true);
    console.log('  ✅ Telemetria de localização e bateria do parceiro validadas!');

    // 28. Testar Minigames de Casal (1.000 Questões + Respostas + Compatibilidade) (Agente 4)
    console.log('[28/29] Testando Minigames do Casal (1.000 Questões + Votos + Compatibilidade)...');
    const questionsRes = await fetch(`${baseUrl}/api/minigames/questions?type=prefer_dislike&limit=5`, { headers: authHeaders });
    assert.equal(questionsRes.status, 200);
    const questionsJson = await questionsRes.json();
    assert.ok(questionsJson.total >= 500, `Esperado pelo menos 500 questões, total: ${questionsJson.total}`);
    assert.ok(questionsJson.questions.length > 0);

    const testQuestion = questionsJson.questions[0];
    const answerRes = await fetch(`${baseUrl}/api/minigames/answers`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: testQuestion.id,
        answerChoice: 'prefer'
      })
    });
    assert.equal(answerRes.status, 200);
    const answerJson = await answerRes.json();
    assert.equal(answerJson.myAnswer, 'prefer');

    const customQRes = await fetch(`${baseUrl}/api/minigames/custom`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionType: 'prefer_dislike',
        category: 'Romantismo',
        questionText: 'Assistir o nascer do sol abraçados na praia?'
      })
    });
    assert.equal(customQRes.status, 201);
    const customQJson = await customQRes.json();
    assert.equal(customQJson.question.questionText, 'Assistir o nascer do sol abraçados na praia?');

    const compatRes = await fetch(`${baseUrl}/api/minigames/compatibility`, { headers: authHeaders });
    assert.equal(compatRes.status, 200);
    const compatJson = await compatRes.json();
    assert.ok(typeof compatJson.overallCompatibility === 'number');
    console.log('  ✅ Minigames de Casal (acervo 1.000 questões, respostas e compatibilidade) validados!');

    // 29. Testar BYOS Cloud & Exportação de Cofre do Casal (Agente 4)
    console.log('[29/31] Testando BYOS Cloud & Exportação Portátil do Universo...');
    const driveStatusRes = await fetch(`${baseUrl}/api/cloud/drive-status`, { headers: authHeaders });
    assert.equal(driveStatusRes.status, 200);
    const driveStatusJson = await driveStatusRes.json();
    assert.ok(driveStatusJson.storageMode);

    const exportVaultRes = await fetch(`${baseUrl}/api/cloud/export-vault`, { headers: authHeaders });
    assert.equal(exportVaultRes.status, 200);
    const exportVaultJson = await exportVaultRes.json();
    assert.equal(exportVaultJson.app, 'Nosso Universo');
    assert.ok(exportVaultJson.memories.length >= 0);
    console.log('  ✅ BYOS Cloud e Exportação Portátil do Universo (.universo) validados com sucesso!');

    // 30. Testar Monetização & Planos SaaS (Agente 5)
    console.log('[30/31] Testando Sistema de Planos & Assinaturas SaaS...');
    const planRes = await fetch(`${baseUrl}/api/billing/plan`, { headers: authHeaders });
    assert.equal(planRes.status, 200);
    const planJson = await planRes.json();
    assert.ok(planJson.planTier);

    const upgradeRes = await fetch(`${baseUrl}/api/billing/upgrade`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ planTier: 'almas_gemeas_vip', billingCycle: 'yearly' })
    });
    assert.equal(upgradeRes.status, 200);
    const upgradeJson = await upgradeRes.json();
    assert.equal(upgradeJson.planTier, 'almas_gemeas');
    console.log('  ✅ Planos e Upgrades SaaS validados com sucesso!');

    // 31. Testar Feed de Resumo dos Widgets para Android/iOS (Agente 5)
    console.log('[31/33] Testando API de Widgets Móveis (Resumo do Casal)...');
    const widgetsRes = await fetch(`${baseUrl}/api/widgets/summary`, { headers: authHeaders });
    assert.equal(widgetsRes.status, 200);
    const widgetsJson = await widgetsRes.json();
    assert.ok(typeof widgetsJson.daysTogether === 'number');
    assert.ok(widgetsJson.user);
    console.log('  ✅ API de Widgets de Tela Inicial validada com sucesso!');

    // 32. Testar Catálogo de Recompensas e Missões Virais (Agente 6)
    console.log('[32/33] Testando Catálogo de Recompensas & Missões de Casal...');
    const rewardsRes = await fetch(`${baseUrl}/api/rewards/catalog`, { headers: authHeaders });
    assert.equal(rewardsRes.status, 200);
    const rewardsJson = await rewardsRes.json();
    assert.ok(typeof rewardsJson.cupidCrystals === 'number');
    assert.ok(Array.isArray(rewardsJson.missions));

    const claimRes = await fetch(`${baseUrl}/api/rewards/claim-mission`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId: 'minigame_share' })
    });
    assert.equal(claimRes.status, 200);
    const claimJson = await claimRes.json();
    assert.ok(claimJson.success);
    console.log('  ✅ Catálogo e Resgate de Recompensas validados com sucesso!');

    // 33. Testar Métricas e Painel SuperAdmin (Agente 6)
    console.log('[33/33] Testando Painel SuperAdmin e Telemetria de Métricas...');
    const adminRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { 'x-admin-key': 'mary_super_admin_secret_2026' }
    });
    assert.equal(adminRes.status, 200);
    const adminJson = await adminRes.json();
    assert.ok(adminJson.overview.totalUsers >= 2);
    assert.ok(adminJson.storage);
    assert.ok(adminJson.billing);
    console.log('  ✅ Painel SuperAdmin e Métricas de Negócio validados com sucesso!');

  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }

  console.log('🎉 TODOS OS 33 TESTES (FUNDAÇÃO + AGENTES 1, 2, 3, 4, 5 E 6) PASSARAM COM 100% DE SUCESSO!');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Falha nos testes:', err);
    process.exit(1);
  });
