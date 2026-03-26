import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Table2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchemaTable {
  table_name: string;
  columns: { column_name: string; data_type: string; is_nullable: string }[];
}

interface Props {
  connectionName: string;
  schema: SchemaTable[];
  onClose: () => void;
}

export default function SchemaViewer({ connectionName, schema, onClose }: Props) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Table2 className="h-5 w-5 text-primary" />
          Schema — {connectionName}
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
        {schema.length === 0 && (
          <p className="text-muted-foreground text-sm">No tables found in this database.</p>
        )}
        {schema.map((tbl) => (
          <div key={tbl.table_name}>
            <h4 className="mb-2 font-semibold text-card-foreground flex items-center gap-2">
              {tbl.table_name}
              <Badge variant="secondary" className="text-xs">{tbl.columns.length} cols</Badge>
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Column</TableHead>
                  <TableHead className="w-1/3">Type</TableHead>
                  <TableHead>Nullable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tbl.columns.map((col) => (
                  <TableRow key={col.column_name}>
                    <TableCell className="font-mono text-sm">{col.column_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{col.data_type}</TableCell>
                    <TableCell>
                      <Badge variant={col.is_nullable === "YES" ? "outline" : "secondary"} className="text-xs">
                        {col.is_nullable === "YES" ? "yes" : "no"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
