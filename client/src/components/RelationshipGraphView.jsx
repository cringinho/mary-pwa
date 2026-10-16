import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  ShareNetwork, Sparkle, Plus, FlowArrow
} from '@phosphor-icons/react';
import { Loader2 } from 'lucide-react';

import MemoryNode from './graph/MemoryNode';
import WordNode from './graph/WordNode';
import WordDetailDrawer from './graph/WordDetailDrawer';
import MemoryTimelineModal from './graph/MemoryTimelineModal';
import AddWordModal from './graph/AddWordModal';

const nodeTypes = {
  memoryNode: MemoryNode,
  wordNode: WordNode
};

export default function RelationshipGraphView({ onGoToMemory }) {
  const [graphMode, setGraphMode] = useState('words'); // 'memories' ou 'words'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedWord, setSelectedWord] = useState(null);
  const [isWordDrawerOpen, setIsWordDrawerOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [approvingWord, setApprovingWord] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  async function fetchGraphData() {
    setLoading(true);
    try {
      const res = await fetch('/api/graph/data', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Erro ao carregar grafo:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGraphData();
  }, []);

  async function handleApproveSuggestion(suggested) {
    setApprovingWord(suggested.word);
    try {
      const res = await fetch('/api/graph/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          word: suggested.word,
          color: '#EC4899',
          meaningOrNote: `Frequência natural nos relatos (${suggested.count}x)`,
          iconName: 'Sparkles'
        })
      });
      if (res.ok) {
        fetchGraphData();
      }
    } catch (err) {
      console.warn('Erro ao aprovar sugestão:', err);
    } finally {
      setApprovingWord(null);
    }
  }

  async function handleDeleteWord(wordId) {
    try {
      const res = await fetch(`/api/graph/words/${wordId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchGraphData();
      }
    } catch (err) {
      console.warn('Erro ao remover palavra:', err);
    }
  }

  // Constrói nós e arestas respeitando coordenadas salvas (positionX / positionY)
  useEffect(() => {
    if (!data) return;

    if (graphMode === 'memories') {
      const memoryNodesList = (data.memoryNodes || []).map((m, idx) => {
        const hasSavedPos = Number(m.positionX) !== 0 || Number(m.positionY) !== 0;
        const angle = (idx / Math.max(1, data.memoryNodes.length)) * Math.PI * 2;
        const radius = 220 + (idx % 3) * 60;
        const x = hasSavedPos ? Number(m.positionX) : 380 + Math.cos(angle) * radius;
        const y = hasSavedPos ? Number(m.positionY) : 280 + Math.sin(angle) * radius;

        return {
          id: m.id,
          type: 'memoryNode',
          position: { x, y },
          data: m
        };
      });

      const memoryEdgesList = (data.memoryEdges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#EC4899', strokeWidth: 2, strokeDasharray: '4 4' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#EC4899' }
      }));

      setNodes(memoryNodesList);
      setEdges(memoryEdgesList);
    } else {
      const registered = data.registeredWords || [];
      const memoriesMap = new Map((data.memoryNodes || []).map(m => [m.memoryId, m]));

      const wordNodesList = registered.map((w, idx) => {
        const hasSavedPos = Number(w.positionX) !== 0 || Number(w.positionY) !== 0;
        const angle = (idx / Math.max(1, registered.length)) * Math.PI * 2;
        const radius = 180 + (idx % 2) * 50;
        const x = hasSavedPos ? Number(w.positionX) : 400 + Math.cos(angle) * radius;
        const y = hasSavedPos ? Number(w.positionY) : 300 + Math.sin(angle) * radius;

        return {
          id: `word-${w.id}`,
          type: 'wordNode',
          position: { x, y },
          data: w
        };
      });

      const usedMemoryIds = new Set();
      registered.forEach(w => w.memoryIds.forEach(id => usedMemoryIds.add(id)));

      const memoryNodesList = Array.from(usedMemoryIds).map((memId, idx) => {
        const m = memoriesMap.get(memId) || { memoryId: memId, title: `Relato #${memId}`, positionX: 0, positionY: 0 };
        const hasSavedPos = Number(m.positionX) !== 0 || Number(m.positionY) !== 0;
        const angle = (idx / Math.max(1, usedMemoryIds.size)) * Math.PI * 2;
        const radius = 380 + (idx % 2) * 80;
        const x = hasSavedPos ? Number(m.positionX) : 400 + Math.cos(angle) * radius;
        const y = hasSavedPos ? Number(m.positionY) : 300 + Math.sin(angle) * radius;

        return {
          id: `mem-${memId}`,
          type: 'memoryNode',
          position: { x, y },
          data: m
        };
      });

      const wordToMemEdges = [];
      registered.forEach(w => {
        w.memoryIds.forEach(memId => {
          wordToMemEdges.push({
            id: `edge-wm-${w.id}-${memId}`,
            source: `word-${w.id}`,
            target: `mem-${memId}`,
            type: 'bezier',
            style: { stroke: `${w.color || '#EC4899'}88`, strokeWidth: 1.5 }
          });
        });
      });

      const coOccurEdges = (data.wordCoOccurrences || []).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'straight',
        style: { stroke: '#F59E0B66', strokeWidth: 1, strokeDasharray: '3 3' }
      }));

      const manualMemoryEdges = (data.memoryEdges || [])
        .filter(e => usedMemoryIds.has(Number(String(e.source).replace(/^mem-/, ''))) && usedMemoryIds.has(Number(String(e.target).replace(/^mem-/, ''))))
        .map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#EC4899', strokeWidth: 2, strokeDasharray: '4 4' }
        }));

      setNodes([...wordNodesList, ...memoryNodesList]);
      setEdges([...wordToMemEdges, ...coOccurEdges, ...manualMemoryEdges]);
    }
  }, [data, graphMode]);

  // Conexão manual entre memórias via React Flow (Correção Definitiva Bug 2)
  const onConnect = useCallback(async (params) => {
    const isMemSource = String(params.source).startsWith('mem-');
    const isMemTarget = String(params.target).startsWith('mem-');

    setEdges((eds) =>
      addEdge(
        {
          ...params,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#EC4899', strokeWidth: 2, strokeDasharray: '4 4' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#EC4899' }
        },
        eds
      )
    );

    if (isMemSource && isMemTarget) {
      try {
        await fetch('/api/graph/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sourceMemoryId: params.source,
            targetMemoryId: params.target,
            label: 'Momento Conectado'
          })
        });
      } catch (err) {
        console.warn('Erro ao persistir conexão manual:', err);
      }
    }
  }, [setEdges]);

  // Salva posição do nó permanentemente ao soltar (Correção Definitiva Bug 2)
  const onNodeDragStop = useCallback(async (event, node) => {
    if (!node || !node.position) return;
    const nodeType = node.type === 'wordNode' ? 'word' : 'memory';
    const x = Math.round(node.position.x);
    const y = Math.round(node.position.y);

    // Atualiza estado local de data para manter posição ao alternar abas
    setData((prev) => {
      if (!prev) return prev;
      if (nodeType === 'memory') {
        return {
          ...prev,
          memoryNodes: (prev.memoryNodes || []).map(m =>
            m.id === node.id ? { ...m, positionX: x, positionY: y } : m
          )
        };
      }
      return {
        ...prev,
        registeredWords: (prev.registeredWords || []).map(w =>
          `word-${w.id}` === node.id ? { ...w, positionX: x, positionY: y } : w
        )
      };
    });

    try {
      await fetch('/api/graph/node-position', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nodeType,
          id: node.id,
          x,
          y
        })
      });
    } catch (err) {
      console.warn('Erro ao salvar posição do nó:', err);
    }
  }, []);

  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'wordNode') {
      setSelectedWord(node.data);
      setIsWordDrawerOpen(true);
    } else if (node.type === 'memoryNode') {
      setSelectedMemory(node.data);
      setIsMemoryModalOpen(true);
    }
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header do Grafo */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-pink-400">
            <ShareNetwork weight="duotone" className="w-6 h-6" />
            <div>
              <h2 className="text-base font-bold font-display text-white">Grafo do Nosso Universo</h2>
              <p className="text-[11px] text-pink-300/70 font-sans">
                Constelação viva de relatos e afetos interligados (arraste nós ou conecte memórias!)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddWordOpen(true)}
              className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20 font-display shrink-0"
            >
              <Plus weight="bold" className="w-3.5 h-3.5" />
              <span>Cadastrar Palavra</span>
            </button>
          </div>
        </div>

        {/* Seletor de Modo do Grafo */}
        <div className="flex items-center gap-2 border-t border-white/5 pt-3">
          <span className="text-[11px] font-sans text-gray-400 shrink-0">Visualização:</span>
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setGraphMode('words')}
              className={`px-3 py-1 rounded-xl text-xs font-sans font-semibold flex items-center gap-1.5 transition-all ${
                graphMode === 'words'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkle weight={graphMode === 'words' ? 'fill' : 'duotone'} className="w-3.5 h-3.5" />
              <span>Palavras & Afetos</span>
            </button>

            <button
              onClick={() => setGraphMode('memories')}
              className={`px-3 py-1 rounded-xl text-xs font-sans font-semibold flex items-center gap-1.5 transition-all ${
                graphMode === 'memories'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FlowArrow weight="bold" className="w-3.5 h-3.5" />
              <span>Constelação de Memórias</span>
            </button>
          </div>
        </div>

        {/* Barra de Sugestões de Palavras Repetidas */}
        {data?.suggestedWords && data.suggestedWords.length > 0 && (
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-pink-300 font-sans font-medium">
              <span className="flex items-center gap-1">
                <Sparkle weight="fill" className="w-3.5 h-3.5 text-amber-300" />
                Palavras que vocês mais repetem (Sugestões de Grafo):
              </span>
              <span className="text-[10px] text-gray-400">Clique para aprovar</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {data.suggestedWords.map((sug) => (
                <button
                  key={sug.normalizedWord}
                  onClick={() => handleApproveSuggestion(sug)}
                  disabled={approvingWord === sug.word}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-sans font-semibold bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/25 text-pink-200 shrink-0 flex items-center gap-1 transition-all disabled:opacity-50"
                  title="Cadastrar esta palavra automaticamente no grafo"
                >
                  {approvingWord === sug.word ? (
                    <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
                  ) : (
                    <Plus weight="bold" className="w-2.5 h-2.5 text-pink-400" />
                  )}
                  <span>"{sug.word}" ({sug.count}x)</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CANVAS CÓSMICO DO REACT FLOW */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-pink-500/20 shadow-2xl h-[580px] sm:h-[640px] relative bg-[#07050d]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-sans gap-2 z-20">
            <Sparkle weight="fill" className="w-5 h-5 text-pink-400 animate-spin" />
            <span>Alinhando as estrelas do nosso universo...</span>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesConnectable={true}
            nodesDraggable={true}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background
              color="#EC4899"
              gap={24}
              size={1}
              variant={BackgroundVariant.Dots}
              style={{ opacity: 0.2 }}
            />
            <Controls className="!bg-[#140e20] !border-pink-500/30 !rounded-xl overflow-hidden text-pink-400" />
          </ReactFlow>
        )}

        {/* Legenda Flutuante */}
        <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-gray-300 font-sans space-y-0.5 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Entrada</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 ml-1.5" />
            <span>Saída (Arraste para ligar)</span>
          </div>
          <div className="text-[9px] text-gray-400">
            Arraste nós para salvar posição no banco
          </div>
        </div>
      </div>

      <WordDetailDrawer
        word={selectedWord}
        isOpen={isWordDrawerOpen}
        onClose={() => {
          setIsWordDrawerOpen(false);
          setSelectedWord(null);
        }}
        onDeleteWord={handleDeleteWord}
        onGoToMemory={onGoToMemory}
      />

      <MemoryTimelineModal
        memory={selectedMemory}
        connectedMemories={data?.memoryNodes?.filter(m => m.id !== selectedMemory?.id) || []}
        isOpen={isMemoryModalOpen}
        onClose={() => {
          setIsMemoryModalOpen(false);
          setSelectedMemory(null);
        }}
        onGoToMemory={onGoToMemory}
      />

      <AddWordModal
        isOpen={isAddWordOpen}
        onClose={() => setIsAddWordOpen(false)}
        onWordAdded={() => fetchGraphData()}
      />
    </div>
  );
}
