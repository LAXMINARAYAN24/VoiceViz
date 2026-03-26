import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Play, Loader2, AlertCircle, Database, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ResultsChart from "@/components/ResultsChart";

interface Connection {
  id: string;
  name: string;
  db_type: string;
  host: string;
  port: number;
  db_name: string;
  username: string;
  password: string;
}

interface SchemaTable {
  table_name: string;
  columns: { column_name: string; data_type: string; is_nullable: string }[];
}

interface QueryWorkspaceProps {
  transcript: string;
  initialSql?: string;
  initialConnectionId?: string;
  onConsumeRerun?: () => void;
}

export default function QueryWorkspace({ transcript, initialSql, initialConnectionId, onConsumeRerun }: QueryWorkspaceProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [schema, setSchema] = useState<SchemaTable[] | null>(null);
  const [sql, setSql] = useState("");
  const [explanation, setExplanation] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Apply re-run values from history
  useEffect(() => {
    if (initialSql && initialConnectionId) {
      setSelectedId(initialConnectionId);
      setSql(initialSql);
      onConsumeRerun?.();
    }
  }, [initialSql, initialConnectionId]);

  // Fetch connections
  useEffect(() => {
    if (!user) return;
    supabase
      .from("db_connections")
      .select("id, name, db_type, host, port, db_name, username, password")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setConnections(data);
      });
  }, [user]);

  // Fetch schema when connection changes
  useEffect(() => {
    if (!selectedId) {
      setSchema(null);
      return;
    }
    const conn = connections.find((c) => c.id === selectedId);
    if (!conn) return;

    setLoadingSchema(true);
    setSchema(null);
    setSql("");
    setExplanation("");
    setResults(null);

    supabase.functions
      .invoke("db-proxy", {
        body: {
          action: "schema",
          db_type: conn.db_type,
          host: conn.host,
          port: conn.port,
          db_name: conn.db_name,
          username: conn.username,
          password: conn.password,
        },
      })
      .then(({ data, error }) => {
        setLoadingSchema(false);
        if (error || !data?.success) {
          toast.error("Failed to fetch schema");
          return;
        }
        setSchema(data.schema);
      });
  }, [selectedId, connections]);

  const selectedConn = connections.find((c) => c.id === selectedId);

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      toast.error("Speak or type a question first");
      return;
    }
    if (!schema) {
      toast.error("Select a connection and wait for schema to load");
      return;
    }

    setGenerating(true);
    setSql("");
    setExplanation("");
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("voice-to-sql", {
        body: { transcript: transcript.trim(), schema },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setSql(data.sql || "");
      setExplanation(data.explanation || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate SQL");
    } finally {
      setGenerating(false);
    }
  };

  const handleRun = async () => {
    if (!sql.trim() || !selectedConn) return;

    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith("SELECT")) {
      toast.error("Only SELECT queries are allowed");
      return;
    }

    setRunning(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("db-proxy", {
        body: {
          action: "query",
          db_type: selectedConn.db_type,
          host: selectedConn.host,
          port: selectedConn.port,
          db_name: selectedConn.db_name,
          username: selectedConn.username,
          password: selectedConn.password,
          sql: sql.trim(),
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Query failed");

      const rows = data.rows || [];
      setResults(rows);
      setColumns(rows.length > 0 ? Object.keys(rows[0]) : []);

      // Save to query_history
      if (user) {
        await supabase.from("query_history").insert({
          user_id: user.id,
          connection_id: selectedId,
          voice_transcript: transcript.trim(),
          generated_sql: sql.trim(),
          results_summary: rows.slice(0, 10),
        });
      }

      toast.success(`Query returned ${rows.length} row${rows.length !== 1 ? "s" : ""}`);
    } catch (err: any) {
      toast.error(err.message || "Query failed");
    } finally {
      setRunning(false);
    }
  };

  const downloadCSV = () => {
    if (!results || results.length === 0 || columns.length === 0) return;
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const header = columns.map(escape).join(",");
    const rows = results.map((row) => columns.map((col) => escape(row[col])).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (connections.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Database className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No database connections yet.{" "}
          <a href="/connections" className="text-primary underline underline-offset-2">
            Add one first
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection selector + Generate button */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Database Connection
          </label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a connection…" />
            </SelectTrigger>
            <SelectContent>
              {connections.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.db_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || !transcript.trim() || !schema}
          className="gap-1.5"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate SQL
        </Button>
      </div>

      {loadingSchema && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading schema…
        </p>
      )}

      {schema && !sql && !generating && (
        <p className="text-xs text-muted-foreground">
          Schema loaded ({schema.length} table{schema.length !== 1 ? "s" : ""}). Speak a question and tap "Generate SQL".
        </p>
      )}

      {/* SQL preview */}
      {(sql || generating) && (
        <div className="space-y-3">
          {explanation && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
              <p className="text-sm text-foreground">{explanation}</p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Generated SQL (editable)
            </label>
            <Textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="font-mono text-sm min-h-[100px]"
              placeholder={generating ? "Generating…" : "SQL will appear here"}
              disabled={generating}
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={running || !sql.trim()}
            variant="secondary"
            className="gap-1.5"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Query
          </Button>
        </div>
      )}

      {/* Results table */}
      {results && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground">
              {results.length} row{results.length !== 1 ? "s" : ""} returned
            </p>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={downloadCSV}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>

          {results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No rows returned
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col} className="whitespace-nowrap">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, i) => (
                    <TableRow key={i}>
                      {columns.map((col) => (
                        <TableCell key={col} className="whitespace-nowrap">
                          {row[col] === null ? (
                            <span className="text-muted-foreground italic">null</span>
                          ) : (
                            String(row[col])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Chart visualization */}
      {results && results.length > 0 && columns.length >= 2 && (
        <ResultsChart data={results} columns={columns} />
      )}
    </div>
  );
}
