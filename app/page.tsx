"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type CSSProperties, type MouseEvent } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Copy, Home, Leaf, LoaderCircle, Mail, Map as MapIcon, Moon, Pause, PenLine, Play, RotateCcw, Save, Settings2, Sparkles, Sun, Sunset, Users, Wrench, X } from "lucide-react";
import GardenScene from "@/components/GardenScene";
import GarageLoading from "@/components/GarageLoading";
import GarageShowroom from "@/components/GarageShowroom";
import { DEMO_HOME, type HomeConfig, type HomeData, type Postcard } from "@/lib/home-config";
import { homeSchema } from "@/lib/validation";

type ApiHome = HomeData & { authenticated: boolean; aiReady: boolean };
type ScenePlace = "entry" | "map" | "home" | "workshop" | "memories" | "terrace";
type ModalType = "story" | "edit" | "invite" | "postcards" | "signin" | null;
const navigationPlaces = [
  { id: "map", label: "地图", Icon: MapIcon }, { id: "home", label: "归处", Icon: Home },
  { id: "workshop", label: "工坊", Icon: Wrench }, { id: "memories", label: "展廊", Icon: BookOpen },
  { id: "terrace", label: "会客", Icon: Users },
] as const;
const placeCopy: Record<ScenePlace, { eyebrow: string; title: string; lines: [string, string]; footer: string }> = {
  entry: { eyebrow: "WELCOME TO YOUR PORSCHE HOME", title: "欢迎回家，热爱在里面。", lines: ["沿着车道，推开属于你的世界。", "庭院、爱车与朋友，都在等你。"], footer: "00 / THE GARDEN GATE" },
  map: { eyebrow: "YOUR WORLD, FOUR LITTLE PLACES", title: "沿着热爱，去走走。", lines: ["一座家，几处风景，还有远道而来的朋友。", "点击地标，沿着小径探索你的世界。"], footer: "00 / THE VALLEY MAP" },
  home: { eyebrow: "YOUR OWN LITTLE WORLD", title: "", lines: ["一台喜欢的车，一个自己的世界。", "为热爱留个位置，也为朋友留一盏灯。"], footer: "01 / THE COURTYARD HOME" },
  workshop: { eyebrow: "THE ENGINEERING ATELIER", title: "热爱，由细节组成。", lines: ["让每个组件，各就其位。", "拖动展开，走近熟悉轮廓里的另一面。"], footer: "02 / THE WORKSHOP" },
  memories: { eyebrow: "THE MEMORY PAVILION", title: "值得的时刻，留在这里。", lines: ["有些路，因为同行的人而难忘。", "在展亭里，读一段关于你与爱车的故事。"], footer: "03 / THE MEMORY PAVILION" },
  terrace: { eyebrow: "THE GUEST TERRACE", title: "风景正好，来坐坐吧。", lines: ["为朋友留一张椅子，也留一句想说的话。", "来过这里，就有一段共同的记忆。"], footer: "04 / THE GUEST TERRACE" },
};
const colors = [
  { label: "冰川银", value: "#b9c0ba" }, { label: "松林绿", value: "#556b58" },
  { label: "胭脂红", value: "#9d2927" }, { label: "暖砂白", value: "#e9e7dc" },
  { label: "曜石黑", value: "#252a29" }, { label: "海湾蓝", value: "#466b82" },
];
const partInfo: Record<string, { name: string; copy: string }> = {
  body: { name: "车身外壳", copy: "沿着流畅的车顶弧线，观察车身与座舱的组合。拖动滑杆，展开这一条熟悉的轮廓。" },
  glass: { name: "玻璃与座舱", copy: "挡风玻璃、侧窗与座舱共同勾勒驾驶者的视野。看看它们如何与车身组合。" },
  wheels: { name: "车轮组件", copy: "车轮从车身两侧展开，呈现轮圈、轮胎与底盘的位置关系。可在布置面板中切换轮圈颜色。" },
  chassis: { name: "底盘平台", copy: "底盘连接并承托各个主要组件。这里以简化分组展示整体结构，便于观察装配关系。" },
  powertrain: { name: "动力组件", copy: "后部动力组件以示意几何呈现，用于探索分组关系，不提供车型工程数据。" },
};
const partAliases: Record<string, string> = { "车身": "body", "车身外壳": "body", "玻璃": "glass", "座舱": "glass", "轮胎": "wheels", "车轮": "wheels", "底盘": "chassis", "发动机": "powertrain", "动力": "powertrain" };
const signature = (h: HomeData) => JSON.stringify([h.title, h.ownerName, h.story, h.config]);
const SIGNIN_DRAFT_KEY = "porsche-home:signin-draft:v1";
const SIGNIN_DRAFT_MAX_AGE = 30 * 60 * 1000;
function clearSigninDraft() { try { window.sessionStorage.removeItem(SIGNIN_DRAFT_KEY); } catch { /* Saved server data remains authoritative. */ } }
function restoreSigninDraft(serverHome: ApiHome, ownRoot: boolean): HomeData | null {
  if (!ownRoot || serverHome.id || !serverHome.isOwner) return null;
  try {
    const raw = window.sessionStorage.getItem(SIGNIN_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as { savedAt?: unknown; home?: unknown };
    const age = typeof draft.savedAt === "number" ? Date.now() - draft.savedAt : -1;
    const parsed = homeSchema.safeParse(draft.home);
    if (age < 0 || age > SIGNIN_DRAFT_MAX_AGE || !parsed.success || parsed.data.id) { clearSigninDraft(); return null; }
    return { ...serverHome, ...parsed.data, id: null };
  } catch { clearSigninDraft(); return null; }
}
async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, signal:options?.signal??AbortSignal.timeout(url.includes('/api/design')?45000:20000), headers: { "Content-Type": "application/json", ...options?.headers } }).catch(error=>{if(error?.name==='TimeoutError'||error?.name==='AbortError')throw new Error('连接超时，请稍后重试；当前布置仍保留在页面中。');throw error;});
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : "暂时没有完成，请稍后再试。");
  return data as T;
}
function Dialog({ title, eyebrow, children, onClose, className = "" }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusable = () => Array.from(node?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, textarea, select, [tabindex="0"]') || []);
    focusable()[0]?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const items = focusable(); const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handle);
    return () => { document.removeEventListener("keydown", handle); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
      <div className="modal-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div><button className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={19} /></button></div>
      {children}
    </div>
  </div>;
}

export default function PorscheHome() {
  const [home, setHome] = useState<HomeData>({ ...DEMO_HOME, config: { ...DEMO_HOME.config } });
  const [authenticated, setAuthenticated] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sceneReady, setSceneReady] = useState(false);
  const [entered,setEntered]=useState(false);
  const [loadingProgress,setLoadingProgress]=useState(0);
  const [loadingStage,setLoadingStage]=useState('正在打开你的私人世界');
  const [isVisit, setIsVisit] = useState(false);
  const [view, setView] = useState<ScenePlace>("entry");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<"space" | "car">("space");
  const [modal, setModal] = useState<ModalType>(null);
  const [prompt, setPrompt] = useState("");
  const [designing, setDesigning] = useState(false);
  const [designResult, setDesignResult] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "error">("saved");
  const [notice, setNotice] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [explode, setExplode] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [part, setPart] = useState("body");
  const [edit, setEdit] = useState({ title: "", ownerName: "", story: "" });
  const [postcard, setPostcard] = useState({ name: "", message: "", theme: "forest" });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const savedSignature = useRef(signature(DEMO_HOME));
  const latestHome = useRef(home);
  const savePromise = useRef<Promise<HomeData> | null>(null);
  const failedSignature = useRef<string | null>(null);
  const undoConfig = useRef<HomeConfig | null>(null);
  const readOnly = isVisit || !home.isOwner;
  const dirtySignature = signature(home);
  latestHome.current = home;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("visit") || params.get("home");
    setIsVisit(params.has("visit"));
    api<ApiHome>(`/api/home${id ? `?id=${encodeURIComponent(id)}` : ""}`)
      .then((data) => {
        if (cancelled) return;
        savedSignature.current = signature(data);
        const restored = restoreSigninDraft(data, !id && !params.has("visit") && window.location.pathname === "/");
        setHome(restored || data); setAuthenticated(Boolean(data.authenticated)); setAiReady(Boolean(data.aiReady));
        if (restored) { setSaveState("dirty"); setNotice("已恢复登录前的布置，点击保存就能留住这座家。"); }
      })
      .catch((error) => { if (!cancelled) setLoadError(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { if (!notice) return; const id = window.setTimeout(() => setNotice(""), 4500); return () => window.clearTimeout(id); }, [notice]);
  const closeModal = useCallback(() => { setModal(null); setPostError(""); }, []);
  const selectPlace = useCallback((place: ScenePlace) => {
    setView(place); setModal(null);
    if (place !== "home") setPanelOpen(false);
    if (place !== "workshop") { setPlaying(false); setExplode(0); }
  }, []);
  const showNotice = (message: string) => setNotice(message);
  const handoffSignin = (event: MouseEvent<HTMLAnchorElement>) => {
    if (readOnly || latestHome.current.id) return;
    const draft = homeSchema.safeParse({ ...latestHome.current, id: null });
    if (!draft.success) { event.preventDefault(); showNotice("请先检查家的名字与故事，再登录保存布置。"); return; }
    try { window.sessionStorage.setItem(SIGNIN_DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), home: draft.data })); }
    catch { event.preventDefault(); showNotice("浏览器无法暂存这次布置，请允许此站点使用会话存储后重试。"); }
  };
  const persist = useCallback(async (): Promise<HomeData> => {
    if (savePromise.current) return savePromise.current;
    if (!authenticated) { setModal("signin"); throw new Error("请先登录，再保存你的空间。"); }
    const draft = latestHome.current;
    if (readOnly) return draft;
    const draftSignature = signature(draft);
    setSaving(true);
    const task = api<ApiHome>("/api/home", { method: "POST", body: JSON.stringify({ id: draft.id, title: draft.title, ownerName: draft.ownerName, story: draft.story, config: draft.config }) })
      .then((data) => {
        savedSignature.current = draftSignature;
        clearSigninDraft();
        failedSignature.current = null;
        setHome((current) => ({ ...current, id: data.id, isOwner: data.isOwner, updatedAt: data.updatedAt, postcards: data.postcards || current.postcards }));
        setSaveState(signature(latestHome.current) === draftSignature ? "saved" : "dirty");
        return { ...draft, ...data };
      })
      .catch((error) => { failedSignature.current = draftSignature; setSaveState("error"); throw error; })
      .finally(() => { setSaving(false); savePromise.current = null; });
    savePromise.current = task;
    return task;
  }, [authenticated, readOnly]);
  useEffect(() => {
    if (loading || readOnly || saving) return;
    const dirty = dirtySignature !== savedSignature.current;
    if (!dirty) return;
    if (dirtySignature === failedSignature.current) return;
    setSaveState("dirty");
    if (!home.id || !authenticated) return;
    const timer = window.setTimeout(() => { persist().catch((error) => showNotice(error.message)); }, 1400);
    return () => window.clearTimeout(timer);
  }, [dirtySignature, home.id, loading, readOnly, authenticated, persist, saving]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0; let previous = 0; let value = explode;
    const tick = (now: number) => {
      if (previous) { value = Math.min(1, value + (now - previous) / 4500); setExplode(value); if (value === 1) { setPlaying(false); return; } }
      previous = now; frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing]);
  const changeConfig = <K extends keyof HomeConfig>(key: K, value: HomeConfig[K]) => {
    if (readOnly) return;
    setHome((current) => ({ ...current, config: { ...current.config, [key]: value } }));
  };
  const applyDesign = async () => {
    if (!prompt.trim() || designing || readOnly) return;
    setDesigning(true); setDesignResult("");
    try {
      const result = await api<{ config: HomeConfig; summary: string; mode: "ai" | "basic"; aiReady: boolean }>("/api/design", { method: "POST", body: JSON.stringify({ prompt: prompt.trim(), config: home.config }) });
      undoConfig.current = { ...home.config };
      setHome((current) => ({ ...current, config: result.config }));
      setAiReady(result.aiReady); setDesignResult(result.summary);
    } catch (error) { setDesignResult(error instanceof Error ? error.message : "布置暂时没有完成，请再试一次。"); }
    finally { setDesigning(false); }
  };
  const share = async () => {
    try {
      const data = readOnly && home.id ? home : await persist();
      if (!data.id) throw new Error("请先保存空间，再创建拜访链接。");
      setInviteUrl(`${window.location.origin}/?visit=${encodeURIComponent(data.id)}`); setCopied(false); setModal("invite");
    } catch (error) { showNotice(error instanceof Error ? error.message : "暂时无法生成链接。"); }
  };
  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); showNotice("拜访链接已复制。"); }
    catch { showNotice("请长按或选中链接，手动复制。"); }
  };
  const openEdit = () => { setEdit({ title: home.title, ownerName: home.ownerName, story: home.story }); setModal("edit"); };
  const sendPostcard = async () => {
    setPostError("");
    if (!home.id) { setPostError("这个空间还未保存。主人保存后，就可以收到明信片了。"); return; }
    if (!postcard.name.trim() || !postcard.message.trim()) { setPostError("请写上你的名字和想留下的话。"); return; }
    setPosting(true);
    try {
      const response = await api<{ postcard: Postcard }>("/api/postcards", { method: "POST", body: JSON.stringify({ homeId: home.id, name: postcard.name.trim(), message: postcard.message.trim(), theme: postcard.theme }) });
      setHome((current) => ({ ...current, postcards: [response.postcard, ...current.postcards] }));
      setPostcard((current) => ({ ...current, message: "" })); showNotice("明信片已送达，感谢你的来访。");
    } catch (error) { setPostError(error instanceof Error ? error.message : "明信片暂时未送达，请稍后重试。"); }
    finally { setPosting(false); }
  };
  const selectedPart = partInfo[part] || partInfo.body;
  const currentPlace = placeCopy[view];
  const introTitle = view === "home" ? home.title : currentPlace.title;
  const timeLabel = { day: "午后", sunset: "日落", night: "夜晚" }[home.config.time];
  if (loadError) return <main className="error-page"><div className="brand-wordmark">PORSCHE HOME</div><p className="eyebrow">A PLACE TO RETURN TO</p><h1>暂时没能走进这座家。</h1><p>{loadError}</p><a className="primary-button" href="/">返回我的庭院 <ArrowRight size={16} /></a></main>;
  return <main className={`home-app time-${home.config.time} is-${view}`}>
    <div className="world-interface" inert={!entered}>
    <div className="scene-stage" aria-label="可旋转和缩放的三维地图，包含庭院之家、工程工坊、记忆展亭和来客露台"><GardenScene config={home.config} view={view} explode={explode} active={entered&&modal!=='signin'} onReady={() => setSceneReady(true)} onPartSelect={(value) => setPart(partAliases[value] || value)} onPlaceSelect={selectPlace} onLoadingProgress={(value,stage)=>{setLoadingProgress(value);setLoadingStage(stage);}} /></div>
    <div className="scene-vignette" aria-hidden="true" />
    <header className="site-header">
      <a className="brand" href="/" aria-label="保时捷之家首页"><span className="brand-wordmark">PORSCHE HOME<span className="brand-dot">.</span></span><span className="brand-caption">保时捷之家 <i /> 车主会客厅 · 概念体验</span></a>
      <div className="header-actions"><span className="save-status" role="status">{saving ? <><LoaderCircle size={12} className="spin" /> 保存中</> : readOnly ? <><span className="status-dot" /> 正在做客</> : home.id && saveState === "saved" ? <><Check size={12} /> 已保存</> : saveState === "error" ? "保存失败" : home.id ? "有未保存更改" : "尚未保存"}</span>{!readOnly && <button className="quiet-button save-button" onClick={() => persist().then(() => showNotice("你的家已保存。")).catch((error) => showNotice(error.message))} disabled={saving || loading}><Save size={15} /><span>保存</span></button>}<button className="invite-button" onClick={share} disabled={loading || saving}><span>{readOnly ? "分享这座家" : "邀请朋友"}</span><ArrowUpRight size={16} /></button></div>
    </header>
    <section className="scene-intro" aria-label="空间介绍">
      <p className="eyebrow"><span className="tiny-line" />{currentPlace.eyebrow}</p>
      <h1>{introTitle.includes("，") ? introTitle.split("，").map((line, index) => <span key={index}>{line}{index === 0 ? "，" : ""}</span>) : introTitle}</h1>
      <p className="intro-copy">{currentPlace.lines[0]}<br />{currentPlace.lines[1]}</p>
      <button className="story-link" onClick={() => { if (view === "map"||view==='entry') selectPlace("home"); else setModal(view === "terrace" ? "postcards" : "story"); }}><span>{view === "entry"?'走进庭院':view === "map" ? "先去家里看看" : view === "workshop" ? "关于这间工坊" : view === "terrace" ? "写张明信片" : `${home.ownerName}的故事`}</span><ArrowRight size={16} /></button>
      <div className="place-note"><span className="status-dot" /> {timeLabel} · {home.config.weather === "rain" ? "细雨正好" : "天气正好"}<span className="note-divider">/</span><span>{readOnly ? "欢迎来做客" : "此刻，属于你"}</span></div>
    </section>
    {view === "home" && !panelOpen && !readOnly && <div className="design-invitation"><span className="small-orbit"><Sparkles size={18} strokeWidth={1.5} /></span><div><p>理想的家，从一句话开始。</p><span>{aiReady ? "让 AI 为你的热爱布置一个空间" : "选择风格，或用简单指令布置"}</span></div><button className="round-button" aria-label="打开空间布置面板" onClick={() => setPanelOpen(true)}><ArrowUpRight size={19} /></button></div>}
    {view === "memories" && <aside className="station-card memory-station-card" aria-label="记忆展亭里的故事"><p className="eyebrow"><BookOpen size={13} /> A STORY KEPT CLOSE</p><h2>{home.ownerName}与爱车的故事</h2><p className="station-story">{home.story.length > 145 ? `${home.story.slice(0, 145)}…` : home.story || "给这一段热爱，写一个属于自己的开头。"}</p><div className="station-card-actions"><button className="text-button" onClick={() => setModal("story")}>读完整的故事 <ArrowRight size={14} /></button>{!readOnly && <button className="icon-button" aria-label="编辑展亭中的故事" onClick={openEdit}><PenLine size={15} /></button>}</div></aside>}
    {view === "terrace" && <aside className="station-card terrace-station-card" aria-label="来客露台与明信片"><p className="eyebrow"><Mail size={13} /> ALWAYS ROOM FOR A FRIEND</p><h2>留一句话，留一段回忆。</h2><p className="station-story">{home.postcards.length ? `这里已收到 ${home.postcards.length} 张明信片。每一次来访，都让这座家多一点温度。` : "第一张明信片，还在路上。选一张喜欢的信纸，把这一刻留给朋友。"}</p><button className="primary-button" onClick={() => setModal("postcards")}><Mail size={14} /> 写张明信片 <ArrowUpRight size={14} /></button><button className="text-button terrace-invite" onClick={share}>{readOnly ? "分享这处风景" : "邀请朋友来坐坐"}<ArrowUpRight size={13} /></button></aside>}
    {panelOpen && !readOnly && <aside className="design-panel" aria-label="空间布置面板">
      <div className="panel-heading"><div><p className="eyebrow">MAKE IT YOURS</p><h2>布置我的家</h2></div><button className="icon-button" aria-label="收起布置面板" onClick={() => setPanelOpen(false)}><X size={17} /></button></div>
      <div className="panel-tabs" role="tablist" aria-label="布置分类"><button role="tab" aria-selected={panelTab === "space"} className={panelTab === "space" ? "active" : ""} onClick={() => setPanelTab("space")}><Home size={14} /> 空间与氛围</button><button role="tab" aria-selected={panelTab === "car"} className={panelTab === "car" ? "active" : ""} onClick={() => setPanelTab("car")}><Wrench size={14} /> 我的 911</button></div>
      <div className="panel-scroll">
        {panelTab === "space" ? <>
          <fieldset className="option-group"><legend>建筑风格</legend><div className="architecture-options">{([{ value: "courtyard", title: "庭院之家", note: "石材 · 木色" }, { value: "pavilion", title: "玻璃会客厅", note: "通透 · 极简" }, { value: "alpine", title: "山间小屋", note: "温暖 · 自然" }] as const).map((option) => <button key={option.value} aria-pressed={home.config.architecture === option.value} className={`architecture-option ${home.config.architecture === option.value ? "selected" : ""}`} onClick={() => changeConfig("architecture", option.value)}><span className={`architecture-sketch ${option.value}`} aria-hidden="true"><i /><b /></span><span>{option.title}</span><small>{option.note}</small></button>)}</div></fieldset>
          <fieldset className="option-group"><legend>庭院植物</legend><div className="segmented-options">{([{ value: "olive", label: "橄榄树" }, { value: "pine", label: "松林" }, { value: "cypress", label: "柏树" }] as const).map((option) => <button key={option.value} aria-pressed={home.config.plants === option.value} className={home.config.plants === option.value ? "selected" : ""} onClick={() => changeConfig("plants", option.value)}><Leaf size={12} />{option.label}</button>)}</div></fieldset>
          <fieldset className="option-group"><legend>光线与天气</legend><div className="time-options">{([{ value: "day", label: "午后", Icon: Sun }, { value: "sunset", label: "日落", Icon: Sunset }, { value: "night", label: "夜晚", Icon: Moon }] as const).map(({ value, label, Icon }) => <button key={value} aria-pressed={home.config.time === value} className={home.config.time === value ? "selected" : ""} onClick={() => changeConfig("time", value)}><Icon size={17} strokeWidth={1.5} />{label}</button>)}</div><label className="weather-toggle"><span>给庭院下一场小雨</span><input type="checkbox" checked={home.config.weather === "rain"} onChange={(event) => changeConfig("weather", event.target.checked ? "rain" : "clear")} /><span className="toggle-track" aria-hidden="true" /></label></fieldset>
        </> : <>
          <div className="car-model-label"><span className="car-line-art" aria-hidden="true">911</span><div><strong>一条熟悉的弧线。</strong><p>Carrera 4S · 为热爱选一种心情。</p></div></div>
          <fieldset className="option-group"><legend>车身颜色 <span>{colors.find((color) => color.value.toLowerCase() === home.config.carColor.toLowerCase())?.label || "专属色彩"}</span></legend><div className="color-options">{colors.map((color) => <button key={color.value} title={color.label} aria-label={color.label} aria-pressed={home.config.carColor === color.value} className={`color-swatch ${home.config.carColor === color.value ? "selected" : ""}`} style={{ "--swatch": color.value } as CSSProperties} onClick={() => changeConfig("carColor", color.value)}>{home.config.carColor === color.value && <Check size={15} />}</button>)}</div></fieldset>
          <fieldset className="option-group"><legend>轮圈饰面</legend><div className="segmented-options">{([{ value: "silver", label: "经典银色" }, { value: "black", label: "缎面黑色" }] as const).map((option) => <button key={option.value} aria-pressed={home.config.wheels === option.value} className={home.config.wheels === option.value ? "selected" : ""} onClick={() => changeConfig("wheels", option.value)}>{option.label}</button>)}</div></fieldset>
          <a className="model-disclosure" href="/models/attribution.txt" target="_blank" rel="noreferrer">车型模型：Lionsharp Studios · CC BY-SA 4.0 <ArrowUpRight size={10} /></a>
        </>}
        <div className="composer"><div className="composer-label"><Sparkles size={14} /><span>{aiReady ? "AI 空间设计师" : "一句话布置"}</span><span className={`model-state ${aiReady ? "connected" : ""}`}>{aiReady ? "已连接" : "基础模式"}</span></div><textarea aria-label="描述你理想中的空间" placeholder="例如：雨夜的松林，暖光车库，松林绿的车身……" value={prompt} maxLength={500} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) applyDesign(); }} /><div className="prompt-suggestions"><button onClick={() => setPrompt("日落、橄榄树、暖砂白车身")}>日落时分</button><button onClick={() => setPrompt("雨夜、松树、黑色轮圈")}>雨夜松林</button></div><button className="primary-button design-submit" onClick={applyDesign} disabled={designing || !prompt.trim()}>{designing ? <LoaderCircle size={15} className="spin" /> : <Sparkles size={15} />}<span>{designing ? "正在布置…" : "让想象发生"}</span><ArrowRight size={15} /></button><p className="model-hint">{aiReady ? "AI 将调整可用的建筑、植物、天气和配色。" : "大模型待连接；当前按支持的风格关键词布置。"}</p></div>
        {designResult && <div className="design-result" role="status"><p>{designResult}</p>{undoConfig.current && <button onClick={() => { const config = undoConfig.current; if (config) setHome((current) => ({ ...current, config })); undoConfig.current = null; setDesignResult("已恢复上一次布置。"); }}><RotateCcw size={12} /> 撤销这次布置</button>}</div>}
      </div><button className="panel-story-button" onClick={openEdit}><PenLine size={13} /> 编辑家的名字与故事 <ArrowUpRight size={14} /></button>
    </aside>}
    {view === "workshop" && <section className="workshop-controls" aria-label="车辆拆解控制">
      <div className="workshop-control-heading"><div><p className="eyebrow">EXPLORE THE DETAILS</p><h2>从整体，到每一个细节。</h2></div><span className="explode-value">{Math.round(explode * 100)}<small>%</small></span></div>
      <div className="explode-slider-row"><button className="icon-button" aria-label={playing ? "暂停拆解动画" : "播放拆解动画"} onClick={() => { if (explode === 1) setExplode(0); setPlaying(!playing); }}>{playing ? <Pause size={17} /> : <Play size={17} />}</button><input aria-label="车辆拆解进度" type="range" min="0" max="100" value={explode * 100} style={{ "--range-progress": `${explode * 100}%` } as CSSProperties} onChange={(event) => { setPlaying(false); setExplode(Number(event.target.value) / 100); }} /><button className="icon-button" aria-label="复原车辆" onClick={() => { setPlaying(false); setExplode(0); }}><RotateCcw size={17} /></button></div>
      <div className="slider-captions"><span>完整轮廓</span><span>分组展开</span></div>
      <div className="part-buttons" aria-label="组件介绍">{Object.entries(partInfo).map(([key, info]) => <button key={key} className={part === key ? "selected" : ""} onClick={() => setPart(key)}>{info.name}</button>)}</div><p className="part-description"><strong>{selectedPart.name}</strong>{selectedPart.copy}</p><p className="workshop-disclosure">911 Carrera 4S · 外观分组拆解，动力总成为示意</p>
    </section>}
    <footer className="scene-footer"><span className="scene-number">{currentPlace.footer}</span><span className="scene-help">拖动旋转 <i /> 滚动缩放</span></footer>
    <nav className="bottom-nav valley-nav" aria-label="空间导航">{navigationPlaces.map(({ id, label, Icon }) => <button key={id} className={view === id||(view==='entry'&&id==='map') ? "active" : ""} aria-current={view === id||(view==='entry'&&id==='map') ? "location" : undefined} onClick={() => selectPlace(id)}><Icon size={17} strokeWidth={1.6} /><span>{label}</span>{id === "terrace" && home.postcards.length > 0 && <span className="postcard-count">{home.postcards.length}</span>}</button>)}</nav>
    {!readOnly && <button className={`customize-button ${panelOpen ? "is-open" : ""}`} onClick={() => { if (!panelOpen) selectPlace("home"); setPanelOpen(!panelOpen); }} aria-expanded={panelOpen} aria-label="布置空间"><Settings2 size={16} /><span>{panelOpen ? "收起布置" : "布置空间"}</span><ChevronDown size={13} /></button>}
    {readOnly && <a className="customize-button" href="/"><Home size={15} /><span>回到我的家</span><ArrowUpRight size={14} /></a>}
    </div>
    <GarageLoading visible={loading || !sceneReady} progress={loadingProgress} stage={loadingStage} onEnter={()=>setEntered(true)}/>
    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="关闭提示" onClick={() => setNotice("")}><X size={14} /></button></div>}
    {modal === "story" && <Dialog title={view !== "workshop" ? home.title : "走近热爱的每一个细节"} eyebrow={view !== "workshop" ? "A STORY WORTH SHARING" : "INSIDE THE WORKSHOP"} onClose={closeModal} className="story-modal"><div className="story-rule" /><p className="story-owner">{view !== "workshop" ? `${home.ownerName} · 关于这座家` : "概念工坊 · 车辆结构探索"}</p><p className="story-body">{view !== "workshop" ? home.story : "在工坊里，你可以展开、旋转并复原车辆的主要组件，探索外壳、座舱、车轮、底盘与动力组件之间的位置关系。当前拆解为可视化分组演示，内部组件经过简化，不作为维修或工程资料。"}</p>{!readOnly && view !== "workshop" && <button className="text-button" onClick={openEdit}><PenLine size={14} /> 写下我的故事</button>}<p className="story-signoff">A home for your passion.</p></Dialog>}
    {modal === "edit" && <Dialog title="让这座家，更像你。" eyebrow="YOUR HOME, YOUR STORY" onClose={closeModal}><form className="edit-form" onSubmit={(event) => { event.preventDefault(); setHome((current) => ({ ...current, title: edit.title.trim(), ownerName: edit.ownerName.trim(), story: edit.story.trim() })); setModal(null); showNotice("故事已更新，记得保存你的家。"); }}><label>家的名字<input value={edit.title} maxLength={50} required onChange={(event) => setEdit({ ...edit, title: event.target.value })} /></label><label>怎么称呼你<input value={edit.ownerName} maxLength={30} required onChange={(event) => setEdit({ ...edit, ownerName: event.target.value })} /></label><label>我与爱车的故事<textarea value={edit.story} maxLength={800} required rows={5} onChange={(event) => setEdit({ ...edit, story: event.target.value })} /><span className="field-count">{edit.story.length}/800</span></label><button className="primary-button" type="submit">把故事放进家里 <ArrowRight size={15} /></button></form></Dialog>}
    {modal === "signin" && <Dialog title="你的车库，正在等你。" eyebrow="YOUR PERSONAL PORSCHE WORLD" onClose={closeModal} className="signin-modal"><GarageShowroom compact/><div className="signin-modal-copy"><p className="modal-copy">登录，收藏你的 911 与专属空间。<br/>让每一次归来，都有自己的故事。</p><a className="primary-button signin-continue" href="/signin-with-chatgpt?return_to=%2F" target="_top" onClick={handoffSignin}>使用 ChatGPT 登录 <ArrowUpRight size={17} /></a><p className="signin-benefits">保存专属布置 <span/> 邀请朋友来访 <span/> 收藏旅途来信</p></div></Dialog>}
    {modal === "invite" && <Dialog title="好风景，想与你分享。" eyebrow="YOU ARE ALWAYS WELCOME" onClose={closeModal}><div className="invitation-illustration" aria-hidden="true"><Home size={34} strokeWidth={1} /><span>COME ON OVER</span><div className="invitation-stamp">HOME<br />911</div></div><p className="modal-copy">邀请朋友走进「{home.title}」，看看你的车，读一段故事，留下一张明信片。</p><label className="invite-link-label">专属拜访链接<div className="invite-link-row"><input aria-label="专属拜访链接" readOnly value={inviteUrl} onFocus={(event) => event.target.select()} /><button aria-label="复制拜访链接" onClick={copyInvite}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div></label><div className="invite-dialog-actions"><button className="primary-button" onClick={copyInvite}>{copied ? "链接已复制" : "复制邀请链接"}{copied ? <Check size={15} /> : <ArrowRight size={15} />}</button><a className="text-button" href={inviteUrl} target="_blank" rel="noreferrer">以访客身份打开 <ArrowUpRight size={14} /></a></div><p className="fine-print">拜访链接受站点访问权限限制，仅已获权限的朋友可打开。</p></Dialog>}
    {modal === "postcards" && <Dialog title={readOnly ? "把这一刻，留在这里。" : "远方来信，近在眼前。"} eyebrow="POSTCARDS FROM FRIENDS" onClose={closeModal} className="postcards-modal"><div className="postcards-layout"><section className="postcard-compose"><div className={`postcard-preview theme-${postcard.theme}`}><span className="postcard-kicker">A LITTLE NOTE, A LASTING MEMORY</span><div className="postcard-stamp">P<span>HOME</span></div><label className="sr-only" htmlFor="postcard-message">明信片内容</label><textarea id="postcard-message" placeholder="来过这里，想对你说……" value={postcard.message} maxLength={300} onChange={(event) => setPostcard({ ...postcard, message: event.target.value })} /><div className="postcard-from"><span>FROM</span><label className="sr-only" htmlFor="postcard-name">你的名字</label><input id="postcard-name" placeholder="你的名字" maxLength={30} value={postcard.name} onChange={(event) => setPostcard({ ...postcard, name: event.target.value })} /></div><span className="postcard-address">TO · {home.ownerName}的家</span></div><fieldset className="postcard-themes"><legend>选一张喜欢的信纸</legend>{[{ value: "forest", label: "森林绿" }, { value: "sand", label: "暖砂色" }, { value: "sunset", label: "夕阳粉" }].map((theme) => <button key={theme.value} aria-label={theme.label} title={theme.label} aria-pressed={postcard.theme === theme.value} className={`theme-dot theme-${theme.value} ${postcard.theme === theme.value ? "selected" : ""}`} onClick={() => setPostcard({ ...postcard, theme: theme.value })}>{postcard.theme === theme.value && <Check size={12} />}</button>)}</fieldset>{postError && <p className="form-error" role="alert">{postError}</p>}<button className="primary-button" onClick={sendPostcard} disabled={posting || !postcard.name.trim() || !postcard.message.trim()}>{posting ? <LoaderCircle size={15} className="spin" /> : <Mail size={15} />} {posting ? "正在投递…" : "寄出这张明信片"} <ArrowUpRight size={15} /></button>{!home.id && <p className="fine-print">空间保存后，即可收发明信片。</p>}</section><section className="postcard-inbox" aria-label="收到的明信片"><div className="inbox-title"><span>留在这里的心意</span><span>{home.postcards.length.toString().padStart(2, "0")}</span></div>{home.postcards.length === 0 ? <div className="empty-postcards"><Mail size={30} strokeWidth={1} /><p>第一封来信，还在路上。</p><span>邀请一个朋友，<br />让这里开始有共同的回忆。</span></div> : home.postcards.map((card) => <article key={card.id} className={`received-postcard theme-${["forest", "sand", "sunset"].includes(card.theme) ? card.theme : "forest"}`}><p>{card.message}</p><div><span>— {card.name}</span><time dateTime={new Date(card.createdAt).toISOString()}>{new Date(card.createdAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", timeZone: "Asia/Shanghai" })}</time></div></article>)}</section></div></Dialog>}
  </main>;
}






