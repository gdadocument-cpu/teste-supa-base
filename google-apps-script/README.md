# Script du document mémoire GDA

`GDA_Memoire_Supabase.gs` est la version allégée du script Apps Script.

Elle conserve :

- la synchronisation Supabase vers le document mémoire ;
- la copie de l’effectif vers le document Effectif Officiers ;
- l’envoi des réponses du formulaire Rapport GDA vers Supabase ;
- la présentation, les compteurs, le tri et les outils de réparation.

## Déclencheurs à conserver

- `envoyerRapportGoogleFormVersSupabase` : déclencheur « Lors de l’envoi du formulaire » ;
- `onOpen` et `onEdit` : déclencheurs simples intégrés au nom des fonctions.

Supprimer les anciens déclencheurs horaires visant notamment :

- `synchroniserDocumentPrincipalGDA` ;
- `synchroniserArchivesInstructeurGDA`.

## Remplacement prudent

1. Conserver la sauvegarde de l’ancien projet Apps Script.
2. Remplacer son code par `GDA_Memoire_Supabase.gs`.
3. Enregistrer une nouvelle version du déploiement Web App.
4. Vérifier la propriété de script `GDA_SUPABASE_SHEETS_SECRET`.
5. Lancer la synchronisation depuis l’administration de l’intranet.
6. Envoyer un rapport de test depuis Google Form.
