import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Database, Eye, EyeOff } from "lucide-react";

const connectionSchema = z.object({
  name: z.string().trim().min(1, "Connection name is required").max(100),
  db_type: z.enum(["postgresql", "mysql"]),
  host: z.string().trim().min(1, "Host is required").max(255),
  port: z.coerce.number().int().min(1).max(65535),
  db_name: z.string().trim().min(1, "Database name is required").max(255),
  username: z.string().trim().min(1, "Username is required").max(255),
  password: z.string().min(1, "Password is required").max(500),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DatabaseConnectionForm({ onSuccess, onCancel }: Props) {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: { name: "My Database", db_type: "postgresql", port: 5432 },
  });

  const dbType = watch("db_type");

  const testConnection = async (data: ConnectionFormData) => {
    setTesting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("db-proxy", {
        body: { action: "test", ...data },
      });
      if (error) throw error;
      if (result?.success) {
        toast.success("Connection successful!");
      } else {
        toast.error(result?.error || "Connection failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const saveConnection = async (data: ConnectionFormData) => {
    if (!user) return;
    setSaving(true);
    try {
      // Test first
      const { data: testResult, error: testError } = await supabase.functions.invoke("db-proxy", {
        body: { action: "test", ...data },
      });
      if (testError) throw testError;
      if (!testResult?.success) {
        toast.error("Cannot save — connection test failed: " + (testResult?.error || "Unknown error"));
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("db_connections").insert({
        user_id: user.id,
        name: data.name,
        db_type: data.db_type,
        host: data.host,
        port: data.port,
        db_name: data.db_name,
        username: data.username,
        password: data.password,
      });
      if (error) throw error;
      toast.success("Connection saved!");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to save connection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Database className="h-5 w-5 text-primary" />
          Add Database Connection
        </CardTitle>
        <CardDescription>Enter your database credentials to connect. We test the connection before saving.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(saveConnection)} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Connection Name</Label>
            <Input id="name" placeholder="e.g. Production DB" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* DB Type */}
          <div className="space-y-1.5">
            <Label>Database Type</Label>
            <Select value={dbType} onValueChange={(v) => {
              setValue("db_type", v as "postgresql" | "mysql");
              setValue("port", v === "mysql" ? 3306 : 5432);
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Host + Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="host">Host</Label>
              <Input id="host" placeholder="db.example.com" {...register("host")} />
              {errors.host && <p className="text-sm text-destructive">{errors.host.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="port">Port</Label>
              <Input id="port" type="number" {...register("port")} />
              {errors.port && <p className="text-sm text-destructive">{errors.port.message}</p>}
            </div>
          </div>

          {/* Database Name */}
          <div className="space-y-1.5">
            <Label htmlFor="db_name">Database Name</Label>
            <Input id="db_name" placeholder="my_database" {...register("db_name")} />
            {errors.db_name && <p className="text-sm text-destructive">{errors.db_name.message}</p>}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="postgres" {...register("username")} />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving || testing} className="active:scale-[0.97]">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Connection"}
            </Button>
            <Button
              type="button" variant="outline" disabled={saving || testing}
              onClick={handleSubmit(testConnection)}
              className="active:scale-[0.97]"
            >
              {testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing…</> : "Test Connection"}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
