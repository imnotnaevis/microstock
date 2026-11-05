"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Wand2,
  Tags,
  Trash2,
  FolderOpen,
  Image,
  Video,
  Camera,
  Layers,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  loadProjects,
  loadAssets,
  createProject,
  deleteProject,
  createAsset,
  updateAsset,
  deleteAsset,
  type Project,
  type Asset,
  type AssetStatus,
} from "@/lib/library";

const statusConfig: Record<
  AssetStatus,
  { label: string; class: string; icon: string; dotClass: string }
> = {
  in_review: {
    label: "In Review",
    class: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 font-medium",
    icon: "🟡",
    dotClass: "bg-amber-500",
  },
  accepted: {
    label: "Accepted",
    class: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 font-semibold",
    icon: "🟢",
    dotClass: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    class: "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700 font-medium",
    icon: "🔴",
    dotClass: "bg-rose-500",
  },
  draft: {
    label: "Draft",
    class: "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700",
    icon: "⚪",
    dotClass: "bg-slate-400",
  },
  idea: {
    label: "Draft Ide",
    class: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "⚪",
    dotClass: "bg-gray-400",
  },
  generated: {
    label: "In Review",
    class: "bg-amber-50 text-amber-800 border-amber-300",
    icon: "🟡",
    dotClass: "bg-amber-500",
  },
  produced: {
    label: "Diproduksi",
    class: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "🔵",
    dotClass: "bg-blue-500",
  },
  uploaded: {
    label: "Accepted",
    class: "bg-emerald-50 text-emerald-800 border-emerald-300",
    icon: "🟢",
    dotClass: "bg-emerald-500",
  },
};

const statusOrder: AssetStatus[] = ["in_review", "accepted", "rejected", "draft"];

const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  photo: Camera,
  vector: Layers,
  video: Video,
  image: Image,
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

  // Detail Modal
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
    setAssets(loadAssets());
  }, []);

  const filteredAssets = assets.filter((a) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.category && a.category.toLowerCase().includes(search.toLowerCase()));
    const matchProject = filterProject === "all" || a.projectId === filterProject;
    const matchStatus =
      filterStatus === "all" ||
      a.status === filterStatus ||
      (filterStatus === "in_review" && (a.status === "in_review" || a.status === "generated")) ||
      (filterStatus === "accepted" && (a.status === "accepted" || a.status === "uploaded")) ||
      (filterStatus === "draft" && (a.status === "draft" || a.status === "idea"));
    const matchType = filterType === "all" || a.type === filterType;
    return matchSearch && matchProject && matchStatus && matchType;
  });

  const countInReview = assets.filter((a) => a.status === "in_review" || a.status === "generated").length;
  const countAccepted = assets.filter((a) => a.status === "accepted" || a.status === "uploaded").length;
  const countRejected = assets.filter((a) => a.status === "rejected").length;
  const countDraft = assets.filter((a) => a.status === "draft" || a.status === "idea").length;

  const reviewedTotal = countAccepted + countRejected;
  const acceptanceRate = reviewedTotal > 0 ? Math.round((countAccepted / reviewedTotal) * 100) : 100;

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
    const a = createAsset({
      title: newAssetTitle.trim(),
      type: newAssetType,
      projectId: newAssetProjectId,
    });
    setAssets((prev) => [a, ...prev]);
    setAssetDialogOpen(false);
    setNewAssetTitle("");
    setNewAssetType("photo");
    setNewAssetProjectId("");
    toast.success(`Aset "${a.title}" ditambahkan!`);
  }

  function handleStatusChange(id: string, status: AssetStatus) {
    updateAsset(id, { status });
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (selectedAsset && selectedAsset.id === id) {
      setSelectedAsset((prev) => (prev ? { ...prev, status } : null));
    }
    toast.success(`Status aset diubah ke "${statusConfig[status]?.label || status}"`);
  }

  function handleDeleteAsset(id: string, title: string) {
    deleteAsset(id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (selectedAsset?.id === id) setSelectedAsset(null);
    toast.success(`Aset "${title}" dihapus.`);
  }

  function handleCopy(text: string, msg = "Disalin ke clipboard!") {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Koleksi Aset & Review Tracker"
        description="Pantau seluruh aset yang di-generate SEO-nya, kelola kategori, dan lacak status In Review, Accepted, atau Rejected"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://contributor.stock.adobe.com/uploads"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 text-xs font-semibold bg-primary/5 hover:bg-primary/10 border-primary/30 text-primary cursor-pointer"
              )}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Portal Adobe Stock Contributor
            </a>
            <Button variant="outline" size="sm" onClick={() => setProjectDialogOpen(true)}>
              <FolderOpen className="h-4 w-4 mr-1.5" />
              Project Baru
            </Button>
            <Button size="sm" onClick={() => setAssetDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah Aset
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Contributor Review Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card
            className={cn(
              "cursor-pointer hover:border-primary/50 transition-colors",
              filterStatus === "all" ? "border-primary bg-primary/5" : ""
            )}
            onClick={() => setFilterStatus("all")}
          >
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-bold">{assets.length}</div>
              <div className="text-xs text-muted-foreground font-medium">Total Koleksi</div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer hover:border-amber-400 transition-colors",
              filterStatus === "in_review" ? "border-amber-500 bg-amber-500/10" : ""
            )}
            onClick={() => setFilterStatus("in_review")}
          >
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="h-5 w-5" />
                {countInReview}
              </div>
              <div className="text-xs text-muted-foreground font-medium">🟡 In Review</div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer hover:border-emerald-400 transition-colors",
              filterStatus === "accepted" ? "border-emerald-500 bg-emerald-500/10" : ""
            )}
            onClick={() => setFilterStatus("accepted")}
          >
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5" />
                {countAccepted}
              </div>
              <div className="text-xs text-muted-foreground font-medium">🟢 Accepted (Diterima)</div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer hover:border-rose-400 transition-colors",
              filterStatus === "rejected" ? "border-rose-500 bg-rose-500/10" : ""
            )}
            onClick={() => setFilterStatus("rejected")}
          >
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <XCircle className="h-5 w-5" />
                {countRejected}
              </div>
              <div className="text-xs text-muted-foreground font-medium">🔴 Rejected (Ditolak)</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-bold text-primary flex items-center gap-1">
                {acceptanceRate}%
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                🎯 Acceptance Rate ({reviewedTotal} dinilai)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Adobe Stock Quality Troubleshooting Card */}
        {(filterStatus === "rejected" || countRejected > 0) && (
          <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/40">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 font-semibold text-rose-900 dark:text-rose-200 text-sm">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Bedah Penolakan Adobe Stock: "Quality and Technical Issues"</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-800 dark:text-rose-300 bg-background/80">
                  Panduan Lolos Kurasi
                </Badge>
              </div>

              <p className="text-xs text-rose-900/90 dark:text-rose-200/90 leading-relaxed">
                Pesan ini adalah penolakan standar paling sering untuk aset AI di Adobe Stock. Kurator manusia dan AI inspector memeriksa gambar pada perbesaran <strong>100% (pixel zoom)</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-md bg-background/90 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>🔍 1. Soft Focus (Kurang Tajam di 100%)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Gambar AI sering terlihat tajam di thumbnail, tetapi saat kurator zoom 100%, detail mata, rambut, dan tepi objek terlihat kabur / seperti cat air. <em>Solusi:</em> Wajib periksa di zoom 100% sebelum submit.
                  </p>
                </div>

                <div className="p-2.5 rounded-md bg-background/90 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>⚠️ 2. AI Glitch & Anatomy Artifacts</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Jari tangan melebur/berlebih, pupil mata ganda/tak simetris, atau garis bangunan bengkok. <em>Solusi:</em> Gunakan inpainting / retouching cepat di Photoshop atau hapus elemen cacat.
                  </p>
                </div>

                <div className="p-2.5 rounded-md bg-background/90 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>📐 3. Upscaling & Pixel Noise</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Resolusi asli AI (1024px) dipaksa besar dengan upscaler biasa sehingga pecah/bergradasi kasar. <em>Solusi:</em> Gunakan AI Upscaler khusus (Upscayl gratis / Topaz / Magnific) ke minimal 4000px (4MP+).
                  </p>
                </div>

                <div className="p-2.5 rounded-md bg-background/90 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>☀️ 4. Exposure & Excessive Filtering</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Kulit plastik boneka (airbrushed) tanpa tekstur pori, atau area putih terlalu silau tanpa detail (*blown-out highlights*). <em>Solusi:</em> Pakai Negative Prompt anti-plastic skin yang sudah di-update di app kita.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-900/30 text-xs flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-background hover:bg-rose-50 border-rose-300 text-rose-900 dark:text-rose-200 font-medium cursor-pointer"
                  onClick={() => router.push("/prompt")}
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1" />
                  Buka Prompt Studio (Sudah Terpasang Anti-Quality-Issues)
                </Button>
                <a
                  href="https://helpx.adobe.com/stock/contributor/help/quality-and-technical-issues.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs text-rose-800 dark:text-rose-300")}
                >
                  <span>Baca Dokumentasi Resmi Adobe</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Folder / Projects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className={cn(
                    "cursor-pointer hover:border-primary/50 transition-colors group",
                    filterProject === project.id ? "border-primary bg-primary/5" : ""
                  )}
                  onClick={() =>
                    setFilterProject(filterProject === project.id ? "all" : project.id)
                  }
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {project.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {assets.filter((a) => a.projectId === project.id).length} aset
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id, project.name);
                          }}
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

        {/* Assets Section */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan judul atau kategori otomatis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {projects.length > 0 && (
              <Select value={filterProject} onValueChange={(v) => v && setFilterProject(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status Review" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="in_review">🟡 In Review</SelectItem>
                <SelectItem value="accepted">🟢 Accepted</SelectItem>
                <SelectItem value="rejected">🔴 Rejected</SelectItem>
                <SelectItem value="draft">⚪ Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="vector">Vector</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image / Ilustrasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            {filteredAssets.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground space-y-2">
                <div className="text-3xl">📁</div>
                <p className="text-sm font-medium">
                  {assets.length === 0
                    ? "Belum ada aset di koleksi."
                    : "Tidak ada aset yang cocok dengan filter."}
                </p>
                <p className="text-xs max-w-sm mx-auto">
                  Setiap gambar yang Anda upload dan generate di <strong>SEO Generator</strong> akan otomatis masuk ke sini beserta judul dan kategorinya.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Preview</TableHead>
                    <TableHead>Judul & Kategori Otomatis</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status Review</TableHead>
                    <TableHead>Metadata SEO</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="w-20 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const Icon = assetTypeIcons[asset.type] || Image;
                    const cfg = statusConfig[asset.status] || statusConfig.in_review;
                    return (
                      <TableRow key={asset.id} className="hover:bg-muted/40 transition-colors">
                        {/* Thumbnail */}
                        <TableCell>
                          <div
                            onClick={() => setSelectedAsset(asset)}
                            className="h-12 w-12 rounded-md overflow-hidden bg-muted border flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {asset.thumbnail ? (
                              <img
                                src={asset.thumbnail}
                                alt={asset.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Icon className="h-6 w-6 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableCell>

                        {/* Judul & Kategori */}
                        <TableCell>
                          <div className="space-y-1 max-w-md">
                            <div
                              onClick={() => setSelectedAsset(asset)}
                              className="font-medium text-sm line-clamp-2 hover:text-primary cursor-pointer"
                            >
                              {asset.title}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 h-4 border-primary/30 text-primary bg-primary/5"
                              >
                                {asset.category || "Photos"}
                              </Badge>
                              {asset.seoData && (
                                <span className="text-[11px] text-muted-foreground">
                                  {asset.seoData.keywords?.length || 0} keyword siap pakai
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Tipe Aset */}
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {asset.type}
                          </Badge>
                        </TableCell>

                        {/* Status Review Dropdown */}
                        <TableCell>
                          <Select
                            value={
                              asset.status === "generated"
                                ? "in_review"
                                : asset.status === "uploaded"
                                ? "accepted"
                                : asset.status === "idea"
                                ? "draft"
                                : asset.status
                            }
                            onValueChange={(v) => v && handleStatusChange(asset.id, v as AssetStatus)}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs bg-background">
                              <div className="flex items-center gap-1.5">
                                <span>{cfg.icon}</span>
                                <span className="font-semibold">{cfg.label}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_review">🟡 In Review</SelectItem>
                              <SelectItem value="accepted">🟢 Accepted</SelectItem>
                              <SelectItem value="rejected">🔴 Rejected</SelectItem>
                              <SelectItem value="draft">⚪ Draft</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* SEO Status */}
                        <TableCell>
                          {asset.hasSeo && asset.seoData ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium cursor-pointer"
                              onClick={() => setSelectedAsset(asset)}
                            >
                              <FileCheck2 className="h-3.5 w-3.5 mr-1" />
                              Lihat SEO
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground"
                              onClick={() => router.push(`/seo?keyword=${encodeURIComponent(asset.title)}`)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Buat SEO
                            </Button>
                          )}
                        </TableCell>

                        {/* Dibuat */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(asset.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<button className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer" />}>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedAsset(asset)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>
                              {asset.seoData && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleCopy(asset.seoData!.title, "Judul disalin!")}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Salin Judul
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleCopy(
                                        asset.seoData!.keywords.join(", "),
                                        "Keywords disalin!"
                                      )
                                    }
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Salin Keywords
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/prompt?keyword=${encodeURIComponent(asset.title)}`)
                                }
                              >
                                <Wand2 className="h-4 w-4 mr-2" />
                                Variasi Prompt
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDeleteAsset(asset.id, asset.title)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Aset
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

      {/* Modal Detail Aset & Metadata SEO */}
      <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAsset && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base line-clamp-1 pr-6">
                    {selectedAsset.title}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Preview Image */}
                <div className="sm:col-span-1 rounded-lg overflow-hidden border bg-muted aspect-square flex items-center justify-center">
                  {selectedAsset.thumbnail ? (
                    <img
                      src={selectedAsset.thumbnail}
                      alt={selectedAsset.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="h-12 w-12 text-muted-foreground/40" />
                  )}
                </div>

                {/* Details & Status */}
                <div className="sm:col-span-2 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status Review Microstock</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={
                          selectedAsset.status === "generated"
                            ? "in_review"
                            : selectedAsset.status === "uploaded"
                            ? "accepted"
                            : selectedAsset.status === "idea"
                            ? "draft"
                            : selectedAsset.status
                        }
                        onValueChange={(v) => v && handleStatusChange(selectedAsset.id, v as AssetStatus)}
                      >
                        <SelectTrigger className="h-8 text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_review">🟡 In Review (Sedang Ditinjau)</SelectItem>
                          <SelectItem value="accepted">🟢 Accepted (Diterima)</SelectItem>
                          <SelectItem value="rejected">🔴 Rejected (Ditolak)</SelectItem>
                          <SelectItem value="draft">⚪ Draft (Belum Disubmit)</SelectItem>
                        </SelectContent>
                      </Select>
                      <a
                        href="https://contributor.stock.adobe.com/uploads"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 text-xs shrink-0 cursor-pointer"
                        )}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Adobe Stock
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border p-2 bg-muted/30">
                      <div className="text-muted-foreground text-[10px]">Kategori Otomatis</div>
                      <div className="font-semibold mt-0.5">{selectedAsset.category || "Photos"}</div>
                    </div>
                    <div className="rounded-md border p-2 bg-muted/30">
                      <div className="text-muted-foreground text-[10px]">Tipe Aset</div>
                      <div className="font-semibold capitalize mt-0.5">{selectedAsset.type}</div>
                    </div>
                  </div>

                  {/* Adobe Stock Checklist */}
                  <div className="rounded-md border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 text-xs space-y-1">
                    <div className="font-semibold text-amber-900 dark:text-amber-300 text-[11px] flex items-center gap-1">
                      <FileCheck2 className="h-3.5 w-3.5" />
                      Checklist Portal Adobe Stock:
                    </div>
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div>☑️ Centang: <strong>Created using generative AI tools</strong></div>
                      <div>☑️ Centang: <strong>People and Property are fictional</strong> (jika ada orang/bangunan fiktif)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Content */}
              {selectedAsset.seoData && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Judul SEO</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px]"
                        onClick={() => handleCopy(selectedAsset.seoData!.title, "Judul disalin!")}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Salin
                      </Button>
                    </div>
                    <div className="p-2.5 rounded-md bg-muted text-xs font-medium leading-relaxed select-all">
                      {selectedAsset.seoData.title}
                    </div>
                  </div>

                  {selectedAsset.seoData.description && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Deskripsi</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px]"
                          onClick={() => handleCopy(selectedAsset.seoData!.description, "Deskripsi disalin!")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Salin
                        </Button>
                      </div>
                      <div className="p-2.5 rounded-md bg-muted text-xs text-muted-foreground leading-relaxed select-all">
                        {selectedAsset.seoData.description}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Keywords ({selectedAsset.seoData.keywords?.length || 0})
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px]"
                        onClick={() =>
                          handleCopy(
                            selectedAsset.seoData!.keywords.join(", "),
                            "Semua keyword disalin!"
                          )
                        }
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Salin Semua Keywords
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1.5 border rounded-md">
                      {selectedAsset.seoData.keywords?.map((kw, idx) => (
                        <Badge
                          key={idx}
                          variant={idx < 10 ? "default" : "secondary"}
                          className="text-[11px] cursor-pointer"
                          onClick={() => handleCopy(kw, `"${kw}" disalin!`)}
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Project Baru */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Project Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Project</Label>
              <Input
                placeholder="mis: Summer 2026, Ramadan Series..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi (opsional)</Label>
              <Textarea
                placeholder="Deskripsi singkat..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tambah Aset */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Aset Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Judul Aset</Label>
              <Input
                placeholder="mis: Tropical Beach Sunset"
                value={newAssetTitle}
                onChange={(e) => setNewAssetTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipe Aset</Label>
              <Select value={newAssetType} onValueChange={(v) => v && setNewAssetType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <Select
                  value={newAssetProjectId}
                  onValueChange={(v) => v && setNewAssetProjectId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full" onClick={handleCreateAsset} disabled={!newAssetTitle.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Aset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
