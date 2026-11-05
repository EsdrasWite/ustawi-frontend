import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Lock, User, Save } from "lucide-react";

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

const Profile = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === "#parametres") document.getElementById("parametres")?.scrollIntoView({ block: "start" });
  }, [hash]);
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const changePassword = useStore((s) => s.changePassword);

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState(profile.role);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: name.trim(), email: email.trim(), role: role.trim(), avatarUrl: avatarUrl.trim() });
    toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    const res = changePassword(current, next);
    if (!res.ok) {
      toast({ title: "Erreur", description: res.error, variant: "destructive" });
      return;
    }
    setCurrent(""); setNext(""); setConfirm("");
    toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour." });
  };

  return (
    <>
      <PageHeader title="Mon profil" description="Gérez vos informations personnelles et votre sécurité." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="items-center text-center">
            <Avatar className="size-24 ring-4 ring-primary/20 mx-auto">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-semibold">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{name || "Sans nom"}</CardTitle>
            <CardDescription>{role}</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground break-all">
            {email}
          </CardContent>
        </Card>

        <div id="parametres" className="lg:col-span-2 space-y-6 scroll-mt-36">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><User className="size-5 text-primary" /> Informations</CardTitle>
              <CardDescription>Mettez à jour votre identité publique.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="avatar">URL de l'avatar</Label>
                  <Input id="avatar" placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" className="gap-2"><Save className="size-4" /> Enregistrer</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Lock className="size-5 text-primary" /> Mot de passe</CardTitle>
              <CardDescription>Choisissez un mot de passe d'au moins 6 caractères.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="current">Mot de passe actuel</Label>
                  <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next">Nouveau mot de passe</Label>
                  <Input id="next" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmation</Label>
                  <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" variant="default" className="gap-2"><Lock className="size-4" /> Modifier</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Profile;
