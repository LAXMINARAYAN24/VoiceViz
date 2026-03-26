import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-2 text-xl font-bold tracking-tight">VoiceViz</Link>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            {sent ? "Check your email for a reset link" : "Enter your email to receive a reset link"}
          </CardDescription>
        </CardHeader>
        {sent ? (
          <CardFooter className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground text-center">
              We sent a password reset link to <strong>{email}</strong>. It may take a minute to arrive.
            </p>
            <Button variant="outline" asChild className="w-full gap-2">
              <Link to="/login"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
            </Button>
          </CardFooter>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full active:scale-[0.97]" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
