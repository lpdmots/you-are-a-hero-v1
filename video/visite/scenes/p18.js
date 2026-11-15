// Passage 18 — Chacun écrit ses scènes : la cursive sur le cahier, puis la même scène dans la copie
// de l'élève, ses deux choix et les scènes où ils mènent ; l'élève la remet à son enseignante.
window.SCENES.p18 = (tl, t0) => {
  const id = "p18";
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = window.dureeDe(id);
  const q = (s) => `#p18-${s}`;

  window.entreeParNumero(tl, id, 3, t0);
  tl.fromTo(q("filet"), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out" }, T(0.95));
  tl.fromTo(q("titre"), { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, T(1.0));
  // « chaque élève reçoit ses scènes » : la vue « Chemins » du chapitre (choix en onglets), puis le
  // prénom de qui écrit se pose sur chaque scène, de haut en bas
  const W = 450, H = 164;
  const scenes = [
    // [x, y, titre, prénom, onglets : [phrase, scène visée ou sortie]]
    [531, 24, "Île — la clairière aux pierres", "Gabin", [["Garder la lanterne allumée", 1], ["Éteindre la lanterne", 2]]],
    [160, 258, "Île — pour rien", "Hugo", [["Traverser la clairière", 3]]],
    [900, 258, "Île — la lumière dans la brume", "Farah", [["Suivre la lumière", 4], ["Rester immobile", 5]]],
    [24, 492, "Île — la flamme qui veille", "Hugo", [["Monter vers la tour", "La tour"]]],
    [531, 492, "Île — la lumière qui recule", "Jade", [["Courir après elle", "La tour"]]],
    [1038, 492, "Île — la lumière bleutée", "Gabin", [["Rallumer la lanterne", "La tour"]]],
  ];
  const zone = document.querySelector(q("zone"));
  zone.insertAdjacentHTML(
    "beforeend",
    scenes
      .map(([x, y, titre, qui, onglets], i) => `<div class="noeud" id="p18-n${i}" style="left:${x}px;top:${y}px"><div class="tete"><i class="pt"></i><b class="t">${titre}</b><span class="etat">Texte vide<span class="qui" id="p18-qui${i}">·&nbsp;<span class="nom"><span class="eclat"></span><b>${qui}</b></span></span></span></div><div class="onglets">${onglets
        .map(([phrase, vers]) => `<span>${phrase}${typeof vers === "string" ? `<em>→ ${vers}</em>` : ""}</span>`)
        .join("")}</div></div>`)
      .join("")
  );
  const liens = document.querySelector(q("liens"));
  const NS = "http://www.w3.org/2000/svg";
  const traits = [];
  scenes.forEach(([x, y, , , onglets]) => {
    onglets.forEach(([, vers], k) => {
      if (typeof vers !== "number") return;
      const x1 = x + (W / onglets.length) * (k + 0.5), y1 = y + H;
      const [xb, yb] = scenes[vers];
      const x2 = xb + W / 2, y2 = yb - 6;
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", `M ${x1} ${y1} C ${x1} ${y1 + 44}, ${x2} ${y2 - 44}, ${x2} ${y2}`);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "#8b9196");
      p.setAttribute("stroke-width", "3");
      liens.appendChild(p);
      const pointe = document.createElementNS(NS, "path");
      pointe.setAttribute("d", `M ${x2 - 8} ${y2 - 10} L ${x2 + 8} ${y2 - 10} L ${x2} ${y2 + 3} Z`);
      pointe.setAttribute("fill", "#8b9196");
      liens.appendChild(pointe);
      const o = document.createElementNS(NS, "circle");
      o.setAttribute("cx", x1); o.setAttribute("cy", y1); o.setAttribute("r", "6");
      o.setAttribute("fill", "#fff"); o.setAttribute("stroke", "#8b9196"); o.setAttribute("stroke-width", "2.5");
      liens.appendChild(o);
      traits.push([p, o, pointe, Math.ceil(p.getTotalLength()) + 2, Math.round(y / 230)]);
    });
  });

  tl.fromTo(q("rep"), { y: 70, opacity: 0, rotationX: 10, transformPerspective: 1800, transformOrigin: "50% 0%" }, { y: 0, opacity: 1, rotationX: 0, duration: 1.0, ease: "expo.out" }, T(1.05));
  scenes.forEach(([, y], i) => {
    tl.fromTo(q("n" + i), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, ease: "power2.out" }, T(1.25) + Math.round(y / 230) * 0.16 + i * 0.03);
  });
  traits.forEach(([p, o, pointe, L, rang]) => {
    const t = T(1.45) + rang * 0.16;
    tl.fromTo(o, { opacity: 0 }, { opacity: 1, duration: 0.15 }, t);
    tl.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut" }, t);
    tl.fromTo(pointe, { opacity: 0 }, { opacity: 1, duration: 0.1 }, t + 0.32);
  });
  // les prénoms, au mot près : « chaque élève reçoit ses scènes »
  scenes.forEach((_, i) => {
    const t = m("eleve") - 0.05 + i * 0.11;
    tl.fromTo(q("qui" + i), { y: -26, opacity: 0, scale: 1.7, transformOrigin: "0% 60%" }, { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: "back.out(2.2)" }, t);
    tl.fromTo(`${q("qui" + i)} .eclat`, { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, t + 0.2);
    tl.to(`${q("qui" + i)} .eclat`, { opacity: 0, duration: 0.5, ease: "power1.in" }, t + 0.75);
  });
  window.bruit("cartes", m("eleve"), 0.4);

  // « et les écrit » : la répartition s'efface, on est déjà au-dessus du cahier
  const tEcrit = m("ecrit") - 0.35;
  tl.to(q("rep"), { y: -60, opacity: 0, scale: 0.96, duration: 0.45, ease: "power2.in" }, tEcrit);
  tl.to(q("entete"), { x: -66, y: -58, scale: 0.5, duration: 0.9, ease: "power3.inOut" }, tEcrit);

  // La caméra : sur le cahier, puis sur l'ordinateur (origine en haut à gauche)
  const B = { scale: 1.3, x: 980 - 505 * 1.3, y: 590 - 650 * 1.3 };
  const C = { scale: 1.5, x: 800 - 1410 * 1.5, y: 545 - 540 * 1.5 };
  const tCahier = tEcrit - 0.15;
  const tOrdi = m("ordinateurs") - 0.55;
  tl.set(q("camera"), { ...B }, T(0));
  tl.fromTo(q("cahier"), { x: -160, rotation: -7, opacity: 0 }, { x: 0, rotation: -2, opacity: 1, duration: 0.9, ease: "expo.out" }, tEcrit + 0.2);
  tl.fromTo(q("portable"), { x: 200, opacity: 0 }, { x: 0, opacity: 1, duration: 1.0, ease: "power3.out" }, tEcrit + 0.4);
  tl.to(q("camera"), { ...C, duration: 1.15, ease: "power3.inOut" }, tOrdi);

  // L'écriture : chaque ligne se dévoile, le stylo suit sa pointe (le cahier penche de 2°)
  const angle = (-2 * Math.PI) / 180, cx = 120 + 385, cy = 300 + 350;
  const surLaPage = (lx, ly) => {
    const dx = 120 + lx - cx, dy = 300 + ly - cy;
    return { x: cx + dx * Math.cos(angle) - dy * Math.sin(angle), y: cy + dx * Math.sin(angle) + dy * Math.cos(angle) };
  };
  const lignes = [
    ["l0", 380, 72, 16],
    ["l1", 124, 200, 25],
    ["l2", 124, 264, 23],
    ["l3", 124, 328, 23],
    ["l4", 124, 392, 23],
    ["l5", 124, 456, 23],
  ];
  let t = tEcrit + 0.95;
  window.bruit("stylo", t, 0.5);
  tl.fromTo(q("crayon"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, t - 0.3);
  lignes.forEach(([k, lx, ly, n], i) => {
    const largeur = n * 19.5, d = 0.32 + n * 0.024;
    const de = surLaPage(lx, ly + 50), a = surLaPage(lx + largeur, ly + 50);
    tl.fromTo(q(k), { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: d, ease: "none" }, t);
    // la pointe du stylo (4, 176) sur la ligne d'écriture
    tl.fromTo(q("crayon"), { x: de.x - 4, y: de.y - 176 }, { x: a.x - 4, y: a.y - 176, duration: d, ease: "none", immediateRender: i === 0 }, t);
    tl.to(q("crayon"), { rotation: 3, duration: d / 4, yoyo: true, repeat: 3, ease: "sine.inOut" }, t);
    if (i === 0) {
      tl.fromTo(q("souligne"), { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: "power1.inOut" }, t + d + 0.02);
      t += 0.3;
    }
    t += d + 0.08;
  });
  tl.to(q("crayon"), { opacity: 0, duration: 0.3, ease: "power2.in" }, Math.min(t, tOrdi + 0.9));

  // La même scène, tapée dans la copie de l'élève
  const texte = document.querySelector(q("texte"));
  const mots = texte.textContent.split(" ");
  texte.innerHTML = mots.map((x) => `<span class="mot">${x}</span>`).join(" ");
  tl.fromTo(`${q("texte")} .mot`, { opacity: 0 }, { opacity: 1, duration: 0.08, stagger: 0.05, ease: "none" }, m("ordinateurs") + 0.15);

  // Les choix, puis les chemins qui partent vers leurs scènes
  tl.fromTo([q("c1"), q("c2")], { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.16 }, m("choix") - 0.25);
  const ecran = (x, y) => ({ x: x * C.scale + C.x, y: y * C.scale + C.y });
  const fin1 = ecran(1000 + 792, 288 + 300 + 27), fin2 = ecran(1000 + 792, 288 + 354 + 27);
  const K1 = { x: 1505, y: 140 }, K2 = { x: 1505, y: 600 };
  document.querySelector(q("ch1p")).setAttribute("d", `M ${fin1.x + 6} ${fin1.y} C ${fin1.x + 90} ${fin1.y}, ${K1.x - 70} ${K1.y + 140}, ${K1.x - 6} ${K1.y + 140}`);
  document.querySelector(q("ch2p")).setAttribute("d", `M ${fin2.x + 6} ${fin2.y} C ${fin2.x + 90} ${fin2.y}, ${K2.x - 70} ${K2.y + 140}, ${K2.x - 6} ${K2.y + 140}`);
  gsap.set(q("k1"), { left: K1.x, top: K1.y });
  gsap.set(q("k2"), { left: K2.x, top: K2.y });
  const choix = [
    ["c1", "ch1", "k1", m("lumiere") - 0.15],
    ["c2", "ch2", "k2", m("immobile") - 0.15],
  ];
  choix.forEach(([c, ch, k, tc], i) => {
    tl.fromTo(`${q(c)} .fond-choix`, { opacity: 0 }, { opacity: 1, duration: 0.25 }, tc);
    if (i === 1) tl.to(`${q("c1")} .fond-choix`, { opacity: 0, duration: 0.25 }, tc);
    const x0 = Math.round(fin1.x);
    tl.fromTo(q(ch), { clipPath: `inset(0px ${1920 - x0}px 0px 0px)` }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.6, ease: "power2.inOut" }, tc + 0.1);
    tl.fromTo(q(k), { scale: 0.8, opacity: 0, rotation: i ? 3 : -3 }, { scale: 1, opacity: 1, rotation: i ? 1.2 : -1.2, duration: 0.6, ease: "back.out(1.8)" }, tc + 0.5);
  });
  tl.to(`${q("c2")} .fond-choix`, { opacity: 0, duration: 0.3 }, T(fin - 1.6));

  // L'élève remet sa scène : le numéro du bouton mène au passage 4, comme une phrase de choix
  const R = ecran(1000 + 820 - 18 - 22 - 24, 288 + 467);
  tl.to(q("remettre"), { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1 }, T(fin - 1.05));
  window.sortieParRenvoi(tl, id, R.x, R.y, T(fin));
};
