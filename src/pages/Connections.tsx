import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import DatabaseConnectionForm from "@/components/DatabaseConnectionForm";
import ConnectionsList from "@/components/ConnectionsList";
import SchemaViewer from "@/components/SchemaViewer";
import type { Tables } from "@/integrations/supabase/types";

export default function Connections() {
  const { signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [schemaData, setSchemaData] = useState<{ name: string; schema: any[] } | null>(null);

  const handleSchemaView = (conn: Tables<"db_connections">, schema: any) => {
    setSchemaData({ name: conn.name, schema });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-bold tracking-tight">VoiceViz</Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile"><User className="mr-1.5 h-4 w-4" />Profile</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Database Connections</h1>
            <p className="text-sm text-muted-foreground">Connect your PostgreSQL or MySQL databases</p>
          </div>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-6 active:scale-[0.97]">
            <Plus className="mr-2 h-4 w-4" />Add Connection
          </Button>
        )}

        {showForm && (
          <div className="mb-8">
            <DatabaseConnectionForm
              onSuccess={() => { setShowForm(false); setRefreshKey((k) => k + 1); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {schemaData && (
          <div className="mb-8">
            <SchemaViewer
              connectionName={schemaData.name}
              schema={schemaData.schema}
              onClose={() => setSchemaData(null)}
            />
          </div>
        )}

        <ConnectionsList onSchemaView={handleSchemaView} refreshKey={refreshKey} />
      </main>
    </div>
  );
}
