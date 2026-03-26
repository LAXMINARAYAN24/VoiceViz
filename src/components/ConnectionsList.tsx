import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Database, Trash2, RefreshCw, Table2, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Connection = Tables<"db_connections">;

interface Props {
  onSchemaView?: (connection: Connection, schema: any) => void;
  refreshKey?: number;
}

export default function ConnectionsList({ onSchemaView, refreshKey }: Props) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingSchema, setFetchingSchema] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchConnections = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("db_connections")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load connections");
    } else {
      setConnections(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchConnections(); }, [user, refreshKey]);

  const deleteConnection = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("db_connections").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete connection");
    } else {
      toast.success("Connection removed");
      setConnections((prev) => prev.filter((c) => c.id !== id));
    }
    setDeleting(null);
  };

  const viewSchema = async (conn: Connection) => {
    setFetchingSchema(conn.id);
    try {
      const { data, error } = await supabase.functions.invoke("db-proxy", {
        body: {
          action: "schema",
          db_type: conn.db_type,
          host: conn.host,
          port: conn.port,
          db_name: conn.db_name,
          username: conn.username,
          password: conn.password,
        },
      });
      if (error) throw error;
      if (data?.success) {
        onSchemaView?.(conn, data.schema);
      } else {
        toast.error(data?.error || "Failed to fetch schema");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch schema");
    } finally {
      setFetchingSchema(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading connections…
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
        <Database className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No database connections yet. Add one above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((conn) => (
        <Card key={conn.id} className="border-border shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Database className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-card-foreground truncate">{conn.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {conn.host}:{conn.port}/{conn.db_name}
                </p>
              </div>
              <Badge variant="secondary" className="ml-2 shrink-0">
                {conn.db_type === "postgresql" ? "PostgreSQL" : "MySQL"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button
                size="sm" variant="outline"
                disabled={fetchingSchema === conn.id}
                onClick={() => viewSchema(conn)}
                className="active:scale-[0.97]"
              >
                {fetchingSchema === conn.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Table2 className="mr-1.5 h-4 w-4" />Schema</>
                )}
              </Button>
              <Button
                size="sm" variant="ghost"
                disabled={deleting === conn.id}
                onClick={() => deleteConnection(conn.id)}
                className="text-destructive hover:text-destructive active:scale-[0.97]"
              >
                {deleting === conn.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
