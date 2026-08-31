/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Check,
  Code2,
  Eye,
} from "lucide-react";
import { Button } from "@plane/propel/button";
import { setToast } from "@plane/propel/toast";
import type { TDiagram } from "@plane/types";
import { useDiagram } from "@/hooks/store/use-diagram";

type Props = {
  workspaceSlug: string;
  projectId: string;
  diagram: TDiagram;
};

// Templates
const TEMPLATES = {
  class: `classDiagram
class User {
  +int id
  +string name
  +string email
  +login()
  +logout()
}

class Order {
  +int id
  +double total
  +createOrder()
  +cancelOrder()
}

class Payment {
  +int id
  +double amount
  +pay()
}

User "1" --> "many" Order
Order "1" --> "1" Payment`,

  sequence: `sequenceDiagram
actor User
participant App
participant API
participant Database

User->>App: Click Login
App->>API: POST /login
API->>Database: Check user
Database-->>API: User found
API-->>App: Return token
App-->>User: Show dashboard`,

  flowchart: `flowchart TD
A[Start] --> B{User Login?}
B -- Yes --> C[Show Dashboard]
B -- No --> D[Show Login Page]
D --> E[Submit Email and Password]
E --> F{Valid?}
F -- Yes --> C
F -- No --> G[Show Error]
G --> D`,

  mindmap: `mindmap
  root((Main Goal))
    Planning
      Research
      Roadmap
      Scope
    Development
      Backend API
      Frontend UI
      Testing
    Deployment
      CI/CD
      Monitoring
      Launch`,

  state: `stateDiagram-v2
[*] --> Idle
Idle --> InProgress: Start Task
InProgress --> Review: Submit PR
Review --> Done: Merge
Review --> InProgress: Request Changes
Done --> [*]`,
};

export const DiagramCanvas = observer(function DiagramCanvas({ workspaceSlug, projectId, diagram }: Props) {
  const { updateDiagram } = useDiagram();

  const [title, setTitle] = useState(diagram.name || "Untitled Diagram");
  const [code, setCode] = useState(() => diagram.data?.code || TEMPLATES.class);
  const [svgOutput, setSvgOutput] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isMermaidReady, setIsMermaidReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [zoom, setZoom] = useState(1);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [modalZoom, setModalZoom] = useState(1);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Mermaid library dynamically if not on window
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).mermaid) {
      (window as any).mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
        securityLevel: "loose",
      });
      setIsMermaidReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).mermaid) {
        (window as any).mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
          securityLevel: "loose",
        });
        setIsMermaidReady(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      // clean up if needed
    };
  }, []);

  // Render Mermaid code to SVG
  const renderDiagram = useCallback(
    async (sourceCode: string) => {
      if (!isMermaidReady || !(window as any).mermaid) return;

      try {
        const id = `mermaid-svg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { svg } = await (window as any).mermaid.render(id, sourceCode);
        setSvgOutput(svg);
        setRenderError(null);
      } catch (err: any) {
        setRenderError(err?.message || "Invalid Mermaid UML syntax");
      }
    },
    [isMermaidReady]
  );

  // Re-render whenever code changes or mermaid becomes ready
  useEffect(() => {
    if (isMermaidReady) {
      renderDiagram(code);
    }
  }, [code, isMermaidReady, renderDiagram]);

  // Debounced auto-save
  const triggerAutoSave = useCallback(
    (newCode: string, newTitle: string) => {
      setSaveStatus("unsaved");
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await updateDiagram(workspaceSlug, projectId, diagram.id, {
            name: newTitle.trim() || "Untitled Diagram",
            data: {
              ...diagram.data,
              code: newCode,
            },
          });
          setSaveStatus("saved");
        } catch (error) {
          console.error("Failed to auto-save diagram:", error);
          setSaveStatus("unsaved");
        }
      }, 800);
    },
    [diagram.data, diagram.id, projectId, updateDiagram, workspaceSlug]
  );

  // Handle code change
  const handleCodeChange = (newVal: string) => {
    setCode(newVal);
    triggerAutoSave(newVal, title);
  };

  // Handle title change
  const handleTitleChange = (newVal: string) => {
    setTitle(newVal);
    triggerAutoSave(code, newVal);
  };

  // Explicit Save button
  const handleExplicitSave = async () => {
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      await updateDiagram(workspaceSlug, projectId, diagram.id, {
        name: title.trim() || "Untitled Diagram",
        data: {
          ...diagram.data,
          code,
        },
      });
      setSaveStatus("saved");
      setToast({
        type: "success",
        title: "Diagram Saved",
        message: "Your diagram was saved successfully.",
      });
    } catch (error) {
      setToast({
        type: "error",
        title: "Save Failed",
        message: "Could not save diagram.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Template loader
  const applyTemplate = (key: keyof typeof TEMPLATES) => {
    const templateCode = TEMPLATES[key];
    setCode(templateCode);
    triggerAutoSave(templateCode, title);
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-") || "diagram"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download PNG via canvas
  const handleDownloadPNG = () => {
    if (!svgOutput) return;
    const svgElement = previewContainerRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const bbox = svgElement.getBoundingClientRect();
      canvas.width = (bbox.width || 800) * 2;
      canvas.height = (bbox.height || 600) * 2;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${title.toLowerCase().replace(/\s+/g, "-") || "diagram"}.png`;
        link.click();
      }
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-primary overflow-hidden">
      {/* Top Navbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-surface-1 border-b border-subtle flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/diagrams`}
            className="p-1.5 rounded-md hover:bg-surface-2 text-secondary hover:text-primary transition"
            title="Back to diagrams"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Diagram"
            className="text-14 font-semibold bg-transparent border-b border-transparent hover:border-subtle focus:border-strong focus:outline-none text-primary px-1 py-0.5 max-w-sm truncate"
          />

          <span className="text-11 text-tertiary flex items-center gap-1">
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="size-3" /> Saved
              </span>
            )}
            {saveStatus === "saving" && <span className="text-amber-500 animate-pulse">Saving...</span>}
            {saveStatus === "unsaved" && <span className="text-tertiary">Unsaved changes</span>}
          </span>
        </div>

        {/* Template buttons & actions */}
        <div className="flex items-center flex-wrap gap-1.5">
          <div className="flex items-center bg-surface-2 p-0.5 rounded-md border border-subtle mr-2">
            <button
              type="button"
              onClick={() => applyTemplate("class")}
              className="px-2.5 py-1 text-11 font-medium rounded hover:bg-surface-1 text-secondary hover:text-primary transition"
            >
              Class
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("sequence")}
              className="px-2.5 py-1 text-11 font-medium rounded hover:bg-surface-1 text-secondary hover:text-primary transition"
            >
              Sequence
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("flowchart")}
              className="px-2.5 py-1 text-11 font-medium rounded hover:bg-surface-1 text-secondary hover:text-primary transition"
            >
              Flowchart
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("mindmap")}
              className="px-2.5 py-1 text-11 font-medium rounded hover:bg-surface-1 text-secondary hover:text-primary transition"
            >
              Mindmap
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("state")}
              className="px-2.5 py-1 text-11 font-medium rounded hover:bg-surface-1 text-secondary hover:text-primary transition"
            >
              State
            </button>
          </div>

          <Button
            variant="neutral-primary"
            size="sm"
            onClick={handleDownloadSVG}
            prependIcon={<Download className="size-3.5" />}
          >
            SVG
          </Button>

          <Button
            variant="neutral-primary"
            size="sm"
            onClick={handleDownloadPNG}
            prependIcon={<Download className="size-3.5" />}
          >
            PNG
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExplicitSave}
            loading={isSaving}
            prependIcon={<Save className="size-3.5" />}
          >
            Save
          </Button>
        </div>
      </header>

      {/* Main Split Layout: Editor & Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* UML Code Editor Pane */}
        <section className="flex flex-col border-r border-subtle bg-surface-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-b border-subtle">
            <div className="flex items-center gap-2 text-12 font-medium text-secondary">
              <Code2 className="size-4 text-primary" />
              <span>Mermaid UML Code</span>
            </div>
            <span className="text-11 text-tertiary bg-surface-1 px-2 py-0.5 rounded border border-subtle">
              Mermaid Syntax
            </span>
          </div>

          <div className="flex-1 p-3 overflow-auto">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Write your Mermaid UML syntax here..."
              spellCheck={false}
              className="w-full h-full p-3 font-mono text-13 bg-canvas text-primary border border-subtle rounded-lg focus:border-strong focus:outline-none resize-none leading-relaxed shadow-inner"
            />
          </div>
        </section>

        {/* Live Diagram Preview Pane */}
        <section className="flex flex-col bg-surface-2/40 overflow-hidden relative">
          <div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-b border-subtle">
            <div className="flex items-center gap-2 text-12 font-medium text-secondary">
              <Eye className="size-4 text-primary" />
              <span>Live Preview</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
                className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-1 transition"
                title="Zoom in"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
                className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-1 transition"
                title="Zoom out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-1 transition"
                title="Reset zoom"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreenModalOpen(true)}
                className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-1 transition ml-1"
                title="Fullscreen Preview"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={previewContainerRef}
            className="flex-1 p-6 overflow-auto flex items-center justify-center relative cursor-grab active:cursor-grabbing"
          >
            {renderError ? (
              <div className="max-w-md p-4 bg-danger-subtle/20 border border-danger-subtle rounded-xl text-danger-primary text-12">
                <h4 className="font-semibold text-13 mb-1">Diagram Syntax Error</h4>
                <pre className="whitespace-pre-wrap font-mono text-11 opacity-90">{renderError}</pre>
              </div>
            ) : svgOutput ? (
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="flex items-center justify-center min-w-full min-h-full"
                dangerouslySetInnerHTML={{ __html: svgOutput }}
              />
            ) : (
              <div className="text-secondary text-12 animate-pulse">Rendering diagram...</div>
            )}
          </div>
        </section>
      </div>

      {/* Fullscreen Zoom Modal */}
      {isFullscreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            <button
              type="button"
              onClick={() => setModalZoom((z) => Math.min(z + 0.3, 5))}
              className="px-3 py-1.5 text-12 font-medium bg-white/10 hover:bg-white/20 text-white rounded-md backdrop-blur transition"
            >
              Zoom In +
            </button>
            <button
              type="button"
              onClick={() => setModalZoom((z) => Math.max(z - 0.3, 0.3))}
              className="px-3 py-1.5 text-12 font-medium bg-white/10 hover:bg-white/20 text-white rounded-md backdrop-blur transition"
            >
              Zoom Out -
            </button>
            <button
              type="button"
              onClick={() => setModalZoom(1)}
              className="px-3 py-1.5 text-12 font-medium bg-white/10 hover:bg-white/20 text-white rounded-md backdrop-blur transition"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreenModalOpen(false)}
              className="px-3 py-1.5 text-12 font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition ml-2"
            >
              Close
            </button>
          </div>

          <div className="w-[90vw] h-[85vh] bg-surface-1 rounded-2xl overflow-auto flex items-center justify-center p-8 border border-subtle shadow-2xl">
            <div
              style={{
                transform: `scale(${modalZoom})`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease-out",
              }}
              dangerouslySetInnerHTML={{ __html: svgOutput }}
            />
          </div>
        </div>
      )}
    </div>
  );
});
