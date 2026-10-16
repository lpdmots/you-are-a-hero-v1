"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import {
  commencer, feuilleDeDepart, reprendre, revenir, suivre, type EtatFeuille, type LectureGardee,
} from "@/domaine/lecture";
import { chapitresLus, livreLuDe, premiersMots, type ChapitreLu, type PresentationPartagee, type VersionPartagee } from "@/domaine/partage";
import type { TexteLeger } from "@/domaine/pages";
import { Feuille, resumeFeuille } from "./Feuille";
import { Mots, Passage, SourceDesImages, type SourceImage } from "./Passage";

/**
 * Le lecteur en ligne (F12.1) : la version partagée, lue sans compte par le lien, par un élève
 * depuis « Lire », ou prévisualisée par l'adulte. La page blanche du livre étendue à l'écran,
 * en Vollkorn, sans barre d'application, sans couleur de chapitre ni référence : ce qui le
 * distingue de la lecture d'essai et de l'aperçu (design, « Partage et lecteur en ligne »).
 *
 * La lecture est retenue sur l'appareil pour le lien, avec le profil pour un élève, et pas du
 * tout en prévisualisation. Elle suit les passages par leur identité : après une mise à jour,
 * elle reprend où elle était si le passage existe encore (F12-AC25).
 */

export type Memoire =
  | { sorte: "appareil"; cle: string }
  | { sorte: "profil"; initiale: unknown; garder: (l: LectureGardee) => void; prenom: string }
  | { sorte: "aucune" };

type Ecran = { sorte: "accueil" } | { sorte: "comment" } | { sorte: "lecture" };

const lireAppareil = (cle: string): unknown => {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
};
const garderAppareil = (cle: string, l: LectureGardee | null) => {
  try {
    if (l) localStorage.setItem(cle, JSON.stringify(l));
    else localStorage.removeItem(cle);
  } catch {
    // Sans stockage, la lecture tient le temps de la page
  }
};

/** Un texte court de page de présentation : des paragraphes de lettres. */
function TexteCourt({ texte }: { texte: TexteLeger }) {
  return (
    <>
      {texte.filter((p) => p.some((l) => l.text.trim())).map((p, i) => (
        <p key={i}>
          <Mots mots={p} />
        </p>
      ))}
    </>
  );
}

function ImagePleinePage({ image, source, alt }: { image: string; source: SourceImage; alt: string }) {
  const s = source(image, false);
  // eslint-disable-next-line @next/next/no-img-element -- servie par l'application, d'après la version partagée
  return <img className="lecteur__pleine-page" src={s.src} srcSet={s.srcSet} sizes={s.sizes} alt={alt} />;
}

function PageDesAuteurs({ p, source }: { p: NonNullable<PresentationPartagee["auteurs"]>; source: SourceImage }) {
  return (
    <section className="lecteur__presentation lecteur__auteurs recit" aria-label="Les auteurs">
      {p.image ? (
        <ImagePleinePage image={p.image} source={source} alt="Les auteurs du livre" />
      ) : (
        <>
          {p.introduction ? <p className="lecteur__auteurs-intro">{p.introduction}</p> : null}
          <ul className="lecteur__noms">
            {p.noms.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          {p.conclusion ? <p className="lecteur__auteurs-intro">{p.conclusion}</p> : null}
        </>
      )}
    </section>
  );
}

function PageDeFin({ p, source }: { p: NonNullable<PresentationPartagee["fin"]>; source: SourceImage }) {
  return (
    <section className="lecteur__presentation recit" aria-label="Page de fin">
      {p.image ? <ImagePleinePage image={p.image} source={source} alt="Page de fin du livre" /> : <TexteCourt texte={p.texte} />}
    </section>
  );
}

/** « Comment lire ce livre » à l'écran : le texte de l'application, puis les règles de l'adulte (F12.1, amendement du 2 octobre 2026). */
function CommentLire({ version, retour }: { version: VersionPartagee; retour: ReactNode }) {
  const c = version.presentation?.commentLire;
  return (
    <article className="lecteur__page recit lecteur__comment" aria-labelledby="comment-t">
      <h1 id="comment-t" className="lecteur__titre-page">
        Comment lire ce livre
      </h1>
      <p>Ce livre ne se lit pas d’une traite : c’est toi qui choisis le chemin du héros.</p>
      <p>À la fin de chaque passage, choisis ce que tu veux faire : touche ta phrase, et tu arrives au passage qui porte son numéro.</p>
      <p>Tu peux revenir en arrière quand tu veux : « Parcours » garde la liste des passages que tu as lus.</p>
      {c?.enigmes ? <p>Parfois, un passage cache une énigme : trouve le bon numéro et écris-le dans la case pour continuer.</p> : null}
      {version.feuille ? <p>Ta feuille d’aventure s’ouvre avec « Ma feuille » : c’est toi qui la remplis, comme au crayon. Rien n’y est vérifié.</p> : null}
      <p>Certaines fins sont heureuses, d’autres non : tu peux toujours recommencer et essayer un autre chemin.</p>
      {c?.regles.trim() ? (
        <section className="lecteur__regles" aria-labelledby="regles-t">
          <h2 id="regles-t">Règles du jeu</h2>
          {c.regles.split(/\n+/).map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </section>
      ) : null}
      <p className="lecteur__retour">{retour}</p>
    </article>
  );
}

export function LecteurEnLigne({
  version, source, memoire, bandeau,
}: {
  version: VersionPartagee;
  source: SourceImage;
  memoire: Memoire;
  /** Au-dessus du livre : la prévisualisation de l'adulte, le retour aux lectures de l'élève */
  bandeau?: ReactNode;
}) {
  const dire = useMessage();
  const livre = useMemo(() => livreLuDe(version), [version]);
  const chapitres = useMemo(() => (version.aChoix ? [] : chapitresLus(version)), [version]);
  const debut = version.aChoix ? livre.departId : (chapitres[0]?.passages[0]?.id ?? null);
  const neuve = (): LectureGardee | null => (debut ? { parcours: commencer(debut), deja: [], feuille: feuilleDeDepart(livre.feuille), des: null } : null);

  // La lecture retenue n'est lue qu'une fois la page montée : l'appareil n'est connu que là
  const [pret, setPret] = useState(memoire.sorte !== "appareil");
  const [retenue, setRetenue] = useState<{ lecture: LectureGardee | null; perdue: boolean }>(() =>
    memoire.sorte === "profil" ? reprendre(memoire.initiale, livre) : { lecture: null, perdue: false },
  );
  useEffect(() => {
    if (memoire.sorte !== "appareil") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'appareil n'est lisible qu'une fois la page montée
    setRetenue(reprendre(lireAppareil(memoire.cle), livre));
    setPret(true);
  }, [memoire, livre]);

  const [ecran, setEcran] = useState<Ecran>({ sorte: "accueil" });
  const [g, setG] = useState<LectureGardee | null>(null);
  const [parcoursOuvert, setParcoursOuvert] = useState(false);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const aside = useRef<HTMLElement>(null);
  const haut = useRef<HTMLDivElement>(null);

  // Ce qui change se garde : sur l'appareil, ou pour le profil de l'élève
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    if (!g) return;
    if (memoire.sorte === "appareil") garderAppareil(memoire.cle, g);
    if (memoire.sorte === "profil") memoire.garder(g);
  }, [g, memoire]);

  const id = g ? g.parcours.etapes[g.parcours.position] : null;
  const montre = g ? `${ecran.sorte}/${g.parcours.position}/${g.parcours.etapes.length}` : ecran.sorte;
  const avant = useRef(montre);
  useEffect(() => {
    if (avant.current === montre) return;
    avant.current = montre;
    window.scrollTo({ top: 0 });
    haut.current?.focus({ preventScroll: true });
  }, [montre]);

  useEffect(() => {
    if (!feuilleOuverte) return;
    const fermer = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setFeuilleOuverte(false);
    };
    window.addEventListener("keydown", fermer);
    return () => window.removeEventListener("keydown", fermer);
  }, [feuilleOuverte]);

  if (!debut) {
    return <p className="lecteur__vide">Ce livre n’a pas encore de passage à lire.</p>;
  }

  const lancer = (l: LectureGardee) => {
    setG(l);
    setEcran({ sorte: "lecture" });
  };
  const recommencer = () => {
    const ancienne = g ?? retenue.lecture;
    lancer(neuve()!);
    setRetenue({ lecture: null, perdue: false });
    if (ancienne && ancienne.parcours.etapes.length > 1) dire({ texte: "La lecture reprend au début.", annuler: () => lancer(ancienne) });
  };
  const aller = (vers: string, renvoi?: string) =>
    setG((x) => (x ? { ...x, parcours: suivre(x.parcours, vers), deja: renvoi && !x.deja.includes(renvoi) ? [...x.deja, renvoi] : x.deja } : x));
  const precedent = () => setG((x) => (x ? { ...x, parcours: revenir(x.parcours, x.parcours.position - 1) } : x));
  const ouvrirFeuille = (versLeDe = false) => {
    setFeuilleOuverte(true);
    requestAnimationFrame(() => {
      const cible = versLeDe ? aside.current?.querySelector<HTMLElement>("#feuille-de") : null;
      if (cible) cible.scrollIntoView({ block: "nearest" });
      else aside.current?.scrollTo({ top: 0 });
    });
  };

  const passage = id && version.aChoix ? version.passages.find((p) => p.id === id) ?? null : null;
  const chapitre: ChapitreLu | null = id && !version.aChoix ? chapitres.find((c) => c.passages[0].id === id) ?? null : null;
  const rangChapitre = chapitre ? chapitres.indexOf(chapitre) : -1;
  const present = version.presentation;
  const commentLire = Boolean(version.aChoix && present?.commentLire);
  // La lecture en cours, ou celle retenue : « Continuer » y ramène
  const enCours = g ?? retenue.lecture;
  const reprise = enCours && enCours.parcours.etapes.length > 1 ? enCours : null;
  const ouReprendre = (l: LectureGardee) => {
    const pid = l.parcours.etapes[l.parcours.position];
    if (version.aChoix) return `Continuer au passage ${version.passages.find((p) => p.id === pid)?.numero ?? ""}`;
    return `Continuer au chapitre ${chapitres.find((c) => c.passages[0].id === pid)?.numero ?? ""}`;
  };
  const nomDe = (pid: string) => {
    const p = version.passages.find((x) => x.id === pid);
    if (!p) return "Passage";
    if (!version.aChoix) {
      const c = chapitres.find((x) => x.passages[0].id === pid);
      return c ? `Chapitre ${c.numero}${c.titre ? ` · ${c.titre}` : ""}` : "Chapitre";
    }
    return `${p.numero ?? ""} · ${premiersMots(p)}`;
  };
  const ou =
    memoire.sorte === "appareil"
      ? "Ta lecture est retenue sur cet appareil."
      : memoire.sorte === "profil"
        ? `Ta lecture est retenue avec ton prénom, ${memoire.prenom}.`
        : null;

  const feuille = livre.feuille && g ? (
    <Feuille
      feuille={livre.feuille}
      etat={g.feuille}
      onChange={(f: EtatFeuille) => setG((x) => (x ? { ...x, feuille: f } : x))}
      des={g.des}
      onDes={(des) => setG((x) => (x ? { ...x, des } : x))}
      regles={livre.regles}
    />
  ) : null;

  return (
    <SourceDesImages value={source}>
      <div className={`lecteur${livre.feuille && ecran.sorte === "lecture" ? " lecteur--feuille" : ""}`}>
        {bandeau}
        <header className="lecteur__barre">
          <button type="button" className="lecteur__nom recit" onClick={() => setEcran({ sorte: "accueil" })}>
            {version.titre}
          </button>
          <nav className="lecteur__outils" aria-label="Outils de lecture">
            {commentLire ? (
              <button type="button" className="lecteur__outil" aria-pressed={ecran.sorte === "comment"} onClick={() => setEcran(ecran.sorte === "comment" ? { sorte: g ? "lecture" : "accueil" } : { sorte: "comment" })}>
                <Icone nom="info" />
                <span>Comment lire</span>
              </button>
            ) : null}
            {livre.feuille && g && ecran.sorte === "lecture" ? (
              <button type="button" className="lecteur__outil lecteur__feuille-b" aria-expanded={feuilleOuverte} aria-controls="feuille-aventure" onClick={() => (feuilleOuverte ? setFeuilleOuverte(false) : ouvrirFeuille())}>
                <Icone nom="feuille" />
                <span>Ma feuille</span>
              </button>
            ) : null}
            {g && ecran.sorte === "lecture" ? (
              <div className="lecteur__parcours">
                <button type="button" className="lecteur__outil" aria-expanded={parcoursOuvert} onClick={() => setParcoursOuvert((o) => !o)}>
                  <Icone nom={version.aChoix ? "chemins" : "cahier"} />
                  <span>{version.aChoix ? "Parcours" : "Sommaire"}</span>
                  {version.aChoix ? <span className="lecteur__compte">{g.parcours.position + 1}</span> : null}
                </button>
                {parcoursOuvert ? (
                  <ol className="lecteur__etapes" aria-label={version.aChoix ? "Passages lus" : "Sommaire"}>
                    {version.aChoix
                      ? g.parcours.etapes.map((e, i) => (
                          <li key={`${i}-${e}`}>
                            <button
                              type="button"
                              aria-current={i === g.parcours.position ? "step" : undefined}
                              onClick={() => {
                                setG((x) => (x ? { ...x, parcours: revenir(x.parcours, i) } : x));
                                setParcoursOuvert(false);
                              }}
                            >
                              {nomDe(e)}
                            </button>
                          </li>
                        ))
                      : chapitres.map((c) => (
                          <li key={c.passages[0].id}>
                            <button
                              type="button"
                              aria-current={c === chapitre ? "step" : undefined}
                              onClick={() => {
                                aller(c.passages[0].id);
                                setParcoursOuvert(false);
                              }}
                            >
                              <b>{c.numero}</b> {c.titre || `Chapitre ${c.numero}`}
                            </button>
                          </li>
                        ))}
                  </ol>
                ) : null}
              </div>
            ) : null}
          </nav>
        </header>

        <div ref={haut} tabIndex={-1} className="lecteur__ancre" aria-label={ecran.sorte === "lecture" && id ? nomDe(id) : version.titre} />

        <main className="lecteur__corps">
          {ecran.sorte === "accueil" ? (
            <>
              <article className="lecteur__page lecteur__accueil">
                {present?.titre.image ? (
                  <ImagePleinePage image={present.titre.image} source={source} alt={version.titre} />
                ) : (
                  <div className="lecteur__titre recit">
                    <h1>{version.titre}</h1>
                    {present?.titre.sousTitre ? <p className="lecteur__sous-titre">{present.titre.sousTitre}</p> : null}
                    {present?.titre.illustration ? (
                      <ImagePleinePage image={present.titre.illustration} source={source} alt="" />
                    ) : null}
                    <svg className="lecteur__ornement" viewBox="0 0 120 10" aria-hidden="true">
                      <path d="M0 5h52M68 5h52" />
                      <path d="M60 1.5l3.5 3.5L60 8.5 56.5 5z" />
                    </svg>
                    {present?.titre.ligne ? <p className="lecteur__ligne">{present.titre.ligne}</p> : null}
                    {present?.titre.annee ? <p className="lecteur__annee">{present.titre.annee}</p> : null}
                  </div>
                )}
                <div className="lecteur__depart">
                  {!pret ? null : reprise ? (
                    <>
                      <button type="button" className="btn btn--primaire btn--grand" onClick={() => lancer(reprise)}>
                        <Icone nom="fleche" />
                        {ouReprendre(reprise)}
                      </button>
                      <button type="button" className="btn" onClick={recommencer}>
                        <Icone nom="refaire" />
                        Recommencer au début
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn--primaire btn--grand" onClick={() => lancer(neuve()!)}>
                      <Icone nom="fleche" />
                      Commencer la lecture
                    </button>
                  )}
                  {pret && retenue.perdue ? <p className="lecteur__perdue">Le livre a été mis à jour : la lecture reprend au début.</p> : null}
                  {commentLire ? (
                    <button type="button" className="lien" onClick={() => setEcran({ sorte: "comment" })}>
                      Comment lire ce livre
                    </button>
                  ) : null}
                  {ou ? <p className="lecteur__ou">{ou}</p> : null}
                </div>
              </article>
              {present?.auteurs && present.auteurs.place === "debut" ? <PageDesAuteurs p={present.auteurs} source={source} /> : null}
            </>
          ) : ecran.sorte === "comment" ? (
            <CommentLire
              version={version}
              retour={
                <button type="button" className="btn" onClick={() => setEcran({ sorte: g ? "lecture" : "accueil" })}>
                  <Icone nom="fleche-g" />
                  {g && id ? `Reprendre au passage ${version.passages.find((p) => p.id === id)?.numero ?? ""}` : "Retour à la première page"}
                </button>
              }
            />
          ) : passage ? (
            <>
              <article className="lecteur__page" aria-label={`Passage ${passage.numero ?? ""}`}>
                {passage.partie ? <p className="lecteur__partie recit">{passage.partie}</p> : null}
                {passage.numero ? <p className="lu-numero-passage">{passage.numero}</p> : null}
                <Passage
                  passage={livre.passages[passage.id]}
                  deja={new Set(g?.deja ?? [])}
                  pourEleve
                  passerEnigme={false}
                  onSuivre={(r) => (r.cible.sorte === "passage" ? aller(r.cible.id, r.renvoi) : undefined)}
                  onEnigme={(e) => (e.cible.sorte === "passage" ? aller(e.cible.id, e.id) : undefined)}
                  onAction={livre.feuille ? (signe) => (feuilleOuverte ? setFeuilleOuverte(false) : ouvrirFeuille(signe === "de" && livre.feuille!.des > 0)) : undefined}
                  feuilleOuverte={feuilleOuverte}
                />
                {passage.fin ? (
                  <div className="lu-fin">
                    <p className="lu-fin__marque">{version.marqueFin}</p>
                    <button type="button" className="btn" onClick={recommencer}>
                      <Icone nom="refaire" />
                      Recommencer
                    </button>
                  </div>
                ) : null}
              </article>
              {passage.fin && present?.auteurs && present.auteurs.place === "fin" ? <PageDesAuteurs p={present.auteurs} source={source} /> : null}
              {passage.fin && present?.fin ? <PageDeFin p={present.fin} source={source} /> : null}
              {g && g.parcours.position > 0 ? (
                <p className="lecteur__precedent">
                  <button type="button" className="lien" onClick={precedent}>
                    <Icone nom="fleche-g" />
                    Revenir au passage précédent
                  </button>
                </p>
              ) : null}
            </>
          ) : chapitre ? (
            <>
              <article className="lecteur__page" aria-label={chapitre.titre || `Chapitre ${chapitre.numero}`}>
                {chapitre.partie ? <p className="lecteur__partie recit">{chapitre.partie}</p> : null}
                {chapitre.imprime ? (
                  <h2 className="lecteur__chapitre recit">
                    <span>Chapitre {chapitre.numero}</span>
                    {chapitre.titre}
                  </h2>
                ) : null}
                {chapitre.passages.map((p) => (
                  <div key={p.id} className="lecteur__scene">
                    {p.separateur ? (
                      <svg className="lecteur__filet" viewBox="0 0 120 10" aria-hidden="true">
                        <path d="M0 5h52M68 5h52" />
                        <path d="M60 1.5l3.5 3.5L60 8.5 56.5 5z" />
                      </svg>
                    ) : null}
                    {p.partie && p !== chapitre.passages[0] ? <p className="lecteur__partie recit">{p.partie}</p> : null}
                    <Passage passage={livre.passages[p.id]} deja={new Set()} pourEleve passerEnigme={false} onSuivre={() => undefined} onEnigme={() => undefined} />
                  </div>
                ))}
              </article>
              {rangChapitre === chapitres.length - 1 ? (
                <>
                  {present?.auteurs && present.auteurs.place === "fin" ? <PageDesAuteurs p={present.auteurs} source={source} /> : null}
                  {present?.fin ? <PageDeFin p={present.fin} source={source} /> : null}
                </>
              ) : null}
              <p className="lecteur__chapitres">
                {rangChapitre > 0 ? (
                  <button type="button" className="btn" onClick={() => aller(chapitres[rangChapitre - 1].passages[0].id)}>
                    <Icone nom="fleche-g" />
                    Chapitre précédent
                  </button>
                ) : (
                  <span />
                )}
                {rangChapitre < chapitres.length - 1 ? (
                  <button type="button" className="btn btn--primaire" onClick={() => aller(chapitres[rangChapitre + 1].passages[0].id)}>
                    Chapitre suivant
                    <Icone nom="fleche" />
                  </button>
                ) : (
                  <button type="button" className="btn" onClick={recommencer}>
                    <Icone nom="refaire" />
                    Relire depuis le début
                  </button>
                )}
              </p>
            </>
          ) : null}
        </main>

        {feuille && ecran.sorte === "lecture" ? (
          <aside ref={aside} id="feuille-aventure" className={`lecteur__feuille${feuilleOuverte ? " est-ouverte" : ""}`} aria-label="Feuille d’aventure">
            <header>
              <h2 className="recit">Feuille d’aventure</h2>
              <button type="button" className="lien lecture__ranger" onClick={() => setFeuilleOuverte(false)}>
                <Icone nom="fermer" />
                Ranger
              </button>
            </header>
            {feuille}
            {ou ? <p className="lecteur__ou lecteur__ou--feuille">{ou.replace("Ta lecture est retenue", "Ta feuille est retenue")}</p> : null}
          </aside>
        ) : null}

        {livre.feuille && g && ecran.sorte === "lecture" ? (
          <div className="lecteur__barre-basse">
            <button type="button" className="btn" aria-expanded={feuilleOuverte} onClick={() => (feuilleOuverte ? setFeuilleOuverte(false) : ouvrirFeuille())}>
              <Icone nom="feuille" />
              Ma feuille
            </button>
            <span className="lecteur__resume">{resumeFeuille(livre.feuille, g.feuille)}</span>
          </div>
        ) : null}
      </div>
    </SourceDesImages>
  );
}
