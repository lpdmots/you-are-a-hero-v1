// Passage 26 — Vous relisez et validez : la scène remise arrive, on la relit, une remarque la fait
// reprendre, « Validé » frappe ; puis la caméra recule sur le Suivi de toute la classe.
window.SCENES.p26 = (tl, t0) => {
  const id = "p26";
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = window.dureeDe(id);
  const q = (s) => `#p26-${s}`;

  // Les rangées du Suivi (élèves fictifs de l'histoire d'essai)
  const rangees = [
    ["Quai — la sirène du dernier bac", "Chloé", "valide"],
    ["Passerelle — le bac s’éloigne", "Dylan", "valide"],
    ["Quai — la lanterne qui clignote", "Emma", "valider"],
    ["Cabane — la carte oubliée", "Chloé", "valide"],
    ["Cabane — la carte s’anime", "Dylan", "reprendre"],
    ["Lisière — les lanternes s’éteignent", "Inès", "valide"],
    ["Sentier — le chant des fougères", "Alice", "cours"],
    ["Souche — la lanterne de secours", "Bilal", "valider"],
    ["Souche — la chouette messagère", "Bilal", "valide"],
    ["Gué — les pierres qui chantent", "Farah", "valide"],
    ["Rivière — la pierre glissante", "Gabin", "cours"],
    ["Saule — le nid de la chouette", "Hugo", "valider"],
    ["Clairière — les cloches muettes", "Kenza", "valide"],
    ["Clocher — l’écho du passeur", "Léo", "reprendre"],
    ["Silence — la voix sous la mousse", "Lina", "cours"],
    ["Sanctuaire — mille lucioles", "Malo", "valide"],
  ];
  const NOM = { valide: "Validé", valider: "À valider", reprendre: "À reprendre", cours: "En cours" };
  const SIGNE = { valide: "coche", valider: "sablier", reprendre: "demi-tour", cours: "crayon" };
  const tampon = (e) => `<span class="tampon" data-e="${e}">${window.icone(SIGNE[e])}${NOM[e]}</span>`;
  document.querySelector(q("rangees")).innerHTML = rangees
    .map(([t, el, e], i) => {
      const col = i < 8 ? 0 : 1, rang = i % 8;
      return `<div class="rangee${i === 9 ? " elle" : ""}" id="p26-r${i}" style="left:${34 + col * 826}px;top:${116 + rang * 68}px"><span class="t">${t}</span><span class="main">${el}</span>${tampon(e)}</div>`;
    })
    .join("");

  // Arrivée par le numéro, comme aux autres passages ; la feuille remise glisse jusqu'au bureau
  window.entreeParNumero(tl, id, 4, t0);
  tl.fromTo(q("filet"), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power3.out" }, T(0.95));
  tl.fromTo(q("titre"), { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, T(1.0));
  tl.fromTo(q("feuille"), { x: 260, y: 40, rotation: 3, opacity: 0 }, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, T(0.7));
  tl.set(q("suivi"), { opacity: 0 }, T(0));
  tl.set([q("t-reprendre"), q("t-valide"), q("remarque")], { opacity: 0 }, T(0));

  // Un tampon qui frappe : grand et penché, il s'écrase, la feuille tressaille
  const frappe = (sel, t, angle) => {
    window.bruit("tampon", t + 0.2, 1);
    tl.fromTo(sel, { scale: 2.3, opacity: 0, rotation: angle - 10 }, { scale: 1, opacity: 1, rotation: angle, duration: 0.24, ease: "power4.in" }, t);
    tl.fromTo(q("feuille"), { x: 0, y: 0 }, { x: 3, y: 4, duration: 0.05, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, t + 0.24);
  };
  frappe(q("t-valider"), Math.max(m("remet") + 0.1, T(1.75)), -3);

  // La caméra s'approche doucement de la feuille pendant la lecture
  tl.fromTo(q("feuille"), { scale: 1 }, { scale: 1.07, duration: m("coup") - 0.25 - T(0.6), ease: "sine.inOut" }, T(0.6));

  // On relit : un trait de lecture passe sur les lignes
  ["lu1", "lu2", "lu3", "lu4"].forEach((k, i) => {
    const t = m("relisez") - 0.1 + i * 0.32;
    tl.fromTo(q(k), { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.34, ease: "none" }, t);
    tl.to(q(k), { opacity: 0, duration: 0.35 }, t + 0.5);
  });

  // La remarque s'écrit dans la marge ; « À reprendre » remplace « À valider »
  tl.fromTo(q("remarque"), { opacity: 0, x: 30, scale: 0.94 }, { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, m("remarque") - 0.2);
  window.bruit("stylo", m("remarque") + 0.15, 0.3);
  tl.fromTo(q("rem-t"), { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: 0.9, ease: "power1.inOut" }, m("remarque") + 0.15);
  tl.to(q("t-valider"), { opacity: 0, y: -30, rotation: -14, duration: 0.18, ease: "power2.in" }, m("reprendre") - 0.15);
  frappe(q("t-reprendre"), m("reprendre") - 0.05, 2);

  // Farah reprend sa scène : une phrase s'ajoute ; puis « Validé »
  const tAjout = m("reprendre") + 0.45;
  tl.to(q("ajout"), { height: 53, marginTop: 4, duration: 0.35, ease: "power2.out" }, tAjout);
  tl.fromTo(q("ajout-t"), { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: 0.75, ease: "power1.inOut" }, tAjout + 0.15);
  tl.to(q("remarque"), { opacity: 0.35, duration: 0.3 }, tAjout + 1.0);
  tl.to(q("t-reprendre"), { opacity: 0, y: -30, rotation: 12, duration: 0.18, ease: "power2.in" }, m("validez") - 0.2);
  frappe(q("t-valide"), m("validez") - 0.1, -4);
  // de petits éclats d'encre autour du tampon (positions fixes : le rendu doit être identique)
  const eclats = document.querySelector(q("eclats"));
  // le centre du tampon à l'écran : la feuille grossit doucement autour de son centre (960, 602)
  const pV = Math.min(1, Math.max(0, (m("validez") - T(0.6)) / (m("coup") - 0.25 - T(0.6))));
  const sV = 1 + 0.07 * (-(Math.cos(Math.PI * pV) - 1) / 2);
  const cx = 960 + (300 + 1320 - 40 - 100 - 960) * sV, cy = 602 + (262 + 30 + 32 - 602) * sV - 4;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const e = document.createElement("span");
    e.className = "eclat";
    e.id = `p26-e${i}`;
    eclats.appendChild(e);
    tl.fromTo(e, { x: cx + Math.cos(a) * 70, y: cy + Math.sin(a) * 50, rotation: (a * 180) / Math.PI + 90, opacity: 1, scaleY: 0.4 }, { x: cx + Math.cos(a) * 150, y: cy + Math.sin(a) * 105, opacity: 0, scaleY: 1, duration: 0.45, ease: "power2.out", immediateRender: false }, m("validez") + 0.14);
  }

  // « d'un coup d'œil » : la scène rejoint sa rangée, le Suivi de la classe apparaît autour
  // « Vous l'illustrez ensuite » : la remarque laisse la place à l'illustration ; le panneau de
  // l'application glisse à droite. « un dessin de la classe » : le curseur survole l'import ;
  // « l'IA » : un clic, l'IA dessine, et l'image vole se poser dans la scène
  const tIll = m("illustrez") - 0.35;
  tl.set([q("illus"), q("panneau")], { opacity: 0 }, T(0));
  tl.to(q("remarque"), { opacity: 0, x: 24, duration: 0.3, ease: "power2.in" }, tIll);
  tl.fromTo(q("illus"), { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)", immediateRender: false }, tIll + 0.15);
  tl.fromTo(q("panneau"), { x: 700, opacity: 1 }, { x: 0, opacity: 1, duration: 0.6, ease: "power3.out", immediateRender: false }, tIll + 0.25);
  const P = { x: 1186, y: 214 };
  const survolDessin = { x: P.x + 330, y: P.y + 100 + 38 };
  const boutonIA = { x: P.x + 200, y: P.y + 192 + 38 };
  const tDessin = Math.max(m("dessin") - 0.45, tIll + 0.9);
  window.curseurVers(tl, q("curseur"), { x: survolDessin.x + 200, y: survolDessin.y + 300, o: 0 }, survolDessin, tDessin, 0.55);
  tl.fromTo(`${q("opt-dessin")} .survol`, { opacity: 0 }, { opacity: 1, duration: 0.2 }, tDessin + 0.5);
  const tClicIA = Math.max(m("ia") - 0.15, tDessin + 1.3);
  tl.to(`${q("opt-dessin")} .survol`, { opacity: 0, duration: 0.2 }, tClicIA - 0.55);
  window.curseurVers(tl, q("curseur"), survolDessin, boutonIA, tClicIA - 0.55, 0.5);
  tl.fromTo(`${q("opt-ia")} .survol`, { opacity: 0 }, { opacity: 1, duration: 0.15 }, tClicIA - 0.1);
  window.clic(tl, q("curseur"), q("clic"), boutonIA.x, boutonIA.y, tClicIA);
  tl.to(q("opt-ia"), { scale: 0.97, duration: 0.08, yoyo: true, repeat: 1 }, tClicIA);
  // l'IA dessine : trois étincelles qui palpitent, puis l'image naît dans l'aperçu
  window.bruit("etincelles", tClicIA + 0.1, 0.55);
  tl.fromTo(q("dessine"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, tClicIA + 0.1);
  tl.fromTo(`${q("dessine")} svg`, { scale: 0.6, rotation: -20 }, { scale: 1.15, rotation: 20, duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: 2, stagger: 0.1 }, tClicIA + 0.1);
  const tImg = tClicIA + 0.85;
  const A = { x: P.x + 40 + 2.5, y: P.y + 290 + 2.5 };
  tl.fromTo(q("vol"), { x: A.x, y: A.y, scale: 0.995, opacity: 0, filter: "blur(16px) brightness(1.3)" }, { opacity: 1, filter: "blur(0px) brightness(1)", duration: 0.8, ease: "power2.out" }, tImg);
  tl.fromTo(q("vol-reflet"), { left: "-50%" }, { left: "130%", duration: 0.8, ease: "sine.inOut" }, tImg + 0.5);
  tl.to(q("curseur"), { opacity: 0, duration: 0.3 }, tImg);
  // elle vole jusqu'à sa place dans la feuille (qui grossit doucement autour de son centre), le panneau se retire
  const tVol = tImg + 1.15;
  const debutPousse = T(0.6), dureePousse = m("coup") - 0.25 - T(0.6);
  const avance = Math.min(1, Math.max(0, (tVol + 0.45 - debutPousse) / dureePousse));
  const sF = 1 + 0.07 * (-(Math.cos(Math.PI * avance) - 1) / 2);
  const place = { x: 960 + (300 + 950 - 960) * sF, y: 602 + (262 + 188 - 602) * sF, s: (340 * sF) / 560 };
  tl.to(q("vol"), { x: place.x, y: place.y, scale: place.s, duration: 0.5, ease: "power3.inOut" }, tVol);
  tl.to(q("panneau"), { x: 700, duration: 0.45, ease: "power3.in" }, tVol + 0.05);
  tl.set(q("ill-img"), { opacity: 1 }, tVol + 0.5);
  tl.set(q("vol"), { opacity: 0 }, tVol + 0.5);

  const tRecul = Math.max(m("coup") - 0.25, tVol + 0.6);
  const cible = { x: 120 + 34 + 826 + 395, y: 262 + 116 + 68 + 32 };
  tl.to(q("feuille"), { x: cible.x - (300 + 660), y: cible.y - (262 + 340), scale: 0.6, opacity: 0, duration: 0.9, ease: "power3.inOut" }, tRecul);
  tl.to(q("eclats"), { opacity: 0, duration: 0.2 }, tRecul);
  tl.fromTo(q("suivi"), { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 1.0, ease: "power3.out" }, tRecul + 0.15);
  rangees.forEach((_, i) => {
    const d = Math.abs(i - 9) * 0.035;
    tl.fromTo(q("r" + i), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, tRecul + 0.35 + d);
  });
  tl.fromTo(`${q("filtres")} .tampon`, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)", stagger: 0.08 }, tRecul + 0.5);
  document.querySelectorAll(`${q("filtres")} .n`).forEach((n) => {
    const compte = { v: 0 };
    tl.to(compte, { v: Number(n.dataset.n), duration: 0.9, ease: "power2.out", onUpdate: () => (n.textContent = Math.round(compte.v)) }, tRecul + 0.65);
  });

  // Le choix vers le passage 5, dès que la voix se tait
  const tChoix = Math.min(T(window.finVoix(id)) + 0.1, T(fin - 2.0));
  tl.fromTo(q("filet-choix"), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power3.out" }, tChoix);
  tl.fromTo(q("choix"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, tChoix + 0.1);
  window.sortieParRenvoi(tl, id, 1800 - 38, 968 + 24, T(fin));
};
