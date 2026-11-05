import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Wallet, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const rules = [
  { label: "Au moins 6 caractères", test: (p: string) => p.length >= 6 },
  { label: "Une minuscule", test: (p: string) => /[a-z]/.test(p) },
  { label: "Une majuscule", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un chiffre", test: (p: string) => /\d/.test(p) },
  {
    label: "Un caractère spécial",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

export default function Login() {
  const isAuth = useStore((s) => s.isAuthenticated);
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuth) return <Navigate to="/" replace />;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = login(email, password);
    setLoading(false);
    if (!res.ok) {
      toast({
        title: "Échec de connexion",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Bienvenue 👋", description: "Connexion réussie" });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="size-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
            <Wallet className="size-7 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-3xl">Ustawi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connectez-vous pour continuer
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-card border border-border rounded-2xl shadow-sm-soft p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              autoComplete="username"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label={show ? "Masquer" : "Afficher"}
              >
                {show ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {password && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
                {rules.map((r) => {
                  const ok = r.test(password);
                  return (
                    <li
                      key={r.label}
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        ok ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {ok ? (
                        <Check className="size-3" />
                      ) : (
                        <X className="size-3" />
                      )}
                      {r.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/60">
            <p className="font-medium text-foreground mb-1">
              Identifiants par défaut
            </p>
            <p>
              Email : <span className="font-mono">admin</span>
            </p>
            <p>
              Mot de passe : <span className="font-mono">admin123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
