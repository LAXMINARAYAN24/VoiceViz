import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  LogOut,
  Clock,
  Code,
  Eye,
  Play,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface HistoryRow {
  id: string;
  created_at: string;
  voice_transcript: string | null;
  generated_sql: string | null;
  results_summary: Json | null;
  chart_type: string | null;
  connection_id: string | null;
  connection_name?: string;
}

export default function History() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<HistoryRow | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("query_history")
      .select("*, db_connections(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Failed to load history");
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      voice_transcript: r.voice_transcript,
      generated_sql: r.generated_sql,
      results_summary: r.results_summary,
      chart_type: r.chart_type,
      connection_id: r.connection_id,
      connection_name: r.db_connections?.name || null,
    }));
    setRows(mapped);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("query_history").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Deleted");
    }
    setDeleting(null);
  };

  const resultsArray = (summary: Json | null): Record<string, unknown>[] => {
    if (!summary || !Array.isArray(summary)) return [];
    return summary as Record<string, unknown>[];
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-bold tracking-tight">
            VoiceViz
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile">
                <User className="mr-1.5 h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Query History</h1>
            <p className="text-sm text-muted-foreground">
              Review past voice queries and their results
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No queries yet. Go to the dashboard and ask your database a question!</p>
            <Button className="mt-4" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Transcript */}
                    <p className="font-medium text-card-foreground truncate">
                      {row.voice_transcript || "No transcript"}
                    </p>

                    {/* Meta */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                      </span>
                      {row.connection_name && (
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {row.connection_name}
                        </span>
                      )}
                      {row.results_summary && Array.isArray(row.results_summary) && (
                        <span>
                          {(row.results_summary as unknown[]).length} row
                          {(row.results_summary as unknown[]).length !== 1 ? "s" : ""} saved
                        </span>
                      )}
                    </div>

                    {/* SQL snippet */}
                    {row.generated_sql && (
                      <pre className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground overflow-x-auto max-w-full whitespace-pre-wrap line-clamp-2">
                        {row.generated_sql}
                      </pre>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Re-run on dashboard"
                      onClick={() =>
                        navigate("/dashboard", {
                          state: {
                            rerunTranscript: row.voice_transcript || "",
                            rerunSql: row.generated_sql || "",
                            rerunConnectionId: row.connection_id,
                          },
                        })
                      }
                      disabled={!row.generated_sql}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="View results"
                      onClick={() => setPreview(row)}
                      disabled={!row.results_summary}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="Delete"
                      onClick={() => handleDelete(row.id)}
                      disabled={deleting === row.id}
                    >
                      {deleting === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Results preview dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">
              {preview?.voice_transcript || "Query Results"}
            </DialogTitle>
          </DialogHeader>

          {preview?.generated_sql && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Code className="h-3 w-3" />
                SQL
              </p>
              <pre className="rounded-lg bg-muted px-3 py-2 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                {preview.generated_sql}
              </pre>
            </div>
          )}

          {(() => {
            const data = resultsArray(preview?.results_summary ?? null);
            if (data.length === 0) {
              return (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No result data saved
                </p>
              );
            }
            const cols = Object.keys(data[0]);
            return (
              <ScrollArea className="flex-1 max-h-[400px] rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {cols.map((c) => (
                        <TableHead key={c} className="whitespace-nowrap">
                          {c}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, i) => (
                      <TableRow key={i}>
                        {cols.map((c) => (
                          <TableCell key={c} className="whitespace-nowrap">
                            {row[c] === null ? (
                              <span className="text-muted-foreground italic">null</span>
                            ) : (
                              String(row[c])
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
