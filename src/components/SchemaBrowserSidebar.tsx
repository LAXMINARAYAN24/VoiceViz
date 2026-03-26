import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Table2,
  ChevronRight,
  Columns3,
  Loader2,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

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

export default function SchemaBrowserSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (!selectedId) {
      setSchema([]);
      return;
    }
    const conn = connections.find((c) => c.id === selectedId);
    if (!conn) return;

    setLoading(true);
    setSchema([]);
    setExpandedTables(new Set());

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
        setLoading(false);
        if (error || !data?.success) {
          toast.error("Failed to fetch schema");
          return;
        }
        setSchema(data.schema || []);
      });
  }, [selectedId, connections]);

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (collapsed) {
    return (
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarContent className="pt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="justify-center">
                <Database className="h-4 w-4 text-muted-foreground" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5 text-xs">
            <Database className="h-3.5 w-3.5" />
            Schema Browser
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 pb-2">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select database…" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} ({c.db_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && selectedId && schema.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                No tables found
              </p>
            )}

            {!loading && !selectedId && connections.length > 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                Pick a connection to browse its schema
              </p>
            )}

            {connections.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                No connections yet.{" "}
                <a href="/connections" className="text-primary underline underline-offset-2">
                  Add one
                </a>
              </p>
            )}

            <SidebarMenu>
              {schema.map((tbl) => (
                <Collapsible
                  key={tbl.table_name}
                  open={expandedTables.has(tbl.table_name)}
                  onOpenChange={() => toggleTable(tbl.table_name)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full justify-between text-xs font-medium">
                        <span className="flex items-center gap-1.5 truncate">
                          <Table2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate">{tbl.table_name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {tbl.columns.length}
                          </Badge>
                          <ChevronRight
                            className={`h-3 w-3 text-muted-foreground transition-transform ${
                              expandedTables.has(tbl.table_name) ? "rotate-90" : ""
                            }`}
                          />
                        </span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className="ml-4 border-l border-border pl-2 py-1 space-y-0.5">
                        {tbl.columns.map((col) => (
                          <li
                            key={col.column_name}
                            className="flex items-center gap-1.5 py-0.5 px-1 text-[11px] rounded hover:bg-muted/50 cursor-default"
                          >
                            {col.column_name.toLowerCase().includes("id") ? (
                              <KeyRound className="h-3 w-3 shrink-0 text-amber-500" />
                            ) : (
                              <Columns3 className="h-3 w-3 shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate font-mono text-foreground">
                              {col.column_name}
                            </span>
                            <span className="ml-auto shrink-0 text-muted-foreground text-[10px]">
                              {col.data_type}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
