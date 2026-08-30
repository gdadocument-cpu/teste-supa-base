const fs = require("fs");
const path = require("path");

const sourcePath = process.argv[2];
const outputPath = process.argv[3];
if (!sourcePath || !outputPath) {
  throw new Error("Usage: node tools/build-clean-gas.js <source> <destination>");
}

const source = fs.readFileSync(sourcePath, "utf8");

const fonctions = new Map();
const declarations = [...source.matchAll(/^function\s+([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/gm)];
for (let position = 0; position < declarations.length; position++) {
  const correspondance = declarations[position];
  const debut = correspondance.index;
  const fin = position + 1 < declarations.length
    ? declarations[position + 1].index
    : source.length;
  fonctions.set(correspondance[1], { debut, fin, code: source.slice(debut, fin) });
}

const racines = [
  "synchroniserGoogleSheetsDepuisSupabase_",
  "json_",
  "configurerEnvoiRapportsGoogleFormSupabase",
  "envoyerRapportGoogleFormVersSupabase",
  "renvoyerDernierRapportGoogleFormSupabase",
  "optimiserToutesFeuillesMemoireGDA",
  "auditerFeuillesMemoireGDA",
  "reconstruireFeuillesDisponibilitesMemoire",
  "trierEffectifGlobal",
  "reparerStructureEffectifGlobal",
  "ajouterJoursCalendaires_",
  "onOpen",
  "onEdit"
];

const conservees = new Set();
const aVisiter = [...racines];
while (aVisiter.length) {
  const nom = aVisiter.pop();
  if (conservees.has(nom) || !fonctions.has(nom)) continue;
  conservees.add(nom);
  const code = fonctions.get(nom).code;
  for (const candidate of fonctions.keys()) {
    if (
      candidate !== nom &&
      new RegExp("\\b" + candidate.replace(/[$]/g, "\\$&") + "\\b").test(code)
    ) aVisiter.push(candidate);
  }
}

const debutDoGet = source.search(/^function\s+doGet\s*\(/m);
if (debutDoGet < 0) throw new Error("La fonction doGet est introuvable.");
const preambule = source.slice(0, debutDoGet).trimEnd();

const fonctionsTriees = [...conservees]
  .filter((nom) => nom !== "doGet" && nom !== "doPost")
  .map((nom) => fonctions.get(nom))
  .sort((a, b) => a.debut - b.debut)
  .map((fonction) => fonction.code.trim());

const entete = `/**
 * Script allégé du document mémoire GDA.
 *
 * Fonctions conservées :
 * - réception Supabase -> Google Sheets ;
 * - copie vers le document Effectif Officiers ;
 * - envoi Google Form -> Supabase ;
 * - présentation, compteurs, tri et outils de réparation.
 *
 * L'ancien backend du site (OAuth, permissions et opérations métier) est
 * désormais assuré par Supabase et n'est volontairement plus présent ici.
 */`;

const pointsEntree = `function doGet() {
  return json_({
    success: true,
    service: 'GDA Google Sheets bridge',
    sourcePrincipale: 'Supabase'
  });
}

function doPost(e) {
  try {
    if (
      !e || !e.postData ||
      String(e.postData.type || '').toLowerCase().indexOf('application/json') === -1
    ) {
      throw new Error('Une requête JSON est obligatoire.');
    }
    const chargeUtile = JSON.parse(e.postData.contents || '{}');
    if (chargeUtile.action !== 'synchroniserGoogleSheetsDepuisSupabase') {
      throw new Error('Action non prise en charge.');
    }
    return json_(synchroniserGoogleSheetsDepuisSupabase_(chargeUtile));
  } catch (erreur) {
    console.error(erreur && erreur.stack ? erreur.stack : erreur);
    return json_({
      success: false,
      message: erreur && erreur.message ? erreur.message : 'Synchronisation invalide.'
    });
  }
}`;

const resultat = [
  entete,
  preambule,
  pointsEntree,
  ...fonctionsTriees
].join("\n\n") + "\n";

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, resultat, "utf8");
console.log(JSON.stringify({
  fonctionsSource: fonctions.size,
  fonctionsConservees: conservees.size + 2,
  fonctionsRetirees: fonctions.size - conservees.size,
  lignes: resultat.split("\n").length,
  destination: outputPath
}, null, 2));
