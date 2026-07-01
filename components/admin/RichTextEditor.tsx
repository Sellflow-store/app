"use client";

import { useRef, useEffect, useCallback } from "react";
import { Bold, Italic, List, ListOrdered, Link2, Undo2, Redo2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Lightweight rich-text editor (contentEditable + execCommand). No dependencies.
 * Emits HTML that the storefront renders through sanitizeHtml(). Supports the
 * common formatting a product description needs: bold, italic, bullet/numbered
 * lists, links, undo/redo.
 */
export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Seed the editable DOM once. We deliberately don't sync `value` back into
  // innerHTML on every render — that would reset the caret on each keystroke.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value ?? "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      ref.current?.focus();
      document.execCommand(command, false, arg);
      sync();
    },
    [sync]
  );

  const addLink = useCallback(() => {
    const url = window.prompt("Adres URL linku (https://…)");
    if (!url) return;
    const href = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
    exec("createLink", href);
  }, [exec]);

  const btn =
    "flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-[oklch(94%_0_0)]";
  const iconStyle = { color: "oklch(35% 0 0)" } as const;
  const divider = <span className="w-px h-5 mx-1" style={{ background: "oklch(90% 0 0)" }} />;

  // Keep the selection when a toolbar button is pressed.
  const hold = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ border: "1.5px solid oklch(88% 0 0)", background: "#fff" }}
    >
      <div
        className="flex items-center gap-0.5 px-2 py-1.5"
        style={{ borderBottom: "1px solid oklch(92% 0 0)", background: "oklch(98.5% 0 0)" }}
      >
        <button type="button" className={btn} onMouseDown={hold(() => exec("bold"))} aria-label="Pogrubienie" title="Pogrubienie">
          <Bold className="w-4 h-4" style={iconStyle} strokeWidth={2.25} />
        </button>
        <button type="button" className={btn} onMouseDown={hold(() => exec("italic"))} aria-label="Kursywa" title="Kursywa">
          <Italic className="w-4 h-4" style={iconStyle} strokeWidth={2.25} />
        </button>
        {divider}
        <button type="button" className={btn} onMouseDown={hold(() => exec("insertUnorderedList"))} aria-label="Lista punktowana" title="Lista punktowana">
          <List className="w-4 h-4" style={iconStyle} strokeWidth={2} />
        </button>
        <button type="button" className={btn} onMouseDown={hold(() => exec("insertOrderedList"))} aria-label="Lista numerowana" title="Lista numerowana">
          <ListOrdered className="w-4 h-4" style={iconStyle} strokeWidth={2} />
        </button>
        {divider}
        <button type="button" className={btn} onMouseDown={hold(addLink)} aria-label="Wstaw link" title="Wstaw link">
          <Link2 className="w-4 h-4" style={iconStyle} strokeWidth={2} />
        </button>
        {divider}
        <button type="button" className={btn} onMouseDown={hold(() => exec("undo"))} aria-label="Cofnij" title="Cofnij">
          <Undo2 className="w-4 h-4" style={iconStyle} strokeWidth={2} />
        </button>
        <button type="button" className={btn} onMouseDown={hold(() => exec("redo"))} aria-label="Ponów" title="Ponów">
          <Redo2 className="w-4 h-4" style={iconStyle} strokeWidth={2} />
        </button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        data-placeholder={placeholder ?? "Materiały, wymiary, pielęgnacja…"}
        className="rte-content px-3 py-2.5 text-[13px] leading-relaxed outline-none min-h-[160px]"
        style={{ color: "oklch(11% 0.10 275)", fontFamily: "var(--font-body)" }}
      />

      <style jsx global>{`
        .rte-content:empty:before {
          content: attr(data-placeholder);
          color: oklch(65% 0 0);
          pointer-events: none;
        }
        .rte-content ul { list-style: disc; padding-left: 1.25rem; margin: 0.25rem 0; }
        .rte-content ol { list-style: decimal; padding-left: 1.25rem; margin: 0.25rem 0; }
        .rte-content a { color: oklch(48% 0.22 270); text-decoration: underline; }
        .rte-content p { margin: 0.35rem 0; }
      `}</style>
    </div>
  );
}
