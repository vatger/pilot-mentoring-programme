"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import PageLayout from "@/components/PageLayout";

const ACCEPT = "application/pdf,image/jpeg,image/jpg,image/png,image/svg+xml";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 10 || value % 1 === 0 ? 0 : 1)} ${sizes[i]}`;
}

function validateFile(file: File) {
  const type = file.type;
  const isPdf = type === "application/pdf";
  const isImg = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"].includes(type);
  if (!isPdf && !isImg) return `Nicht erlaubt: ${type || file.name}`;
  const max = isPdf ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > max) return `${file.name}: ${formatBytes(file.size)} > ${formatBytes(max)}`;
  return null;
}

export default function TrainingSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = useMemo(() => params?.id?.toString() ?? "unbekannt", [params]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [strokeColor, setStrokeColor] = useState<string>("#0f172a");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [messages, setMessages] = useState<string[]>([]);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/trainings/session/${sessionId}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = width;
      canvas.height = height;
      ctx.putImageData(img, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const addMsg = (msg: string) => setMessages((prev) => [msg, ...prev].slice(0, 4));

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    lastPos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    lastPos.current = { x: offsetX, y: offsetY };
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const errors: string[] = [];
    Array.from(files).forEach((file) => {
      const err = validateFile(file);
      if (err) errors.push(err);
    });
    if (errors.length) {
      addMsg(errors.join(" | "));
      return;
    }
    addMsg("Upload-Stub: Dateien validiert. CDN-Upload folgt.");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.files;
    if (items && items.length > 0) {
      handleFiles(items);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      addMsg("Canvas geleert");
    }
  };

  return (
    <PageLayout>
      <div className="header-container">
        <div className="header">
          <h1>Session {sessionId}</h1>
        </div>
      </div>

      <div className="card">
        <h3>Link teilen</h3>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <Link href={`/trainings/session/${sessionId}`}>/trainings/session/{sessionId}</Link>
          <button className="button" onClick={async () => {
            try {
              await navigator.clipboard.writeText(shareUrl);
              addMsg("Link kopiert");
            } catch {
              addMsg("Kopieren fehlgeschlagen");
            }
          }}>Link kopieren</button>
        </div>
      </div>

      <div className="card" onPaste={handlePaste}>
        <h3>Dateien ablegen (Stub)</h3>
        <p>Ziehe Dateien hierher oder klicke zum Auswählen. PDF bis 25 MB, JPG/PNG/SVG bis 5 MB.</p>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{ border: "2px dashed #94a3b8", padding: "16px", borderRadius: "10px", minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}
        >
          Dateien hierher ziehen
        </div>
        <input type="file" multiple accept={ACCEPT} style={{ marginTop: "12px" }} onChange={(e) => handleFiles(e.target.files)} />
        <p style={{ marginTop: "8px" }}>Uploads werden erst aktiv, sobald die CDN-API angebunden ist.</p>
      </div>

      <div className="card">
        <h3>Whiteboard</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
          <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            Farbe
            <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} />
          </label>
          <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            Stärke
            <input type="range" min={1} max={10} value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} />
            <span>{strokeWidth}px</span>
          </label>
          <button className="button" onClick={clearCanvas}>Leeren</button>
        </div>
        <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden" }}>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "400px", touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
        <p style={{ marginTop: "8px" }}>Hinweis: Dieses Whiteboard ist derzeit nicht synchronisiert oder gespeichert; es dient als Platzhalter für eine spätere Echtzeit-Implementierung.</p>
      </div>

      {messages.length > 0 && (
        <div className="card">
          <h3>Status</h3>
          <ul>
            {messages.map((m, idx) => (<li key={idx}>{m}</li>))}
          </ul>
        </div>
      )}
    </PageLayout>
  );
}
