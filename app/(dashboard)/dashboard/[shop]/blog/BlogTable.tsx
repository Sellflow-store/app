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
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
            Blog
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            {posts.length} {posts.length === 1 ? "wpis" : "wpisów"}
          </p>
        </div>

        <Link
          href={`/dashboard/${shopSlug}/blog/new`}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all"
          style={{ background: "oklch(56% 0.30 335)", color: "#fff" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(46% 0.25 333)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(56% 0.30 335)")}
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Nowy wpis
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(90% 0 0)", background: "#fff" }}>
        <div
          className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
          style={{
            gridTemplateColumns: "3rem 2fr 1fr 5rem",
            color: "oklch(50% 0 0)",
            borderBottom: "1px solid oklch(92% 0 0)",
            background: "oklch(98% 0 0)",
          }}
        >
          <span />
          <span>Tytuł</span>
          <span>Status</span>
          <span />
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="w-10 h-10" style={{ color: "oklch(80% 0 0)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "oklch(55% 0 0)" }}>
              Brak wpisów — kliknij &ldquo;Nowy wpis&rdquo;
            </p>
          </div>
        ) : (
          posts.map((post, i) => (
            <div
              key={post.id}
              className="grid items-center px-5 py-3 transition-colors"
              style={{
                gridTemplateColumns: "3rem 2fr 1fr 5rem",
                borderBottom: i < posts.length - 1 ? "1px solid oklch(94% 0 0)" : "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(98.5% 0.003 250)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(95% 0.008 250)" }}>
                {post.coverImage ? (
                  <img src={post.coverImage} alt="" className="w-9 h-9 rounded-lg object-cover" />
                ) : (
                  <FileText className="w-4 h-4" style={{ color: "oklch(65% 0 0)" }} strokeWidth={1.5} />
                )}
              </div>

              <p className="text-xs font-semibold truncate pl-2" style={{ color: "oklch(11% 0.10 275)" }}>
                {post.title}
              </p>

              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit"
                style={
                  post.published
                    ? { background: "oklch(95% 0.05 145)", color: "oklch(40% 0.18 145)" }
                    : { background: "oklch(95% 0 0)", color: "oklch(50% 0 0)" }
                }
              >
                {post.published ? "Opublikowany" : "Szkic"}
              </span>

              <div className="flex justify-end">
                <Link
                  href={`/dashboard/${shopSlug}/blog/${post.id}`}
                  aria-label={`Edytuj ${post.title}`}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "oklch(55% 0 0)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "oklch(94% 0 0)";
                    (e.currentTarget as HTMLElement).style.color = "oklch(20% 0 0)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.color = "oklch(55% 0 0)";
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
