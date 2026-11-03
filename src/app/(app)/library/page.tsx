"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Wand2, Tags, Trash2, FolderOpen, Image, Video, Camera, Layers, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  loadProjects, loadAssets, createProject, deleteProject,
  createAsset, updateAsset, deleteAsset,
  type Project, type Asset, type AssetStatus,
} from "@/lib/library";

const statusConfig: Record<AssetStatus, { label: string; class: string }> = {
  idea:      { label: "Ide",        class: "bg-gray-100 text-gray-700 border-gray-200" },
  generated: { label: "Generated",  class: "bg-blue-100 text-blue-700 border-blue-200" },
  produced:  { label: "Diproduksi", class: "bg-orange-100 text-orange-700 border-orange-200" },
  uploaded:  { label: "Uploaded",   class: "bg-green-100 text-green-700 border-green-200" },
};

const statusOrder: AssetStatus[] = ["idea", "generated", "produced", "uploaded"];

const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  photo: Camera, vector: Layers, video: Video, image: Image,
};

export default function LibraryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [newAssetTitle, setNewAssetTitle] = useState("");
  const [newAssetType, setNewAssetType] = useState("photo");
  const [newAssetProjectId, setNewAssetProjectId] = useState("");

  useEffect(() => {
    setProjects(loadProjects());
    setAssets(loadAssets());
  }, []);

  const filteredAssets = assets.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchProject = filterProject === "all" || a.projectId === filterProject;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchType = filterType === "all" || a.type === filterType;
    return matchSearch && matchProject && matchStatus && matchType;
  });

  const stats = {
    total: assets.length,
    idea: assets.filter((a) => a.status === "idea").length,
    generated: assets.filter((a) => a.status === "generated").length,
    produced: assets.filter((a) => a.status === "produced").length,
    uploaded: assets.filter((a) => a.status === "uploaded").length,
  };

  function handleCreateProject() {
    if (!newProjectName.trim()) return;
    const p = createProject({ name: newProjectName.trim(), description: newProjectDesc.trim() });
    setProjects((prev) => [...prev, p]);
    setProjectDialogOpen(false);
    setNewProjectName("");
    setNewProjectDesc("");
    toast.success(`Project "${p.name}" dibuat!`);
  }

  function handleDeleteProject(id: string, name: string) {
    deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setAssets((prev) => prev.filter((a) => a.projectId !== id));
    if (filterProject === id) setFilterProject("all");
    toast.success(`Project "${name}" dihapus.`);
  }

  function handleCreateAsset() {
    if (!newAssetTitle.trim()) return;
    const a = createAsset({ title: newAssetTitle.trim(), type: newAssetType, projectId: newAssetProjectId });
    setAssets((prev) => [...prev, a]);
    setAssetDialogOpen(false);
    setNewAssetTitle("");
    setNewAssetType("photo");
    setNewAssetProjectId("");
    toast.success(`Aset "${a.title}" ditambahkan!`);
  }

  function handleStatusChange(id: string, status: AssetStatus) {
    updateAsset(id, { status });
    setAssets((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    toast.success(`Status diupdate ke "${statusConfig[status].label}"`);
  }

  function handleDeleteAsset(id: string, title: string) {
    deleteAsset(id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success(`Aset "${title}" dihapus.`);
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Koleksi Aset"
        description="Kelola project, aset, prompt, dan SEO dalam satu tempat"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setProjectDialogOpen(true)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Project Baru
            </Button>
            <Button size="sm" onClick={() => setAssetDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Aset
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {([
            { label: "Total Aset", value: stats.total, status: "all" },
            { label: "Ide", value: stats.idea, status: "idea" },
            { label: "Generated", value: stats.generated, status: "generated" },
            { label: "Diproduksi", value: stats.produced, status: "produced" },
            { label: "Uploaded", value: stats.uploaded, status: "uploaded" },
          ] as const).map((s) => (
            <Card key={s.status} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilterStatus(s.status)}>
              <CardContent className="py-3 px-4">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Projects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setFilterProject(project.id)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{project.name}</div>
                        {project.description && <div className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</div>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {assets.filter((a) => a.projectId === project.id).length} aset
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id, project.name); }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Assets Table */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari aset..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {projects.length > 0 && (
              <Select value={filterProject} onValueChange={(v) => v && setFilterProject(v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Project</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {statusOrder.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Tipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="vector">Vector</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            {filteredAssets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {assets.length === 0 ? "Belum ada aset. Klik \"Tambah Aset\" untuk mulai." : "Tidak ada aset yang ditemukan."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>SEO</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const Icon = assetTypeIcons[asset.type] || Image;
                    const project = projects.find((p) => p.id === asset.projectId);
                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm">{asset.title}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs capitalize">{asset.type}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{project?.name ?? "—"}</TableCell>
                        <TableCell>
                          <Select value={asset.status} onValueChange={(v) => v && handleStatusChange(asset.id, v as AssetStatus)}>
                            <SelectTrigger className="h-7 w-32 text-xs border-0 p-0 shadow-none">
                              <Badge variant="outline" className={`text-xs border ${statusConfig[asset.status].class}`}>
                                {statusConfig[asset.status].label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOrder.map((s) => <SelectItem key={s} value={s} className="text-xs">{statusConfig[s].label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {asset.hasPrompt
                            ? <Badge variant="secondary" className="text-xs">Ada</Badge>
                            : <Button variant="ghost" size="sm" className="h-6 text-xs p-1" onClick={() => router.push("/prompt")}><Plus className="h-3 w-3" /></Button>}
                        </TableCell>
                        <TableCell>
                          {asset.hasSeo
                            ? <Badge variant="secondary" className="text-xs">Ada</Badge>
                            : <Button variant="ghost" size="sm" className="h-6 text-xs p-1" onClick={() => router.push("/seo")}><Plus className="h-3 w-3" /></Button>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(asset.createdAt).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<button className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-sm hover:bg-accent hover:text-accent-foreground" />}>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push("/prompt")}>
                                <Wand2 className="h-4 w-4 mr-2" />Generate Prompt
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push("/seo")}>
                                <Tags className="h-4 w-4 mr-2" />Generate SEO
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => handleDeleteAsset(asset.id, asset.title)}>
                                <Trash2 className="h-4 w-4 mr-2" />Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>

      {/* Dialog: Project Baru */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Project Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Project</Label>
              <Input placeholder="mis: Summer 2026, Ramadan Series..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi (opsional)</Label>
              <Textarea placeholder="Deskripsi singkat..." value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} rows={3} />
            </div>
            <Button className="w-full" onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              <Plus className="h-4 w-4 mr-2" />Buat Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tambah Aset */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Aset</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Judul Aset</Label>
              <Input placeholder="mis: Tropical Beach Sunset" value={newAssetTitle} onChange={(e) => setNewAssetTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipe Aset</Label>
              <Select value={newAssetType} onValueChange={(v) => v && setNewAssetType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Foto</SelectItem>
                  <SelectItem value="vector">Vector</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image / Ilustrasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label>Project (opsional)</Label>
                <Select value={newAssetProjectId} onValueChange={(v) => v && setNewAssetProjectId(v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih project..." /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full" onClick={handleCreateAsset} disabled={!newAssetTitle.trim()}>
              <Plus className="h-4 w-4 mr-2" />Tambah Aset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
