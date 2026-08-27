/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2, ZoomIn, ZoomOut, RotateCcw, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@plane/propel/button";
import { setToast } from "@plane/propel/toast";
import type { TMindmap, TMindmapNode } from "@plane/types";
import { useMindmap } from "@/hooks/store/use-mindmap";

type Props = {
  workspaceSlug: string;
  projectId: string;
  mindmap: TMindmap;
};

const DEFAULT_TREE: TMindmapNode = {
  text: "MIND MAPPING",
  x: 500,
  y: 300,
  isRoot: true,
  children: [
    {
      text: "Ideas",
      x: 260,
      y: 160,
      children: [
        { text: "Plan", x: 80, y: 80 },
        { text: "Research", x: 80, y: 160 },
        { text: "System", x: 80, y: 240 },
      ],
    },
    {
      text: "Organization",
      x: 240,
      y: 380,
      children: [{ text: "Milestones", x: 60, y: 380 }],
    },
    {
      text: "Goals",
      x: 740,
      y: 160,
      children: [
        { text: "Features", x: 940, y: 80 },
        { text: "Launch", x: 940, y: 160 },
        { text: "Feedback", x: 940, y: 240 },
      ],
    },
    {
      text: "Team",
      x: 740,
      y: 380,
      children: [
        { text: "Roles", x: 940, y: 340 },
        { text: "Roadmap", x: 940, y: 420 },
      ],
    },
  ],
};

export const MindmapCanvas = observer(function MindmapCanvas({ workspaceSlug, projectId, mindmap }: Props) {
  const { updateMindmap } = useMindmap();

  const [title, setTitle] = useState(mindmap.name || "Untitled Mindmap");
  const [tree, setTree] = useState<TMindmapNode>(() => mindmap.data?.tree || DEFAULT_TREE);
  const [zoom, setZoom] = useState(1);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // SVG connector lines state
  const [connections, setConnections] = useState<Array<{ id: string; d: string }>>([]);

  // Helper to deep clone tree
  const cloneTree = (node: TMindmapNode): TMindmapNode => ({
    ...node,
    children: node.children ? node.children.map(cloneTree) : undefined,
  });

  // Helper to find node by path (e.g. "root-0-1")
  const getNodeByPath = useCallback((currentTree: TMindmapNode, path: string): TMindmapNode | null => {
    if (path === "root") return currentTree;
    const parts = path.split("-").slice(1);
    let current: TMindmapNode = currentTree;
    for (const part of parts) {
      const idx = parseInt(part, 10);
      if (!current.children || !current.children[idx]) return null;
      current = current.children[idx];
    }
    return current;
  }, []);

  // Recalculate SVG curved bezier connections
  const updateConnections = useCallback(() => {
    const lines: Array<{ id: string; d: string }> = [];

    const traverse = (parent: TMindmapNode, parentPath: string) => {
      const parentEl = nodeRefs.current[parentPath];
      if (!parentEl || !parent.children) return;

      const pRect = {
        left: parent.x,
        top: parent.y,
        width: parentEl.offsetWidth || 140,
        height: parentEl.offsetHeight || 44,
      };
      const x1 = pRect.left + pRect.width / 2;
      const y1 = pRect.top + pRect.height / 2;

      parent.children.forEach((child, idx) => {
        const childPath = `${parentPath}-${idx}`;
        const childEl = nodeRefs.current[childPath];
        const cWidth = childEl ? childEl.offsetWidth : 140;
        const cHeight = childEl ? childEl.offsetHeight : 44;

        const x2 = child.x + cWidth / 2;
        const y2 = child.y + cHeight / 2;

        const cpX1 = x1 + (x2 - x1) / 2;
        const cpY2 = y2;
        const d = `M ${x1} ${y1} C ${cpX1} ${y1}, ${cpX1} ${cpY2}, ${x2} ${y2}`;
        lines.push({ id: `${parentPath}->${childPath}`, d });

        traverse(child, childPath);
      });
    };

    traverse(tree, "root");
    setConnections(lines);
  }, [tree]);

  useEffect(() => {
    updateConnections();
  }, [tree, updateConnections]);

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMindmap(workspaceSlug, projectId, mindmap.id, {
        name: title,
        data: { tree },
      });
      setToast({
        type: "success",
        title: "Saved",
        message: "Mindmap saved successfully.",
      });
    } catch (error) {
      setToast({
        type: "error",
        title: "Error",
        message: "Failed to save mindmap.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Node Dragging Handler
  const handleNodeMouseDown = (e: React.MouseEvent, path: string) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).isContentEditable) {
      return;
    }
    e.preventDefault();

    const startX = e.pageX;
    const startY = e.pageY;

    const currentTree = cloneTree(tree);
    const targetNode = getNodeByPath(currentTree, path);
    if (!targetNode) return;

    const origX = targetNode.x;
    const origY = targetNode.y;

    const moveSubtree = (node: TMindmapNode, deltaX: number, deltaY: number) => {
      node.x += deltaX;
      node.y += deltaY;
      node.children?.forEach((child) => moveSubtree(child, deltaX, deltaY));
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.pageX - startX) / zoom;
      const deltaY = (moveEvent.pageY - startY) / zoom;

      const newTree = cloneTree(tree);
      const nodeToMove = getNodeByPath(newTree, path);
      if (nodeToMove) {
        const curDeltaX = origX + deltaX - nodeToMove.x;
        const curDeltaY = origY + deltaY - nodeToMove.y;
        moveSubtree(nodeToMove, curDeltaX, curDeltaY);
        setTree(newTree);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Add child node
  const handleAddChild = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTree = cloneTree(tree);
    const targetNode = getNodeByPath(newTree, path);
    if (!targetNode) return;

    if (!targetNode.children) targetNode.children = [];
    const offsetIndex = targetNode.children.length;
    targetNode.children.push({
      text: "New Node",
      x: targetNode.x + 180,
      y: targetNode.y + offsetIndex * 60 - 30,
      children: [],
    });

    setTree(newTree);
  };

  // Delete node
  const handleDeleteNode = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (path === "root") return;

    const parts = path.split("-");
    const targetIdx = parseInt(parts.pop()!, 10);
    const parentPath = parts.join("-");

    const newTree = cloneTree(tree);
    const parentNode = getNodeByPath(newTree, parentPath);
    if (parentNode && parentNode.children) {
      parentNode.children.splice(targetIdx, 1);
      setTree(newTree);
    }
  };

  // Update node text
  const handleTextChange = (path: string, newText: string) => {
    const newTree = cloneTree(tree);
    const targetNode = getNodeByPath(newTree, path);
    if (targetNode) {
      targetNode.text = newText || "Untitled";
      setTree(newTree);
    }
    setEditingPath(null);
  };

  // Recursive Node Renderer
  const renderNodes = (node: TMindmapNode, path = "root", branchIndex = 0, depth = 0): React.ReactNode => {
    const isRoot = path === "root";
    let colorClass = "bg-white text-black border border-black shadow-md";

    if (isRoot) {
      colorClass = "bg-[#b0a4de] text-black border-2 border-black shadow-lg font-bold text-base";
    } else if (depth === 1) {
      const branchColors = [
        "bg-[#fca5a5]",
        "bg-[#fed7aa]",
        "bg-[#a7f3d0]",
        "bg-[#ddd6fe]",
      ];
      colorClass = `${branchColors[branchIndex % 4]} text-black border border-black shadow-md font-semibold text-sm`;
    }

    const isEditing = editingPath === path;

    return (
      <React.Fragment key={path}>
        <div
          ref={(el) => {
            nodeRefs.current[path] = el;
          }}
          className={`absolute select-none px-4 py-2 rounded-2xl border transition cursor-grab active:cursor-grabbing flex flex-col items-center justify-center min-w-[130px] group z-10 ${colorClass}`}
          style={{ left: `${node.x}px`, top: `${node.y}px` }}
          onMouseDown={(e) => handleNodeMouseDown(e, path)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingPath(path);
          }}
        >
          {isEditing ? (
            <input
              type="text"
              defaultValue={node.text}
              autoFocus
              className="bg-transparent text-center outline-none border-b border-current w-full px-1 font-medium text-inherit"
              onBlur={(e) => handleTextChange(path, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTextChange(path, e.currentTarget.value);
                if (e.key === "Escape") setEditingPath(null);
              }}
            />
          ) : (
            <span className="w-full text-center truncate pointer-events-none text-inherit">{node.text}</span>
          )}

          {/* Action buttons on hover */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => handleAddChild(path, e)}
              className="size-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-md text-xs transition"
              title="Add Sub-node"
            >
              <Plus className="size-3.5" />
            </button>
            {!isRoot && (
              <button
                type="button"
                onClick={(e) => handleDeleteNode(path, e)}
                className="size-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md text-xs transition"
                title="Delete Node"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {node.children?.map((child, idx) =>
          renderNodes(child, `${path}-${idx}`, isRoot ? idx : branchIndex, depth + 1)
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-primary overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-subtle bg-surface-1 z-20">
        <div className="flex items-center gap-3">
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/mindmaps`}
            className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-layer-transparent-hover transition"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-16 font-semibold bg-transparent border-b border-transparent hover:border-subtle focus:border-strong focus:outline-none px-1 transition text-primary"
            placeholder="Mindmap title..."
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-surface-2 border border-subtle rounded-md p-0.5 mr-2 text-secondary">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="p-1 hover:bg-layer-transparent-hover rounded transition"
              title="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="text-11 px-2 font-mono font-medium">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-1 hover:bg-layer-transparent-hover rounded transition"
              title="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1 hover:bg-layer-transparent-hover rounded transition ml-0.5"
              title="Reset zoom"
            >
              <RotateCcw className="size-3" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            loading={isSaving}
            prependIcon={<Save className="size-3.5" />}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Infinite Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative p-4 cursor-crosshair bg-slate-50 select-none"
      >
        <div
          className="relative min-w-[2400px] min-height-[2400px] h-[2400px] origin-top-left transition-transform duration-75"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* SVG Canvas for curved connections */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full">
            {connections.map((conn) => (
              <path
                key={conn.id}
                d={conn.d}
                stroke="#94a3b8"
                strokeWidth="2.5"
                fill="transparent"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Render All Tree Nodes */}
          {renderNodes(tree)}
        </div>
      </div>
    </div>
  );
});
