"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Image as ImageIcon, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { usePermissions } from "@/hooks/usePermissions";

const tabs = [
  ["seo", "SEO"], ["hero", "Hero"], ["stats", "Stats"], ["trust", "Trust Bar"],
  ["approach", "Approach"], ["services", "Services"], ["documents", "Documents"],
  ["global", "Global"], ["features", "Why Us"], ["leadership", "Leadership"],
  ["who", "Who We Help"], ["process", "Process"], ["insights", "Insights"],
  ["cta", "Call to Action"], ["faq", "FAQ"], ["contact", "Contact"],
];

const blankItems = {
  stats: { value: "0+", label: "New statistic", color: "g" },
  trust: { icon: "bi-check-circle", label: "New trust item" },
  approach: { label: "New stage", word: "Clarity" },
  services: { icon: "bi-star", title: "New service", text: "Describe this service.", color: "green" },
  features: { icon: "bi-check-circle", title: "New feature", text: "Describe this feature.", color: "green" },
  documents: { icon: "bi-folder", title: "New document group", list: ["Required document"], color: "green" },
  global: { title: "New advisory area", text: "Describe this advisory area." },
  leadership: { title: "Leader name", role: "Role", href: "/our-leadership-team", image: "", text: "Short leadership bio." },
  who: { num: "01", title: "New audience", text: "Describe who this section helps." },
  process: { number: "01", title: "New step", text: "Describe this step.", color: "green" },
  insights: { title: "New insight", tag: "Insight", href: "" },
  faq: { question: "New question", answer: "Add the answer here." },
  contact: { icon: "bi-check-circle", title: "New benefit", text: "Describe this benefit.", color: "green" },
};

const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100";
const labelClass = "mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400";

export default function HomePageSettingsForm() {
  const router = useRouter();
  const { hasPermission, isLoading } = usePermissions();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("hero");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const canView = hasPermission("settings", "view");
  const canEdit = hasPermission("settings", "edit");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/home-page");
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || result.error || "Unable to load settings");
      setData(result.data);
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  useEffect(() => { if (!isLoading && canView) Promise.resolve().then(load); }, [canView, isLoading, load]);
  useEffect(() => { if (!isLoading && !canView) router.replace("/admin"); }, [canView, isLoading, router]);

  const setSection = (section, key, value) => setData((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));
  const setNested = (section, parent, key, value) => setData((current) => ({
    ...current, [section]: { ...current[section], [parent]: { ...current[section][parent], [key]: value } },
  }));
  const updateItem = (section, index, key, value) => setData((current) => ({
    ...current,
    [section]: { ...current[section], items: current[section].items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) },
  }));
  const addItem = (section) => setData((current) => ({
    ...current, [section]: { ...current[section], items: [...current[section].items, { ...blankItems[section] }] },
  }));
  const removeItem = (section, index) => setData((current) => ({
    ...current, [section]: { ...current[section], items: current[section].items.filter((_, itemIndex) => itemIndex !== index) },
  }));
  const moveItem = (section, index, direction) => setData((current) => {
    const items = [...current[section].items];
    const destination = index + direction;
    if (destination < 0 || destination >= items.length) return current;
    [items[index], items[destination]] = [items[destination], items[index]];
    return { ...current, [section]: { ...current[section], items } };
  });

  const uploadImage = async (event, section, field) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    setUploading(`${section}.${field}`);
    try {
      const image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Upload failed");
      setSection(section, field, result.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading("");
      event.target.value = "";
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/home-page", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: data }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || result.error || "Unable to save settings");
      setData(result.data);
      toast.success("Home page updated");
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !data) return <div className="flex min-h-[420px] items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-violet-600" /></div>;

  return <form onSubmit={save} className="mx-auto max-w-7xl space-y-6 pb-20">
    <div className="sticky top-0 z-30 -mx-4 flex flex-col gap-4 border-b border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-800">Home Page Settings</h1><p className="mt-1 text-sm text-slate-500">Manage every visible section of the public home page.</p></div>
      <div className="flex gap-2">
        <a href="/" target="_blank" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Preview <ExternalLink className="h-4 w-4" /></a>
        <button type="submit" disabled={saving || !canEdit} className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-violet-700 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>

    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
      {tabs.map(([key, label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === key ? "bg-violet-600 text-white shadow" : "text-slate-500 hover:bg-slate-100"}`}>{label}</button>)}
    </div>

    {activeTab === "seo" && <Panel title="Search engine settings" description="Homepage title and search result content."><div className="grid gap-5 md:grid-cols-2">
      <Field label="Page title"><input className={inputClass} value={data.seo.title} onChange={(event) => setSection("seo", "title", event.target.value)} /></Field>
      <Field label="Keywords"><input className={inputClass} value={data.seo.keywords} onChange={(event) => setSection("seo", "keywords", event.target.value)} /></Field>
      <Field label="Meta description" wide><textarea rows={4} className={inputClass} value={data.seo.description} onChange={(event) => setSection("seo", "description", event.target.value)} /></Field>
    </div></Panel>}

    {activeTab === "hero" && <SectionPanel section="hero" data={data} setSection={setSection} title="Hero section">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Badge"><input className={inputClass} value={data.hero.badge} onChange={(event) => setSection("hero", "badge", event.target.value)} /></Field>
        <Field label="Badge icon"><input className={inputClass} value={data.hero.badgeIcon} onChange={(event) => setSection("hero", "badgeIcon", event.target.value)} /></Field>
        <Field label="Main title" wide><input className={inputClass} value={data.hero.title} onChange={(event) => setSection("hero", "title", event.target.value)} /></Field>
        <Field label="Description" wide><textarea rows={3} className={inputClass} value={data.hero.description} onChange={(event) => setSection("hero", "description", event.target.value)} /></Field>
        <Field label="Animated phrases (one per line)" wide><textarea rows={6} className={inputClass} value={data.hero.words.join("\n")} onChange={(event) => setSection("hero", "words", event.target.value.split("\n"))} /></Field>
        <ButtonFields title="Primary button" value={data.hero.primaryButton} onChange={(key, value) => setNested("hero", "primaryButton", key, value)} />
        <ButtonFields title="Secondary button" value={data.hero.secondaryButton} onChange={(key, value) => setNested("hero", "secondaryButton", key, value)} />
        <ImageField section="hero" label="Hero background image" value={data.hero.backgroundImage} setSection={setSection} uploadImage={uploadImage} uploading={uploading} />
      </div>
    </SectionPanel>}

    {activeTab === "cta" && <SectionPanel section="cta" data={data} setSection={setSection} title="Complex case call to action">
      <IntroFields section="cta" data={data} setSection={setSection} />
      <div className="mt-5 grid gap-5 md:grid-cols-2"><ButtonFields title="Primary button" value={data.cta.primaryButton} onChange={(key, value) => setNested("cta", "primaryButton", key, value)} /><ButtonFields title="Secondary button" value={data.cta.secondaryButton} onChange={(key, value) => setNested("cta", "secondaryButton", key, value)} />
        <ImageField section="cta" label="CTA background image" value={data.cta.backgroundImage} setSection={setSection} uploadImage={uploadImage} uploading={uploading} />
      </div>
    </SectionPanel>}

    {activeTab === "contact" && <SectionPanel section="contact" data={data} setSection={setSection} title="Contact section">
      <IntroFields section="contact" data={data} setSection={setSection} />
      <div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="Side panel title"><input className={inputClass} value={data.contact.panelTitle} onChange={(event) => setSection("contact", "panelTitle", event.target.value)} /></Field><Field label="Side panel description"><textarea rows={3} className={inputClass} value={data.contact.panelDescription} onChange={(event) => setSection("contact", "panelDescription", event.target.value)} /></Field></div>
      <div className="mt-6"><h3 className="mb-4 text-sm font-bold text-slate-800">Enquiry form text</h3><div className="grid gap-4 md:grid-cols-2">
        {[["fullNameLabel", "Full name label"], ["fullNamePlaceholder", "Full name placeholder"], ["emailLabel", "Email label"], ["emailPlaceholder", "Email placeholder"], ["phoneLabel", "Phone label"], ["phonePlaceholder", "Phone placeholder"], ["commentLabel", "Comment label"], ["commentPlaceholder", "Comment placeholder"], ["buttonLabel", "Submit button label"]].map(([key, label]) => <Simple key={key} label={label} value={data.contact.form[key]} onChange={(value) => setNested("contact", "form", key, value)} />)}
      </div></div>
      <ItemsEditor section="contact" data={data} updateItem={updateItem} addItem={addItem} removeItem={removeItem} moveItem={moveItem} />
    </SectionPanel>}

    {activeTab === "documents" && <SectionPanel section="documents" data={data} setSection={setSection} title="Documents section">
      <IntroFields section="documents" data={data} setSection={setSection} />
      <div className="mt-5"><ButtonFields title="Section button" value={data.documents.button} onChange={(key, value) => setNested("documents", "button", key, value)} /></div>
      <ItemsEditor section="documents" data={data} updateItem={updateItem} addItem={addItem} removeItem={removeItem} moveItem={moveItem} />
    </SectionPanel>}

    {["stats", "trust", "approach", "services", "global", "features", "leadership", "who", "process", "insights", "faq"].includes(activeTab) && <SectionPanel section={activeTab} data={data} setSection={setSection} title={`${tabs.find(([key]) => key === activeTab)?.[1]} section`}>
      {["approach", "services", "global", "features", "leadership", "who", "process", "insights", "faq"].includes(activeTab) && <IntroFields section={activeTab} data={data} setSection={setSection} />}
      <ItemsEditor section={activeTab} data={data} updateItem={updateItem} addItem={addItem} removeItem={removeItem} moveItem={moveItem} />
    </SectionPanel>}
  </form>;
}

function Panel({ title, description, children }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4"><h2 className="font-bold text-slate-800">{title}</h2>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</div><div className="p-6">{children}</div></section>;
}

function SectionPanel({ section, data, setSection, title, children }) {
  return <Panel title={title}><div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"><div><p className="text-sm font-bold text-slate-700">Show this section</p><p className="text-xs text-slate-500">Turn it off to hide it without deleting its content.</p></div><input type="checkbox" className="h-5 w-5 accent-violet-600" checked={Boolean(data[section].enabled)} onChange={(event) => setSection(section, "enabled", event.target.checked)} /></div>{children}</Panel>;
}

function IntroFields({ section, data, setSection }) {
  const value = data[section];
  return <div className="grid gap-5 md:grid-cols-2">
    <Field label="Eyebrow"><input className={inputClass} value={value.eyebrow || ""} onChange={(event) => setSection(section, "eyebrow", event.target.value)} /></Field>
    <Field label="Eyebrow icon"><input className={inputClass} value={value.eyebrowIcon || ""} onChange={(event) => setSection(section, "eyebrowIcon", event.target.value)} /></Field>
    <Field label="Heading"><input className={inputClass} value={value.title || ""} onChange={(event) => setSection(section, "title", event.target.value)} /></Field>
    <Field label="Highlighted heading"><input className={inputClass} value={value.highlight || ""} onChange={(event) => setSection(section, "highlight", event.target.value)} /></Field>
    <Field label="Description" wide><textarea rows={3} className={inputClass} value={value.description || ""} onChange={(event) => setSection(section, "description", event.target.value)} /></Field>
  </div>;
}

function ItemsEditor({ section, data, updateItem, addItem, removeItem, moveItem }) {
  const items = data[section].items;
  return <div className="mt-7 space-y-4"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-800">Items</h3><p className="text-xs text-slate-500">Edit, reorder, add, or remove cards.</p></div><button type="button" onClick={() => addItem(section)} className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100"><Plus className="h-4 w-4" /> Add item</button></div>
    {items.map((item, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"><div className="mb-4 flex items-center justify-between"><span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm">Item {index + 1}</span><div className="flex gap-1"><IconButton label="Move up" disabled={index === 0} onClick={() => moveItem(section, index, -1)}><ArrowUp /></IconButton><IconButton label="Move down" disabled={index === items.length - 1} onClick={() => moveItem(section, index, 1)}><ArrowDown /></IconButton><IconButton label="Delete" danger onClick={() => removeItem(section, index)}><Trash2 /></IconButton></div></div>
      <ItemFields section={section} item={item} onChange={(key, value) => updateItem(section, index, key, value)} />
    </div>)}
    {!items.length && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">No items. Add one to show content here.</div>}
  </div>;
}

function ItemFields({ section, item, onChange }) {
  if (section === "stats") return <div className="grid gap-4 md:grid-cols-3"><Simple label="Value" value={item.value} onChange={(value) => onChange("value", value)} /><Simple label="Label" value={item.label} onChange={(value) => onChange("label", value)} /><ColorSelect value={item.color} onChange={(value) => onChange("color", value)} stat /></div>;
  if (section === "trust") return <div className="grid gap-4 md:grid-cols-2"><Simple label="Icon class" value={item.icon} onChange={(value) => onChange("icon", value)} /><Simple label="Label" value={item.label} onChange={(value) => onChange("label", value)} /></div>;
  if (section === "approach") return <div className="grid gap-4 md:grid-cols-2"><Simple label="Small label" value={item.label} onChange={(value) => onChange("label", value)} /><Simple label="Large word" value={item.word} onChange={(value) => onChange("word", value)} /></div>;
  if (section === "global") return <div className="grid gap-4 md:grid-cols-2"><Simple label="Title" value={item.title} onChange={(value) => onChange("title", value)} /><Text label="Description" value={item.text} onChange={(value) => onChange("text", value)} /></div>;
  if (section === "leadership") return <div className="grid gap-4 md:grid-cols-2"><Simple label="Name" value={item.title} onChange={(value) => onChange("title", value)} /><Simple label="Role" value={item.role} onChange={(value) => onChange("role", value)} /><Simple label="Profile link" value={item.href} onChange={(value) => onChange("href", value)} /><Simple label="Image URL" value={item.image} onChange={(value) => onChange("image", value)} /><Text label="Short bio" value={item.text} onChange={(value) => onChange("text", value)} /></div>;
  if (section === "who") return <div className="grid gap-4 md:grid-cols-2"><Simple label="Number" value={item.num} onChange={(value) => onChange("num", value)} /><Simple label="Title" value={item.title} onChange={(value) => onChange("title", value)} /><Text label="Description" value={item.text} onChange={(value) => onChange("text", value)} /></div>;
  if (section === "insights") return <div className="grid gap-4 md:grid-cols-3"><Simple label="Title" value={item.title} onChange={(value) => onChange("title", value)} /><Simple label="Tag" value={item.tag} onChange={(value) => onChange("tag", value)} /><Simple label="Link" value={item.href} onChange={(value) => onChange("href", value)} /></div>;
  if (section === "faq") return <div className="grid gap-4"><Simple label="Question" value={item.question} onChange={(value) => onChange("question", value)} /><Field label="Answer"><textarea rows={3} className={inputClass} value={item.answer} onChange={(event) => onChange("answer", event.target.value)} /></Field></div>;
  if (section === "process") return <div className="grid gap-4 md:grid-cols-2"><Simple label="Step number" value={item.number} onChange={(value) => onChange("number", value)} /><Simple label="Title" value={item.title} onChange={(value) => onChange("title", value)} /><Text label="Description" value={item.text} onChange={(value) => onChange("text", value)} /><ColorSelect value={item.color} onChange={(value) => onChange("color", value)} /></div>;
  if (section === "documents") return <div className="grid gap-4 md:grid-cols-2"><Simple label="Title" value={item.title} onChange={(value) => onChange("title", value)} /><Simple label="Icon class" value={item.icon} onChange={(value) => onChange("icon", value)} /><Field label="List items (one per line)"><textarea rows={5} className={inputClass} value={item.list.join("\n")} onChange={(event) => onChange("list", event.target.value.split("\n"))} /></Field><ColorSelect value={item.color} onChange={(value) => onChange("color", value)} /></div>;
  return <div className="grid gap-4 md:grid-cols-2"><Simple label="Title" value={item.title} onChange={(value) => onChange("title", value)} /><Simple label="Icon class" value={item.icon} onChange={(value) => onChange("icon", value)} /><Text label="Description" value={item.text} onChange={(value) => onChange("text", value)} /><ColorSelect value={item.color} onChange={(value) => onChange("color", value)} /></div>;
}

function ButtonFields({ title, value, onChange }) {
  return <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="px-2 text-xs font-bold text-slate-500">{title}</legend><div className="grid gap-3 md:grid-cols-3"><Simple label="Button label" value={value.label} onChange={(entry) => onChange("label", entry)} /><Simple label="Link" value={value.href} onChange={(entry) => onChange("href", entry)} /><Simple label="Icon class (optional)" value={value.icon} onChange={(entry) => onChange("icon", entry)} /></div></fieldset>;
}

function ImageField({ section, label, value, setSection, uploadImage, uploading }) {
  const id = `${section}-image-upload`;
  return <Field label={label} wide><div className="flex flex-col gap-3 sm:flex-row"><input className={inputClass} value={value} placeholder="Image URL" onChange={(event) => setSection(section, "backgroundImage", event.target.value)} /><label htmlFor={id} className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-bold text-violet-700 hover:bg-violet-100">{uploading === `${section}.backgroundImage` ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} Upload</label><input id={id} type="file" accept="image/*" hidden onChange={(event) => uploadImage(event, section, "backgroundImage")} /></div>{value && <div role="img" aria-label="Background preview" className="mt-3 h-32 w-full rounded-xl bg-cover bg-center" style={{ backgroundImage: `url("${value}")` }} />}</Field>;
}

function ColorSelect({ value, onChange, stat = false }) {
  const options = stat ? [["g", "Green"], ["c", "Cyan"], ["o", "Orange"], ["w", "White"]] : [["green", "Green"], ["cyan", "Cyan"], ["orange", "Orange"]];
  return <Field label="Accent color"><select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>;
}

function Simple({ label, value, onChange }) { return <Field label={label}><input className={inputClass} value={value || ""} onChange={(event) => onChange(event.target.value)} /></Field>; }
function Text({ label, value, onChange }) { return <Field label={label}><textarea rows={3} className={inputClass} value={value || ""} onChange={(event) => onChange(event.target.value)} /></Field>; }
function Field({ label, wide, children }) { return <label className={wide ? "md:col-span-2" : ""}><span className={labelClass}>{label}</span>{children}</label>; }
function IconButton({ label, disabled, danger, onClick, children }) { return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className={`rounded-lg border bg-white p-2 disabled:opacity-30 ${danger ? "border-red-100 text-red-500 hover:bg-red-50" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}>{children && <span className="block [&>svg]:h-4 [&>svg]:w-4">{children}</span>}</button>; }
