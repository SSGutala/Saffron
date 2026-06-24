"use client";

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo } from "react";

import type { ArtifactContent } from "@/types/artifacts";
import { briefToDiagramGraph } from "@/lib/artifacts/prose-formatter";
import { Input } from "@/components/ui/input";

function ProcessNode({ data }: { data: { label: string; lane?: string; subtitle?: string } }) {
  return (
    <div className="px-4 py-3 rounded-xl border-2 border-primary/40 bg-white shadow-md min-w-[140px] max-w-[200px]">
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">
        {data.lane ?? "Step"}
      </p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.label}</p>
      {data.subtitle && (
        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{data.subtitle}</p>
      )}
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
}

const nodeTypes = { process: ProcessNode };

interface DiagramEditorProps {
  graph: NonNullable<ArtifactContent["diagramGraph"]>;
  onChange: (graph: NonNullable<ArtifactContent["diagramGraph"]>) => void;
}

export function DiagramEditor({ graph, onChange }: DiagramEditorProps) {
  const initialNodes = useMemo(() => {
    const g =
      graph.nodes?.length ? graph : briefToDiagramGraph({});
    return g.nodes.map((n) => ({
      ...n,
      type: "process",
      data: {
        label: String(n.data?.label ?? "Step"),
        lane: n.data?.lane,
        subtitle: (n.data as { subtitle?: string })?.subtitle,
      },
    })) as Node[];
  }, [graph]);

  const initialEdges = useMemo(() => {
    const g = graph.nodes?.length ? graph : briefToDiagramGraph({});
    return g.edges;
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (!graph.nodes?.length) {
      const fallback = briefToDiagramGraph({});
      setNodes(
        fallback.nodes.map((n) => ({
          ...n,
          type: "process",
          data: { label: n.data.label, lane: n.data.lane },
        })) as Node[],
      );
      setEdges(fallback.edges);
    }
  }, [graph.nodes?.length, setNodes, setEdges]);

  useEffect(() => {
    onChange({
      nodes: nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: n.data as { label: string; lane?: string },
      })),
      edges,
    });
  }, [nodes, edges, onChange]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, id: `e-${Date.now()}` } as Parameters<typeof addEdge>[0], eds),
      ),
    [setEdges],
  );

  const updateLabel = (id: string, label: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n,
      ),
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-2 border-b text-xs text-gray-600 bg-white flex items-center justify-between">
        <span>Workflow map — drag steps, connect flows, edit labels below</span>
        <span className="text-muted-foreground">{nodes.length} steps</span>
      </div>
      <div className="flex-1 min-h-[320px]">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Loading workflow diagram…
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background gap={16} size={1} color="#cbd5e1" />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}
      </div>
      <div className="p-2 border-t max-h-36 overflow-auto space-y-1 bg-white">
        {nodes.map((n) => (
          <div key={n.id} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-20 truncate text-xs">
              {(n.data as { lane?: string })?.lane ?? n.id}
            </span>
            <Input
              value={String((n.data as { label?: string })?.label ?? "")}
              onChange={(e) => updateLabel(n.id, e.target.value)}
              className="h-8"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
