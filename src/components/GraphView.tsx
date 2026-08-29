import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { PadarthaEntity, EntityRelation, LanguageMode, PadarthaCategory } from '../types/ontology';
import { ZoomIn, ZoomOut, RefreshCw, Layers, BookOpen, X } from 'lucide-react';

interface GraphViewProps {
  entities: PadarthaEntity[];
  relations: EntityRelation[];
  langMode: LanguageMode;
  searchQuery: string;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  category: PadarthaCategory;
  label: string;
  entity: PadarthaEntity;
}

export const GraphView: React.FC<GraphViewProps> = ({
  entities,
  relations,
  langMode,
  searchQuery
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<PadarthaEntity | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Filter entities based on category & search query
  const filteredEntities = useMemo(() => {
    return entities.filter(e => {
      const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        e.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.name.sa.includes(searchQuery) ||
        e.name.iast.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [entities, selectedCategory, searchQuery]);

  // Nodes setup & positions state
  const nodesRef = useRef<Map<string, NodePosition>>(new Map());

  // Initialize node positions in circle or physics grid
  useEffect(() => {
    const map = new Map<string, NodePosition>();
    const width = 1000;
    const height = 650;
    const count = filteredEntities.length;

    filteredEntities.forEach((entity, index) => {
      const angle = (index / count) * 2 * Math.PI;
      const distance = 180 + Math.random() * 120;
      const existing = nodesRef.current.get(entity.id);

      map.set(entity.id, {
        id: entity.id,
        x: existing ? existing.x : width / 2 + Math.cos(angle) * distance,
        y: existing ? existing.y : height / 2 + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        radius: entity.parentId ? 24 : 32,
        color: entity.color || '#EAB308',
        category: entity.category,
        label: entity.name[langMode] || entity.name.en,
        entity
      });
    });

    nodesRef.current = map;
  }, [filteredEntities, langMode]);

  // Force-directed physics animation loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const simulate = () => {
      const nodes = Array.from(nodesRef.current.values());

      // 1. Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = n1.radius + n2.radius + 60;

          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.15;
            n1.vx -= dx * force;
            n1.vy -= dy * force;
            n2.vx += dx * force;
            n2.vy += dy * force;
          }
        }
      }

      // 2. Attraction along relations (edges)
      relations.forEach(rel => {
        const source = nodesRef.current.get(rel.sourceId);
        const target = nodesRef.current.get(rel.targetId);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = 160;
          const force = (dist - desiredDist) * 0.005;

          source.vx += dx * force;
          source.vy += dy * force;
          target.vx -= dx * force;
          target.vy -= dy * force;
        }
      });

      // 3. Center gravity force
      const centerX = width / 2;
      const centerY = height / 2;
      nodes.forEach(n => {
        if (n.id !== draggedNodeId) {
          n.vx += (centerX - n.x) * 0.001;
          n.vy += (centerY - n.y) * 0.001;
          n.vx *= 0.88; // Damping
          n.vy *= 0.88;
          n.x += n.vx;
          n.y += n.vy;
        }
      });

      // Draw canvas frame
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw background grid dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let x = 0; x < width * 2; x += 40) {
        for (let y = 0; y < height * 2; y += 40) {
          ctx.beginPath();
          ctx.arc(x - width/2, y - height/2, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Relations / Edges
      relations.forEach(rel => {
        const source = nodesRef.current.get(rel.sourceId);
        const target = nodesRef.current.get(rel.targetId);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (rel.type === 'inheresIn') {
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)'; // Gold
          ctx.setLineDash([4, 4]);
        } else if (rel.type === 'exclusiveQualityOf') {
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // Blue
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'; // Slate
          ctx.setLineDash([]);
        }

        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Edge label
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(midX - 30, midY - 10, 60, 20);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(rel.label[langMode] || rel.type, midX, midY + 3);
      });

      // Draw Nodes
      nodes.forEach(n => {
        const isSelected = selectedEntity?.id === n.id;

        // Glowing outer halo
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + (isSelected ? 10 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? `${n.color}55` : `${n.color}22`;
        ctx.fill();

        // Node Circle body
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? n.color : '#0f172a';
        ctx.fill();
        ctx.strokeStyle = n.color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Label text inside node
        ctx.font = isSelected ? 'bold 12px sans-serif' : '11px sans-serif';
        ctx.fillStyle = isSelected ? '#020617' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = n.entity.name[langMode] || n.entity.name.en;
        ctx.fillText(text.slice(0, 14), n.x, n.y);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [relations, langMode, selectedEntity, zoom, pan, draggedNodeId]);

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicked a node
    let clickedNode: NodePosition | null = null;
    nodesRef.current.forEach(n => {
      const dist = Math.sqrt((n.x - mouseX) ** 2 + (n.y - mouseY) ** 2);
      if (dist <= n.radius) {
        clickedNode = n;
      }
    });

    if (clickedNode) {
      const node = clickedNode as NodePosition;
      setSelectedEntity(node.entity);
      setDraggedNodeId(node.id);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeId) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const node = nodesRef.current.get(draggedNodeId);
      if (node) {
        node.x = (e.clientX - rect.left - pan.x) / zoom;
        node.y = (e.clientY - rect.top - pan.y) / zoom;
      }
    } else if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsDraggingCanvas(false);
  };

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Padārthas' },
    { id: 'Dravya', label: 'Dravya (Substance)' },
    { id: 'Guna', label: 'Guṇa (Quality)' },
    { id: 'Karma', label: 'Karma (Action)' },
    { id: 'Samanya', label: 'Sāmānya (Universal)' },
    { id: 'Visesa', label: 'Viśeṣa (Particularity)' },
    { id: 'Samavaya', label: 'Samavāya (Inherence)' },
    { id: 'Abhava', label: 'Abhāva (Non-existence)' }
  ];

  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col shadow-2xl">
      {/* Top Filter Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800 backdrop-blur-md">
        <Layers className="w-4 h-4 text-amber-400 ml-1" />
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Zoom / Controls Panel */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Reset View"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        width={1100}
        height={680}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Slide-out Entity Details Panel */}
      {selectedEntity && (
        <div className="absolute top-4 right-4 z-30 w-80 max-h-[calc(100%-32px)] overflow-y-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ backgroundColor: `${selectedEntity.color}25`, color: selectedEntity.color }}
              >
                {selectedEntity.category}
              </span>
              <h2 className="text-xl font-bold text-slate-100">{selectedEntity.name.sa}</h2>
              <p className="text-xs text-amber-400 font-medium">{selectedEntity.name.iast} • {selectedEntity.name.en}</p>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs text-slate-300">
            {/* Philosophical Definition */}
            <div>
              <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Definition</h3>
              <p className="italic text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                "{selectedEntity.description[langMode] || selectedEntity.description.en}"
              </p>
            </div>

            {/* Classical Sutra Citation */}
            {selectedEntity.sutra && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Sūtra ({selectedEntity.sutra.source})</span>
                </div>
                <p className="font-serif text-slate-200 text-sm">{selectedEntity.sutra.textSa}</p>
                <p className="text-amber-300 text-[11px]">{selectedEntity.sutra.textIast}</p>
                <p className="text-slate-400 text-[11px] mt-1">{selectedEntity.sutra.translation}</p>
              </div>
            )}

            {/* Eternal Status & Attributes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Eternality (Nityatva)</span>
                <span className="font-medium text-amber-400">{selectedEntity.eternalStatus}</span>
              </div>
              <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Category</span>
                <span className="font-medium text-blue-400">{selectedEntity.category}</span>
              </div>
            </div>

            {/* Attributes list */}
            {selectedEntity.attributes.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">Attributes & Properties</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedEntity.attributes.map((attr, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                      {attr}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
