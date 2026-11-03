"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wand2, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { loadPromptHistory, clearPromptHistory, type PromptSession } from "@/lib/history";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function HistoryPromptPage() {
  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [selected, setSelected] = useState<PromptSession | null>(null);

  useEffect(() => { setSessions(loadPromptHistory()); }, []);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Disalin!");
  }

  function handleClear() {
    clearPromptHistory();
    setSessions([]);
    toast.success("Riwayat dihapus.");
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Riwayat Generator Prompt"
        description="Hasil generate prompt yang pernah dibuat"
        actions={
          sessions.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Semua
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6">
        {sessions.length === 0 ? (
          <Card className="flex items-center justify-center min-h-64">
            <CardContent className="text-center text-muted-foreground py-12">
              <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Belum ada riwayat prompt.</p>
              <p className="text-sm">Generate prompt pertamamu di halaman Generator Prompt.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sessions.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelected(s)}
              >
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">{s.assetType}</Badge>
                    <Badge variant="outline" className="text-xs">{s.targetModel}</Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{s.keyword}</p>
                  {s.themes && <p className="text-xs text-muted-foreground truncate">{s.themes}</p>}
                  <p className="text-xs text-muted-foreground">{s.prompts.length} prompt</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selected?.keyword} · {selected?.assetType} · {selected?.targetModel}</DialogTitle>
            <p className="text-xs text-muted-foreground">{selected && formatDate(selected.createdAt)} · {selected?.prompts.length} prompt</p>
          </DialogHeader>
          <div className="overflow-y-auto space-y-3 pr-1">
            {selected?.prompts.map((p, i) => (
              <div key={i} className="border rounded-md p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Prompt #{i + 1} · {p.aspectRatio}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleCopy(`${p.text}\n\nNegative: ${p.negative}`)}>
                    <Copy className="h-3 w-3 mr-1" />Copy
                  </Button>
                </div>
                <p className="text-sm font-mono leading-relaxed bg-muted rounded px-2 py-1.5">{p.text}</p>
                <p className="text-xs font-mono text-red-600 bg-red-50 rounded px-2 py-1">{p.negative}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
