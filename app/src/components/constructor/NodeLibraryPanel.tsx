"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Sparkles, Layers, MapPin, Grid3X3, Filter, Search, PackagePlus } from "lucide-react";
import clsx from "clsx";
import {
  missionTemplates,
  missionCollections,
  mapTemplates,
  type MissionTemplate,
  type MissionCollection,
  resolveTemplate
} from "@/data/nodeLibrary";

interface NodeLibraryPanelProps {
  onCreate: (template: MissionTemplate) => void;
  onCreateCollection?: (collection: MissionCollection) => void;
  onApplyMapTemplate?: (templateId: string) => void;
}

type TabKey = "templates" | "collections" | "maps";

const tabConfig: Array<{ id: TabKey; label: string; icon: React.ReactNode }> = [
  { id: "templates", label: "Шаблоны", icon: <Sparkles size={13} /> },
  { id: "collections", label: "Коллекции", icon: <PackagePlus size={13} /> },
  { id: "maps", label: "Карты", icon: <MapPin size={13} /> }
];

const tagIcons: Record<string, React.ReactNode> = {
  onboarding: <Layers size={12} className="text-sky-300" />,
  engagement: <Layers size={12} className="text-violet-300" />,
  assessment: <Grid3X3 size={12} className="text-rose-300" />,
  compliance: <Filter size={12} className="text-amber-300" />,
  narrative: <Sparkles size={12} className="text-indigo-300" />,
  skills: <Grid3X3 size={12} className="text-emerald-300" />,
  final: <MapPin size={12} className="text-fuchsia-300" />
};

export function NodeLibraryPanel({ onCreate, onCreateCollection, onApplyMapTemplate }: NodeLibraryPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    missionTemplates.forEach((template) => {
      template.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, []);

  const filteredTemplates = useMemo(() => {
    return missionTemplates.filter((template) => {
      const matchesSearch = searchQuery
        ? `${template.title} ${template.description}`.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesTags = selectedTags.length
        ? selectedTags.every((tag) => template.tags?.includes(tag))
        : true;
      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags]);

  const filteredCollections = useMemo(() => {
    if (!selectedTags.length && !searchQuery) {
      return missionCollections;
    }
    return missionCollections.filter((collection) => {
      const matchesSearch = searchQuery
        ? `${collection.title} ${collection.description}`.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      if (!matchesSearch) return false;
      if (!selectedTags.length) return true;
      const collectionTags = new Set<string>();
      collection.items.forEach((item) => {
        resolveTemplate(item.templateId)?.tags?.forEach((tag) => collectionTags.add(tag));
      });
      return selectedTags.every((tag) => collectionTags.has(tag));
    });
  }, [searchQuery, selectedTags]);

  const filteredMaps = useMemo(() => {
    if (!searchQuery) {
      return mapTemplates;
    }
    return mapTemplates.filter((map) =>
      `${map.title} ${map.description}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const renderTags = (tags: string[] = []) => (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-indigo-200/70"
        >
          {tagIcons[tag]}
          {tag}
        </span>
      ))}
    </div>
  );

  return (
    <aside className="pointer-events-none absolute left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
      <div
        className="pointer-events-auto flex max-h-[82vh] w-[320px] min-w-[300px] flex-col overflow-hidden rounded-3xl border border-white/12 bg-black/55 text-sm text-indigo-100/80 shadow-[0_24px_64px_rgba(6,3,24,0.45)] backdrop-blur-xl"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="border-b border-white/10 px-5 pb-4 pt-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-indigo-200/60">
            <span>Библиотека</span>
            <FolderKanban size={14} className="text-indigo-300" />
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-indigo-100/60">
            Готовые блоки ускоряют построение карты. Шаблоны можно редактировать после добавления.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <Search size={14} className="text-indigo-100/50" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder:text-indigo-100/40 focus:outline-none"
              placeholder="Поиск по названию или описанию"
            />
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] transition",
                    selectedTags.includes(tag)
                      ? "border-indigo-400/60 bg-indigo-500/20 text-white"
                      : "border-white/10 bg-white/5 text-indigo-100/60 hover:border-white/30 hover:text-white"
                  )}
                >
                  {tagIcons[tag]}
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 border-b border-white/10 px-5 py-3">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 rounded-2xl px-3 py-2 text-xs font-medium uppercase tracking-[0.25em] transition",
                activeTab === tab.id
                  ? "bg-indigo-500/20 text-white shadow-[0_6px_16px_rgba(76,29,149,0.35)]"
                  : "text-indigo-200/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="mr-2 inline-flex items-center justify-center rounded-full bg-white/5 p-1">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {activeTab === "templates" && (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onCreate(template)}
                  className={clsx(
                    "w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-indigo-400/60 hover:bg-indigo-500/15",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-white">{template.title}</span>
                        <p className="mt-1 text-xs text-indigo-100/60">{template.description}</p>
                      </div>
                      <span className="rounded-lg bg-indigo-500/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.15em] text-indigo-200">
                        {template.missionType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-indigo-100/50">
                      <span>XP {template.experienceReward}</span>
                      <span>Мана {template.manaReward}</span>
                      <span>Ранг {template.minRank}</span>
                    </div>
                    {renderTags(template.tags)}
                  </div>
                </button>
              ))}
              {filteredTemplates.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-4 text-xs text-indigo-100/50">
                  Шаблоны не найдены. Измените фильтры или сбросьте поиск.
                </p>
              )}
            </div>
          )}

          {activeTab === "collections" && (
            <div className="space-y-4">
              {filteredCollections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => onCreateCollection?.(collection)}
                  className={clsx(
                    "w-full rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-left transition hover:border-indigo-400/50 hover:bg-indigo-500/20",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-white">{collection.title}</span>
                        <p className="mt-1 text-xs text-indigo-100/60">{collection.description}</p>
                      </div>
                      <span className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.15ем] text-indigo-200">
                        {collection.items.length} мис.
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-indigo-100/60">
                      {collection.items.map((item) => {
                        const template = resolveTemplate(item.templateId);
                        if (!template) return null;
                        return (
                          <div key={item.templateId} className="flex items-center justify-between py-1">
                            <span>{template.title}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-200/70">
                              {template.missionType}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-indigo-200/70">
                      <span>{collection.recommendFor}</span>
                      <span>+{collection.items.length - 1} связей</span>
                    </div>
                  </div>
                </button>
              ))}
              {filteredCollections.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-4 text-xs text-indigo-100/50">
                  Коллекции не найдены. Измените фильтры или сбросьте поиск.
                </p>
              )}
            </div>
          )}

          {activeTab === "maps" && (
            <div className="space-y-4">
              {filteredMaps.map((map) => (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => onApplyMapTemplate?.(map.id)}
                  className={clsx(
                    "w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-indigo-400/60 hover:bg-indigo-500/15",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-white">{map.title}</span>
                        <p className="mt-1 text-xs text-indigo-100/60">{map.description}</p>
                      </div>
                      <span className="rounded-lg bg-indigo-500/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.15em] text-indigo-200">
                        {map.missions.length} узлов
                      </span>
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-indigo-100/60">
                      {map.missions.map((mission, index) => {
                        const template = resolveTemplate(mission.templateId);
                        return template ? template.title : `Node ${index + 1}`;
                      }).join(" → ")}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-indigo-200/70">
                      {map.recommendFor}
                    </div>
                  </div>
                </button>
              ))}
              {filteredMaps.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-4 text-xs text-indigo-100/50">
                  Шаблоны карт не найдены. Измените фильтры или сбросьте поиск.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

