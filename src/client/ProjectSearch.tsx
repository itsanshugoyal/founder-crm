import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon as MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { XIcon as X } from "@phosphor-icons/react/dist/csr/X";
import type { CrmRecord } from "../shared/types";
import { modules } from "./models";
import { indexSearchRecords, normalizeSearch, searchRecords } from "./record-search";

export function ProjectSearch({ records, projectId, members, pages, onRecord, onPage }: {
  records: CrmRecord[];
  projectId: string;
  members: { id: string; name: string }[];
  pages: readonly { page: string; label: string }[];
  onRecord: (record: CrmRecord) => void;
  onPage: (page: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const index = useMemo(() => indexSearchRecords(records, projectId, members), [records, projectId, members]);
  const matches = useMemo(() => searchRecords(index, query), [index, query]);
  const suggestions = [
    ...matches.map((record) => ({ key: record.id, title: record.title, detail: `${modules[record.kind].singular} · ${record.status.replaceAll("_", " ")}`, select: () => onRecord(record) })),
    ...pages.filter((page) => !query.trim() || normalizeSearch(`${page.label} ${page.page} ${page.page === "people" ? "contacts companies" : page.page === "work" ? "tasks meetings campaigns" : ""}`).includes(normalizeSearch(query))).slice(0, 4).map((page) => ({ key: `page-${page.page}`, title: page.label, detail: "Open section", select: () => onPage(page.page) })),
  ];
  const activeIndex = Math.min(selected, suggestions.length - 1);
  function choose(index: number) {
    suggestions[index]?.select();
    setOpen(false);
  }
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", shortcut);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  return (
    <div ref={root} className="project-search">
      <div className="topbar-search">
        <MagnifyingGlass size={16} aria-hidden="true" />
        <input ref={input} role="combobox" aria-label="Search this project" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined} value={query} placeholder="Search records, people, tasks…" autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setSelected(0); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault(); setOpen(true);
              if (suggestions.length) setSelected((activeIndex + (event.key === "ArrowDown" ? 1 : -1) + suggestions.length) % suggestions.length);
            } else if (event.key === "Enter" && open && activeIndex >= 0) { event.preventDefault(); choose(activeIndex); }
          }} />
        {query ? <button type="button" className="project-search-clear" aria-label="Clear search" onClick={() => { setQuery(""); setSelected(0); input.current?.focus(); }}><X size={14} /></button> : <kbd>Ctrl K</kbd>}
      </div>
      {open && <div className="project-search-dropdown">
        <div className="project-search-caption">{query.trim() ? "Related results" : matches.length ? "Recently updated · quick links" : "Jump to a section"}</div>
        <div id={listId} role="listbox" aria-label="Search suggestions">
          {suggestions.map((item, index) => <button id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex} type="button" key={item.key} onMouseEnter={() => setSelected(index)} onClick={() => choose(index)}><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowRight size={15} aria-hidden="true" /></button>)}
        </div>
        {!suggestions.length && <p role="status">No matching records. Try a name, company, task, or email.</p>}
        <footer>↑ ↓ to browse · Enter to open · Esc to close</footer>
      </div>}
    </div>
  );
}
