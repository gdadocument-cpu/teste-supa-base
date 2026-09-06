(function () {
  const cle = 'gdaEffectifCompact';
  const actif = () => localStorage.getItem(cle) === '1';
  document.documentElement.classList.toggle('effectif-compact', actif());
  window.appliquerEffectifCompactGlobalGDA = function (valeur) {
    const change = actif() !== valeur;
    localStorage.setItem(cle, valeur ? '1' : '0');
    document.documentElement.classList.toggle('effectif-compact', valeur);
    const caseOption = document.getElementById('effectifCompactActivation');
    if (caseOption) caseOption.checked = valeur;
    if (change) fermer();
  };
  const originale = creerLigneMembre;
  creerLigneMembre = function (membre, index) {
    const html = originale(membre, index);
    const stats = [['report', 'Rapports', membre.nombreRapports], ['objective', 'Recommandations', membre.recommandation], ['surveillance', 'Observations', membre.observation]];
    return html.replace('</article>', `<label class="compact-horaire"><span>Horaire</span><input maxlength="80" aria-label="Horaire de ${echapperHTML(membre.nom)}" placeholder="" value="${echapperHTML(membre.horaire || '')}" ${effectifPeutModifier ? '' : 'readonly'}><output aria-live="polite"></output></label></article>`)
      .replace('</article>', `<div class="compact-compteurs">${stats.map(([icone, titre, valeur]) => `<span title="${titre} : ${echapperHTML(String(valeur || 0))}" aria-label="${titre} : ${echapperHTML(String(valeur || 0))}">${window.iconeGDA ? iconeGDA(icone) : titre}<b>${echapperHTML(String(valeur || 0))}</b></span>`).join('')}</div></article>`);
  };
  function fermer() {
    document.querySelectorAll('.compact-details').forEach(el => el.remove());
    document.querySelectorAll('.effectif-member[aria-expanded]').forEach(el => el.setAttribute('aria-expanded', 'false'));
  }
  function ouvrir(ligne) {
    const deja = ligne.getAttribute('aria-expanded') === 'true';
    fermer();
    if (deja) return;
    const membre = effectifMembres[Number(ligne.dataset.index)];
    if (!membre) return;
    ligne.setAttribute('aria-expanded', 'true');
    const detail = document.createElement('section');
    detail.className = 'compact-details';
    ligne.after(detail);
    ouvrirFicheMembre(Number(ligne.dataset.index), detail);
    const grille = detail.querySelector('.effectif-fiche');
    const compteurs = document.createElement('div');
    compteurs.className = 'compact-statistiques';
    const definitions = [
      ['Nombre de rapports', 'Rapports', 'report', membre.nombreRapports],
      ['Observation', 'Observations', 'surveillance', membre.observation],
      ['Recommandation', 'Recommandations', 'objective', membre.recommandation]
    ];
    definitions.forEach(([label, titre, icone, valeur]) => {
      const champ = Array.from(grille.children).find(el => el.querySelector('.effectif-fiche-label')?.textContent.trim() === label);
      if (!champ) return;
      const nombre = Number(valeur);
      const affichage = Number.isFinite(nombre) && nombre >= 0 ? String(nombre) : '—';
      champ.classList.add('compact-statistique');
      champ.classList.remove('effectif-fiche-champ');
      champ.title = titre;
      champ.setAttribute('aria-label', titre + ' : ' + affichage);
      champ.innerHTML = `<span class="effectif-fiche-label">${echapperHTML(titre)}</span><div class="compact-statistique-valeur">${window.iconeGDA ? iconeGDA(icone) : ''}<strong>${affichage}</strong></div>`;
      if (affichage === '—') champ.title = String(valeur || '');
      compteurs.append(champ);
    });
    const sanction = Array.from(grille.children).find(el => el.querySelector('.effectif-fiche-label')?.textContent.trim() === 'Sanction');
    if (sanction) sanction.after(compteurs);
    else grille.lastElementChild.before(compteurs);
  }
  document.addEventListener('click', function (event) {
    if (!actif()) return;
    if (event.target.closest('.compact-horaire')) { event.stopPropagation(); return; }
    if (event.target.closest('.compact-details')) return;
    const ligne = event.target.closest('.effectif-member');
    if (ligne) { event.stopPropagation(); ouvrir(ligne); }
    else fermer();
  }, true);
  document.addEventListener('keydown', function (event) {
    if (!actif()) return;
    if (event.target.closest('.compact-horaire')) { event.stopPropagation(); return; }
    if (event.target.closest('input,textarea,button')) return;
    if (event.key === 'Escape') fermer();
    const ligne = event.target.closest('.effectif-member');
    if (ligne && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.stopPropagation(); ouvrir(ligne); }
  }, true);
  document.addEventListener('change', async function (event) {
    const input = event.target.closest('.compact-horaire input');
    if (!input || !effectifPeutModifier) return;
    const membre = effectifMembres[Number(input.closest('.effectif-member').dataset.index)];
    const sortie = input.parentElement.querySelector('output');
    input.disabled = true;
    sortie.textContent = 'Enregistrement…';
    try {
      const body = new URLSearchParams({action: 'modifierMembreEffectif', personne: membre.nom, horaire: input.value, identifiant: sessionStorage.getItem('identifiantUtilisateur') || ''});
      const response = await fetch(EFFECTIF_API_URL, {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'}, body: body.toString()});
      const resultat = await response.json();
      if (!resultat.success) throw new Error(resultat.message || 'Enregistrement impossible');
      membre.horaire = input.value;
      sortie.textContent = 'Enregistré';
    } catch (erreur) { sortie.textContent = erreur.message; }
    finally { input.disabled = false; }
  });
  document.addEventListener('change', async function (event) {
    if (event.target.id !== 'effectifCompactActivation') return;
    const controle = event.target;
    controle.disabled = true;
    try {
      await requeteMutationParametresGDA('enregistrerEffectifCompact', {actif: controle.checked});
    } catch (erreur) {
      controle.checked = actif();
      afficherNotificationGDA(erreur.message, 'erreur');
    } finally { controle.disabled = false; }
  });
  const observer = new MutationObserver(function () {
    const themes = document.querySelector('.parametres-themes-section');
    if (!themes || document.getElementById('effectifCompactActivation')) return;
    const bloc = document.createElement('section');
    bloc.className = 'parametres-bloc compact-option-globale';
    bloc.innerHTML = `<div><strong>Effectif officier · détails dépliables</strong><p>Appliqué en direct à tous les utilisateurs.</p></div><label for="effectifCompactActivation"><span>Activer</span><input id="effectifCompactActivation" type="checkbox" ${actif() ? 'checked' : ''} ${typeof parametresSitePeutGerer !== 'undefined' && parametresSitePeutGerer ? '' : 'disabled'}></label>`;
    themes.after(bloc);
  });
  observer.observe(document.body, {childList: true, subtree: true});
})();
