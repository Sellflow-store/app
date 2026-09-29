"use client";

import Link from "next/link";
import { Plus, Pencil, FileText } from "lucide-react";

export interface BlogRow {
  id: string;
  title: string;
  published: boolean;
  coverImage?: string;
  createdAt: string;
}

interface Props {
  shopSlug: string;
  posts: BlogRow[];
}

export default function BlogTable({ shopSlug, posts }: Props) {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}>
            Blog
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--panel-ink-muted)" }}>
            {posts.length} {posts.length === 1 ? "wpis" : "wpisów"}
          </p>
        </div>

        <Link
          href={`/dashboard/${shopSlug}/blog/new`}
          className="flex items-center gap-2 h-9 px-3.5 text-[13px] font-semibold rounded-lg transition-opacity hover:opacity-90"
          style={{ background: "var(--panel-accent)", color: "#fff" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--panel-accent)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--panel-accent)")}
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Nowy wpis
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--panel-border)", background: "var(--panel-surface)" }}>
        <div
          className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
          style={{
            gridTemplateColumns: "3rem 2fr 1fr 5rem",
            color: "var(--panel-ink-muted)",
            borderBottom: "1px solid var(--panel-border)",
            background: "var(--panel-surface-2)",
          }}
        >
          <span />
          <span>Tytuł</span>
          <span>Status</span>
          <span />
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="w-10 h-10" style={{ color: "var(--panel-border-strong)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "var(--panel-ink-muted)" }}>
              Brak wpisów. Kliknij &ldquo;Nowy wpis&rdquo;
            </p>
          </div>
        ) : (
          posts.map((post, i) => (
            <div
              key={post.id}
              className="grid items-center px-5 py-3 transition-colors"
              style={{
                gridTemplateColumns: "3rem 2fr 1fr 5rem",
                borderBottom: i < posts.length - 1 ? "1px solid var(--panel-surface-hover)" : "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--panel-surface-2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--panel-surface-hover)" }}>
                {post.coverImage ? (
                  <img src={post.coverImage} alt="" className="w-9 h-9 rounded-lg object-cover" />
                ) : (
                  <FileText className="w-4 h-4" style={{ color: "var(--panel-ink-faint)" }} strokeWidth={1.5} />
                )}
              </div>

              <p className="text-xs font-semibold truncate pl-2" style={{ color: "var(--panel-ink)" }}>
                {post.title}
              </p>

              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit"
                style={
                  post.published
                    ? { background: "var(--panel-success-soft)", color: "var(--panel-success-ink)" }
                    : { background: "var(--panel-surface-hover)", color: "var(--panel-ink-muted)" }
                }
              >
                {post.published ? "Opublikowany" : "Szkic"}
              </span>

              <div className="flex justify-end">
                <Link
                  href={`/dashboard/${shopSlug}/blog/${post.id}`}
                  aria-label={`Edytuj ${post.title}`}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--panel-ink-muted)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--panel-surface-hover)";
                    (e.currentTarget as HTMLElement).style.color = "var(--panel-ink)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.color = "var(--panel-ink-muted)";
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
