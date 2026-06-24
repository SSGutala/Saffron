"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect } from "react";

import type { ArtifactContent } from "@/types/artifacts";
import { Input } from "@/components/ui/input";

interface DiagramEditorProps {
  graph: NonNullable<ArtifactContent["diagramGraph"]>;
  onChange: (graph: NonNullable<ArtifactContent["diagramGraph"]>) => void;
}

export function DiagramEditor({ graph, onChange }: DiagramEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    onChange({ nodes, edges });
  }, [nodes, edges, onChange]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, id: `e-${Date.now()}` }, eds)),
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
    <div className="h-full flex flex-col">
      <div className="p-2 border-b text-xs text-muted-foreground bg-muted/30">
        Lucidchart-style editor — drag nodes, connect handles, edit labels below
      </div>
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <div className="p-2 border-t max-h-32 overflow-auto space-y-1 bg-background">
        {nodes.map((n) => (
          <div key={n.id} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-16">{n.id}</span>
            <Input
              value={String(n.data?.label ?? "")}
              onChange={(e) => updateLabel(n.id, e.target.value)}
              className="h-7"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
