"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Copy,
  Edit3,
  ExternalLink,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  FolderPlus,
  Loader2,
  Move,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const ROOT_PREFIX = "listmein/atandfinternational/";

function getFileIcon(fileName = "") {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "avif"].includes(ext)) return { type: "image", Icon: FileImage, color: "text-sky-600" };
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return { type: "video", Icon: FileVideo, color: "text-indigo-600" };
  if (["mp3", "wav", "aac"].includes(ext)) return { type: "audio", Icon: FileAudio, color: "text-emerald-600" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { type: "archive", Icon: FileArchive, color: "text-amber-600" };
  return { type: "file", Icon: FileText, color: "text-slate-500" };
}

function lastPathPart(path = "") {
  return path.split("/").filter(Boolean).pop() || "Root";
}

function normalizeFolderPath(path = "") {
  return path
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Gallery() {
  const [items, setItems] = useState({ files: [], folders: [] });
  const [loading, setLoading] = useState(true);
  const [prefix, setPrefix] = useState(ROOT_PREFIX);
  const [folderName, setFolderName] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [newName, setNewName] = useState("");
  const [movePath, setMovePath] = useState(ROOT_PREFIX);
  const [modal, setModal] = useState(null);
  const [activeUploads, setActiveUploads] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gallery?prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch gallery");
      setItems({ files: data.files || [], folders: data.folders || [] });
    } catch (error) {
      toast.error(error.message || "Failed to fetch gallery");
    } finally {
      setLoading(false);
    }
  }, [prefix]);

  useEffect(() => {
    Promise.resolve().then(fetchGallery);
  }, [fetchGallery]);

  const currentParts = prefix.replace(ROOT_PREFIX, "").split("/").filter(Boolean);

  const goBack = () => {
    if (prefix === ROOT_PREFIX) return;
    const parts = prefix.split("/").filter(Boolean);
    parts.pop();
    const nextPrefix = `${parts.join("/")}/`;
    setPrefix(nextPrefix.startsWith(ROOT_PREFIX) ? nextPrefix : ROOT_PREFIX);
  };

  const handleCreateFolder = async (event) => {
    event.preventDefault();
    if (!folderName.trim()) return;

    setActionLoading(true);
    try {
      const folderPath = `${prefix}${normalizeFolderPath(folderName)}/`;
      const res = await fetch("/api/admin/gallery/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create folder");

      toast.success("Folder created");
      setFolderName("");
      setModal(null);
      fetchGallery();
    } catch (error) {
      toast.error(error.message || "Failed to create folder");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    await Promise.all(files.map((file) => uploadFile(file)));
    fetchGallery();
  };

  const uploadFile = (file) => {
    const uploadKey = `${file.name}-${file.lastModified}`;

    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", prefix);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/gallery/upload", true);

      const finish = () => {
        setActiveUploads((prev) => {
          const next = { ...prev };
          delete next[uploadKey];
          return next;
        });
        resolve();
      };

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setActiveUploads((prev) => ({
          ...prev,
          [uploadKey]: { name: file.name, progress: Math.round((event.loaded / event.total) * 100) },
        }));
      };

      xhr.onload = () => {
        let data = {};
        try {
          data = JSON.parse(xhr.responseText || "{}");
        } catch {
          data = {};
        }

        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          toast.success(`${file.name} uploaded`);
        } else {
          toast.error(data.error || `Failed to upload ${file.name}`);
        }
        finish();
      };

      xhr.onerror = () => {
        toast.error(`Failed to upload ${file.name}`);
        finish();
      };

      setActiveUploads((prev) => ({ ...prev, [uploadKey]: { name: file.name, progress: 0 } }));
      xhr.send(formData);
    });
  };

  const handleRename = async (event) => {
    event.preventDefault();
    if (!selectedItem || !newName.trim()) return;

    setActionLoading(true);
    try {
      let nextName;
      if (selectedItem.isFolder) {
        const parts = selectedItem.name.split("/").filter(Boolean);
        parts[parts.length - 1] = normalizeFolderPath(newName);
        nextName = `${parts.join("/")}/`;
      } else {
        const parts = selectedItem.path.split("/");
        parts[parts.length - 1] = normalizeFolderPath(newName);
        nextName = parts.join("/");
      }

      const res = await fetch("/api/admin/gallery/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: selectedItem.name, newName: nextName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Rename failed");

      toast.success("Renamed");
      setModal(null);
      fetchGallery();
    } catch (error) {
      toast.error(error.message || "Rename failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async (event) => {
    event.preventDefault();
    if (!selectedItem) return;

    setActionLoading(true);
    try {
      const targetPrefix = `${normalizeFolderPath(movePath || ROOT_PREFIX)}/`;
      const itemName = selectedItem.isFolder ? `${lastPathPart(selectedItem.name)}/` : lastPathPart(selectedItem.path);

      const res = await fetch("/api/admin/gallery/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: selectedItem.name, newName: `${targetPrefix}${itemName}` }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Move failed");

      toast.success("Moved");
      setModal(null);
      fetchGallery();
    } catch (error) {
      toast.error(error.message || "Move failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/gallery?name=${encodeURIComponent(selectedItem.name)}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Delete failed");

      toast.success("Deleted");
      setModal(null);
      fetchGallery();
    } catch (error) {
      toast.error(error.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const openRename = (item) => {
    setSelectedItem(item);
    setNewName(item.isFolder ? lastPathPart(item.name) : lastPathPart(item.path));
    setModal("rename");
  };

  const openMove = (item) => {
    setSelectedItem(item);
    setMovePath(ROOT_PREFIX);
    setModal("move");
  };

  const openDelete = (item) => {
    setSelectedItem(item);
    setModal("delete");
  };

  const uploadCount = Object.keys(activeUploads).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gallery</h1>
          <p className="mt-1 text-sm text-slate-500">Manage media assets stored in Cloud.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setModal("folder")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </button>
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 ${uploadCount ? "pointer-events-none opacity-70" : ""}`}>
            <Upload className="h-4 w-4" />
            {uploadCount ? "Uploading..." : "Upload Files"}
            <input type="file" multiple hidden onChange={handleFileUpload} disabled={Boolean(uploadCount)} />
          </label>
        </div>
      </div>

      {uploadCount > 0 && (
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-violet-700">Uploading</span>
            {Object.entries(activeUploads).map(([key, upload]) => (
              <div key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span className="max-w-40 truncate text-xs font-medium text-slate-700">{upload.name}</span>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-violet-600" style={{ width: `${upload.progress}%` }} />
                </div>
                <span className="text-xs font-bold text-violet-700">{upload.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          {prefix !== ROOT_PREFIX && (
            <button type="button" onClick={goBack} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Go back">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={() => setPrefix(ROOT_PREFIX)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${prefix === ROOT_PREFIX ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-100"}`}>
            Root
          </button>
          {currentParts.map((part, index) => {
            const nextPrefix = `${ROOT_PREFIX}${currentParts.slice(0, index + 1).join("/")}/`;
            return (
              <button key={nextPrefix} type="button" onClick={() => setPrefix(nextPrefix)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${prefix === nextPrefix ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-100"}`}>
                {part}
              </button>
            );
          })}
        </div>

        <div className="min-h-[440px] p-4">
          {loading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              <p className="mt-3 text-sm font-medium">Loading assets...</p>
            </div>
          ) : items.folders.length === 0 && items.files.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <Folder className="h-14 w-14 text-slate-300" />
              <h2 className="mt-4 text-lg font-bold text-slate-700">This folder is empty</h2>
              <p className="mt-1 text-sm text-slate-500">Upload a file or create a folder to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
              {items.folders.map((folder) => (
                <div key={folder} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <button type="button" onClick={() => setPrefix(folder)} className="flex aspect-square w-full items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                    <Folder className="h-14 w-14" />
                  </button>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-800" title={lastPathPart(folder)}>{lastPathPart(folder)}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => openRename({ name: folder, isFolder: true })} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Rename folder"><Edit3 className="h-4 w-4" /></button>
                      <button type="button" onClick={() => openMove({ name: folder, isFolder: true })} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Move folder"><Move className="h-4 w-4" /></button>
                      <button type="button" onClick={() => openDelete({ name: folder, isFolder: true })} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete folder"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}

              {items.files.map((file) => {
                const displayName = file.displayName || lastPathPart(file.publicId || file.name);
                const { type, Icon, color } = getFileIcon(displayName);

                return (
                  <div key={file.name} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                      {type === "image" ? (
                        <img src={file.url} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <Icon className={`h-14 w-14 ${color}`} />
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="truncate text-sm font-bold text-slate-800" title={displayName}>{displayName}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <button type="button" onClick={() => navigator.clipboard.writeText(file.url).then(() => toast.success("URL copied"))} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Copy URL"><Copy className="h-4 w-4" /></button>
                        <a href={file.url} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Preview"><ExternalLink className="h-4 w-4" /></a>
                        <button type="button" onClick={() => openRename({ name: file.name, path: file.publicId, isFolder: false })} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Rename file"><Edit3 className="h-4 w-4" /></button>
                        <button type="button" onClick={() => openMove({ name: file.name, path: file.publicId, isFolder: false })} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Move file"><Move className="h-4 w-4" /></button>
                        <button type="button" onClick={() => openDelete({ name: file.name, isFolder: false })} className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete file"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modal === "folder" && (
        <Modal title="Create New Folder" onClose={() => setModal(null)}>
          <form onSubmit={handleCreateFolder} className="space-y-4 p-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Folder Name</span>
              <input value={folderName} onChange={(event) => setFolderName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" required />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-70">{actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}Create</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "rename" && (
        <Modal title={`Rename ${selectedItem?.isFolder ? "Folder" : "File"}`} onClose={() => setModal(null)}>
          <form onSubmit={handleRename} className="space-y-4 p-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">New Name</span>
              <input value={newName} onChange={(event) => setNewName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" required />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-70">{actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}Rename</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "move" && (
        <Modal title={`Move ${selectedItem?.isFolder ? "Folder" : "File"}`} onClose={() => setModal(null)}>
          <form onSubmit={handleMove} className="space-y-4 p-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Target Path</span>
              <input value={movePath} onChange={(event) => setMovePath(event.target.value)} placeholder={`${ROOT_PREFIX}images/backup/`} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-70">{actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}Move</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "delete" && (
        <Modal title="Delete Item" onClose={() => setModal(null)}>
          <div className="space-y-4 p-5">
            <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-bold text-slate-900">{selectedItem?.isFolder ? lastPathPart(selectedItem.name) : lastPathPart(selectedItem?.name || "")}</span>?</p>
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70">{actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
