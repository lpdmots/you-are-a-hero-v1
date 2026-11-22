// Vidéo des aides de l'IA — outils en plus de tuto.js : le solde réel posé sur la table (il descend
// du débit de chaque aide, lu dans captures/mesures.json par window.MESURES), la phrase dictée qui
// s'affiche mot à mot, le saut du temps, les notes de l'histoire. Ce ne sont pas des écrans de
// l'application, qui ne montre jamais de prix par demande (F14).
window.AIDES = (() => {
  const M = window.MESURES;
  const IA = '<path d="M10 4c.4 3.6 1.9 5.5 6.5 6.5-4.6 1-6.1 2.9-6.5 6.5-.4-3.6-1.9-5.5-6.5-6.5C8.1 9.5 9.6 7.6 10 4z"/><path d="M18 3v4M16 5h4"/><path d="M18 16.5v4M16 18.5h4"/>';
  const MICRO = '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3"/>';
  const racine = (id) => document.getElementById(`s-${id}`);
  /** Le solde du compte d'essai une fois cette aide débitée (consigne, bloc, correction, description, image) */
  const apres = (aide) => M.mesures.find((m) => m.aide === aide).solde;
  /** La durée réelle de la réponse, en secondes */
  const duree = (aide) => M.mesures.find((m) => m.aide === aide).ms / 1000;

  /** L'étiquette du solde, dans le coin de la table : valeurs = les soldes que ce passage montre, dans l'ordre */
  function solde(id, valeurs) {
    const e = document.createElement("div");
    e.className = "solde-table";
    e.id = `${id}-solde`;
    e.innerHTML = `<svg viewBox="0 0 24 24">${IA}</svg><span class="nombres">${valeurs.map((v, i) => `<b id="${id}-solde-${i}" style="opacity:${i ? 0 : 1}">${v}</b>`).join("")}</span>${valeurs
      .slice(1)
      .map((v, i) => `<span class="debit" id="${id}-debit-${i + 1}">− ${valeurs[i] - v}</span>`)
      .join("")}`;
    racine(id).appendChild(e);
    return {
      /** Le solde passe à la valeur n° i : l'ancien nombre monte et s'efface, le débit flotte un instant */
      descendre(tl, i, t) {
        tl.to(`#${id}-solde-${i - 1}`, { y: -26, opacity: 0, duration: 0.35, ease: "power2.in" }, t);
        tl.fromTo(`#${id}-solde-${i}`, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(2)", immediateRender: false }, t + 0.25);
        tl.fromTo(`#${id}-solde`, { scale: 1 }, { scale: 1.14, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, t + 0.2);
        tl.fromTo(`#${id}-debit-${i}`, { y: -6, opacity: 0 }, { y: 8, opacity: 1, duration: 0.35, ease: "power2.out", immediateRender: false }, t + 0.1);
        tl.to(`#${id}-debit-${i}`, { y: 26, opacity: 0, duration: 0.5, ease: "power1.in" }, t + 1.5);
        window.bruit("etincelles", t + 0.1, 0.35);
      },
      montrer: (tl, t, d = 0.5) => tl.fromTo(`#${id}-solde`, { y: -120, opacity: 0 }, { y: 0, opacity: 1, duration: d, ease: "back.out(1.6)", immediateRender: false }, t),
      cacher: (tl, t, d = 0.4) => tl.to(`#${id}-solde`, { y: -120, opacity: 0, duration: d, ease: "power2.in" }, t),
      sel: `#${id}-solde`,
    };
  }

  /** La phrase dictée, au bas de la table : chaque mot s'allume quand l'enseignante le dit (t : début de sa voix) */
  function dictee(tl, id, t) {
    const D = window.DICTEE;
    const e = document.createElement("div");
    e.className = "dictee-table";
    e.id = `${id}-dictee`;
    e.innerHTML = `<div class="bulle"><span class="pastille"><svg viewBox="0 0 24 24">${MICRO}</svg></span><span class="mots">« ${D.mots.map((m, i) => `<span id="${id}-dit-${i}">${m.m}</span>`).join(" ")} »</span></div>`;
    racine(id).appendChild(e);
    tl.fromTo(`#${id}-dictee`, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", immediateRender: false }, t - 0.5);
    D.mots.forEach((m, i) => tl.to(`#${id}-dit-${i}`, { opacity: 1, duration: 0.12 }, t + m.t));
    window.bruit("dictee", t, 3.2);
    return { fin: t + D.duree, cacher: (t2) => tl.to(`#${id}-dictee`, { y: 40, opacity: 0, duration: 0.4, ease: "power2.in" }, t2) };
  }

  /** « 12 secondes plus tard » : le temps sauté, dit sur la table */
  function saut(tl, id, secondes, t, d = 2.2) {
    const e = document.createElement("div");
    e.className = "saut-table";
    e.id = `${id}-saut`;
    e.innerHTML = `<b>${Math.round(secondes)} secondes</b> plus tard…`;
    racine(id).appendChild(e);
    tl.fromTo(`#${id}-saut`, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out", immediateRender: false }, t);
    tl.to(`#${id}-saut`, { y: 20, opacity: 0, duration: 0.35, ease: "power2.in" }, t + d);
  }

  /** Une note posée sur la table (html : son contenu), à la place (x, y) de l'écran, de largeur l */
  let notes = 0;
  function note(id, html, x, y, l, angle = 0) {
    const e = document.createElement("div");
    e.className = "note-table";
    e.id = `${id}-note-${++notes}`;
    e.style.cssText = `left:${x}px;top:${y}px;width:${l}px;transform:rotate(${angle}deg)`;
    e.innerHTML = html;
    racine(id).appendChild(e);
    return `#${e.id}`;
  }

  /**
   * Une attente qui bouge (retour du porteur : un anneau figé « n'est pas joli ») : les images de
   * captures/attentes/<nom>-NNN.png, prises une à une par le script de captures (l'anneau qui tourne,
   * les points, l'icône qui scintille), rejouées en boucle sur leur zone de t à t + d.
   */
  function attente(tl, id, nom, t, d) {
    const z = window.ATTENTES && window.ATTENTES.zones[nom];
    if (!z || d <= 0) return;
    const f = document.getElementById(`${id}-feuille`);
    const c = document.createElement("div");
    c.className = "morceau";
    c.id = `${id}-attente-${nom}`;
    c.style.cssText = `left:${z.x}px;top:${z.y}px;width:${z.l}px;height:${z.h}px;overflow:hidden`;
    c.innerHTML = Array.from({ length: z.images }, (_, k) => `<img src="captures/attentes/${nom}-${String(k).padStart(3, "0")}.png?v=${window.ATTENTES.version}" alt="" style="position:absolute;left:0;top:0;width:100%;height:100%;visibility:${k ? "hidden" : "visible"}">`).join("");
    f.insertBefore(c, f.querySelector(".clic-app"));
    const images = [...c.querySelectorAll("img")];
    const avance = { k: 0 };
    let montree = 0;
    const poser = () => {
      const k = Math.floor(avance.k) % z.images;
      if (k === montree) return;
      images[montree].style.visibility = "hidden";
      images[k].style.visibility = "visible";
      montree = k;
    };
    tl.set(`#${c.id}`, { opacity: 1 }, t);
    tl.to(avance, { k: d / z.pas, duration: d, ease: "none", onUpdate: poser }, t);
    tl.set(`#${c.id}`, { opacity: 0 }, t + d);
  }

  return { IA, apres, duree, solde, dictee, saut, note, attente };
})();
