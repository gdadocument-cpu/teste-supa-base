# Intranet GDA — migration Supabase (test)

Ce dépôt privé est une copie de test. Il ne déploie pas et ne remplace pas le Worker officiel `intranet-gda`.

## État actuel

- Schéma Supabase versionné dans `supabase/migrations/`.
- RLS activée sur les 21 tables publiques, aucun droit de table accordé au rôle anonyme.
- Deux effectifs distincts : `members` pour l’effectif officier instantané et `gda_roster_versions` pour l’effectif GDA retardé.
- Les rapports, absences, départs et historiques stockent le matricule et le grade du moment dans des champs `*_snapshot`.
- Deux Edge Functions déployées : `profile-bootstrap` et `gda-api`.
- Copie initiale chargée dans le projet Supabase de test : effectif, rapports, absences, départs, historiques et modules instructeur.
- Page de contrôle locale : `supabase-test.html`.

## Lancer le contrôle local

```powershell
pnpm install
pnpm run build
python -m http.server 8787
```

Ouvrir ensuite `http://localhost:8787/supabase-test.html`.

## Étape manuelle encore requise

Discord est volontairement laissé désactivé tant que le secret OAuth n’a pas été saisi directement dans le tableau de bord Supabase. Ne jamais placer ce secret dans Git. Le callback à déclarer dans l’application Discord est :

`https://hiothrwlpmulpcwwjxqf.supabase.co/auth/v1/callback`

Une fois le fournisseur Discord activé, la page de contrôle permet de vérifier l’identité, l’effectif retardé, l’effectif instantané et les grades archivés avant de basculer l’interface complète.
