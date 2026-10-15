"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { avantDePartir } from "@/composants/copie/sortie";
import type { Plan } from "@/domaine/recit";
import type { DonneesDeLaScene } from "@/serveur/scene";
import { EcranAide } from "@/composants/EcranAide";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { ETAPES_DU_LIVRE, MOT_DE_MARQUE, type EtapeLivre, type MarqueEtape } from "@/domaine/livre";
import { pluriel } from "@/domaine/texte";
import { reglerAide } from "../../../actions-compte";
import { accepterAvertissement, declarerChemins, declarerRelu, noterEtapeDuLivre, ouvrirSceneDuLivre, retirerAcceptation } from "../../actions-livre";
import { marquerFin } from "../../actions-recit";
import { PageScene } from "../scene/[scene]/PageScene";
import { Apercu, useApercu } from "./Apercu";
import { VoletReglages } from "./Reglages";
import type { CheminsAffiches, PointAffiche, RelireAffiche, TacheAffichee, TacheRelireAffichee } from "./points";

/**
 * La destination Livre (F11.6) : la ligne d'étapes et l'étape ouverte. Aux deux premières
 * étapes, la fiche de l'étape en colonne, ou la scène ouverte à sa place, à côté de l'aperçu du
 * livre (F11.2) ; « Mettre en page » et « Imprimer et partager » se construisent ensuite.
 */
export function Livre({
  projet, etape, marques, chemins, relire, pdfDeTravail, empreinte, noms, miseEnPage, aideMasquee, aideVue,
}: {
  projet: { id: string; aChoix: boolean; deClasse: boolean };
  etape: EtapeLivre;
  marques: Record<EtapeLivre, MarqueEtape>;
  /** « Vérifier les chemins » ; rien en récit classique, qui n'a pas cette étape */
  chemins: CheminsAffiches | null;
  relire: RelireAffiche;
  /** Le dernier PDF de travail, s'il y en a un (F11.2) */
  pdfDeTravail: PdfAffiche | null;
  /** L'empreinte du contenu du livre : l'aperçu se recalcule quand elle change */
  empreinte: string;
  /** « n° 12 · S042 » : le nom de chaque passage */
  noms: Record<string, string>;
  /** « Mettre en page », quand l'étape est ouverte : ses réglages et ses pages de présentation */
  miseEnPage: Omit<Parameters<typeof VoletReglages>[0], "projet" | "apercu" | "onVoirApercu"> | null;
  aideMasquee: { relire: boolean; chemins: boolean };
  aideVue: boolean;
}) {
  const routeur = useRouter();
  const dire = useMessage();
  const etapes = ETAPES_DU_LIVRE.filter((x) => projet.aChoix || x.id !== "chemins");
  const avecAide = etape === "relire" || (etape === "chemins" && Boolean(chemins));
  const masquee = etape === "relire" ? aideMasquee.relire : aideMasquee.chemins;
  const [aide, setAide] = useState(avecAide && !masquee && !aideVue);
  // Rouverte par « Aide » une fois l'étape ouverte, elle se ferme par « Fermer l'aide »
  const [dejaVue, setDejaVue] = useState(aideVue || masquee);
  const rang = etapes.findIndex((x) => x.id === etape) + 1;

  // La dernière étape quittée : le Livre s'y rouvre (F11.6)
  useEffect(() => {
    void noterEtapeDuLivre(projet.id, etape);
  }, [projet.id, etape]);

  // La scène ouverte à côté de l'aperçu, et d'où l'on vient en suivant des renvois (F11-AC83)
  const [ouverte, setOuverte] = useState<SceneOuverte | null>(null);
  const [chargement, setChargement] = useState(false);
  const [aller, setAller] = useState<{ sceneId: string; jeton: number } | null>(null);
  const [panneau, setPanneau] = useState<HTMLElement | null>(null);
  const [vue, setVue] = useState<"scene" | "livre">("scene");
  const relecture = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placer = (sceneId: string) => setAller({ sceneId, jeton: Date.now() });

  const ouvrir = async (sceneId: string, o: { choix?: string; point?: PointAffiche; depuis?: string[] } = {}) => {
    if (!(await avantDePartir())) return dire({ texte: "Vos corrections ne sont pas encore enregistrées : réessayez dans un instant." });
    setChargement(true);
    const r = await ouvrirSceneDuLivre(projet.id, sceneId);
    setChargement(false);
    if (!r.ok) return dire({ texte: r.erreur });
    setOuverte({ sceneId, choix: o.choix, point: o.point, depuis: o.depuis ?? [], plan: r.plan, donnees: r.donnees, jeton: Date.now() });
    setVue("scene");
    placer(sceneId);
  };
  const fermer = async () => {
    if (!(await avantDePartir())) return dire({ texte: "Vos corrections ne sont pas encore enregistrées : réessayez dans un instant." });
    setOuverte(null);
    routeur.refresh();
  };
  // Le texte ou l'état a changé : la page relit le livre après une pause, l'aperçu suit (F11.2)
  const modifie = () => {
    if (relecture.current) clearTimeout(relecture.current);
    relecture.current = setTimeout(() => routeur.refresh(), 2500);
  };
  useEffect(() => () => {
    if (relecture.current) clearTimeout(relecture.current);
  }, []);

  // Le parcours des problèmes de l'étape (F11-AC59) : l'aperçu se place sur le passage, sa scène s'ouvre
  // À « Mettre en page », aucun défaut ne se traite (F11.6) : pas de parcours des problèmes
  const aParcourir = (etape === "relire" ? relire.taches : etape === "chemins" ? (chemins?.taches ?? []) : []).flatMap((t) => t.points).filter((p) => p.sceneId);
  const rangProbleme = ouverte?.point ? aParcourir.findIndex((p) => p.cle === ouverte.point!.cle) : -1;
  const parcourir = (pas: 1 | -1) => {
    if (!aParcourir.length) return;
    const suivant = aParcourir[(rangProbleme + pas + aParcourir.length) % aParcourir.length];
    void ouvrir(suivant.sceneId!, { choix: suivant.choix, point: suivant });
  };

  // « Mettre en page » en deux volets, toujours visibles (F11.6) ; « Réglages » d'abord
  const [volet, setVolet] = useState<"reglages" | "apercu">("reglages");
  const enPage = etape === "page" && miseEnPage !== null;
  const avecApercu = ((etape === "relire" || (etape === "chemins" && chemins)) && !aide) || (enPage && volet === "apercu");
  // L'aperçu reste composé au volet « Réglages », pour la petite double page (étape 6, lot 3)
  const source = useApercu(projet.id, empreinte, avecApercu || enPage);
  const fiche =
    etape === "chemins" && chemins ? (
      <FicheChemins projetId={projet.id} chemins={chemins} fermee={marques.page === "fermee"} />
    ) : etape === "relire" ? (
      <FicheRelire projet={projet} relire={relire} pdfDeTravail={pdfDeTravail} fermee={marques.page === "fermee"} suivante={projet.aChoix ? "chemins" : "page"} />
    ) : null;

  return (
    <OuvrirScene value={(sceneId, choix, point) => void ouvrir(sceneId, { choix, point })}>
      <section className="livre" aria-label="Livre">
        <nav className="temps" aria-label="Étapes du livre">
          <ol>
            {etapes.map((x, i) => {
              const marque = marques[x.id];
              const enCours = x.id === etape;
              return (
                <li key={x.id} className="temps__etape">
                  <Link
                    href={`/projet/${projet.id}/livre?etape=${x.id}`}
                    className={`temps__lien${enCours ? " est-en-cours" : ""}`}
                    aria-current={enCours ? "step" : undefined}
                    scroll={false}
                    onClick={() => {
                      setAide(false);
                      setOuverte(null);
                    }}
                  >
                    <span className={`temps__num${marque === "coche" ? " temps__num--faite" : ""}${marque === "fermee" ? " temps__num--fermee" : ""}`}>
                      {marque === "coche" ? <Icone nom="coche" /> : i + 1}
                    </span>
                    <span className="temps__nom">{x.nom}</span>
                    {marque && marque !== "coche" ? (
                      <span className={`temps__marque temps__marque--${marque}`} title={MOT_DE_MARQUE[marque]}>
                        <Icone nom={marque === "reste" ? "alerte" : marque === "attente" ? "sablier" : "cadenas"} />
                        <span className="vh"> — {MOT_DE_MARQUE[marque]}</span>
                      </span>
                    ) : marque === "coche" ? (
                      <span className="vh"> — {MOT_DE_MARQUE.coche}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
          {avecAide ? (
            <button type="button" className="aide-bouton temps__aide" title="Que fait-on maintenant ?" onClick={() => setAide(true)}>
              <Icone nom="aide" />
              Aide
            </button>
          ) : null}
        </nav>

        {enPage ? (
          <div className="volets" role="tablist" aria-label="Mettre en page">
            <div className="bascule">
              {(["reglages", "apercu"] as const).map((v) => (
                <button key={v} type="button" role="tab" aria-selected={volet === v} data-choisi={volet === v || undefined} onClick={() => setVolet(v)}>
                  <Icone nom={v === "reglages" ? "reglages" : "livre"} />
                  {v === "reglages" ? "Réglages" : "Aperçu"}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {enPage && volet === "reglages" ? (
          <VoletReglages projet={projet} {...miseEnPage} apercu={source} onVoirApercu={() => setVolet("apercu")} />
        ) : aide && avecAide ? (
          <AideEtape
            etape={etape === "relire" ? "relire" : "chemins"}
            aChoix={projet.aChoix}
            rang={rang}
            dejaVue={dejaVue}
            masquee={masquee}
            onCommencer={() => {
              setAide(false);
              setDejaVue(true);
            }}
          />
        ) : avecApercu ? (
          <div className={`livre-plan${ouverte ? " livre-plan--scene" : enPage ? " livre-plan--seul" : ""} livre-plan--vue-${vue}`}>
            {ouverte ? (
              <div className="livre-plan__onglets" role="tablist" aria-label="Scène et livre">
                <button type="button" role="tab" aria-selected={vue === "scene"} onClick={() => setVue("scene")}>
                  Scène {noms[ouverte.sceneId]?.split(" · ").pop() ?? ""}
                </button>
                <button type="button" role="tab" aria-selected={vue === "livre"} onClick={() => setVue("livre")}>
                  Dans le livre
                </button>
              </div>
            ) : null}
            <div className="livre-plan__gauche">
              {ouverte ? (
                <PageScene
                  key={`${ouverte.sceneId}-${ouverte.jeton}`}
                  projet={projet}
                  plan={ouverte.plan}
                  sceneId={ouverte.sceneId}
                  {...ouverte.donnees}
                  ouvrirChoix={ouverte.choix}
                  aCote={{
                    onFermer: () => void fermer(),
                    panneau,
                    onModifie: modifie,
                    dessus: (
                      <>
                        {ouverte.depuis.length ? (
                          <p className="a-cote__venu">
                            <button
                              type="button"
                              className="lien"
                              onClick={() => {
                                const precedente = ouverte.depuis[ouverte.depuis.length - 1];
                                void ouvrir(precedente, { depuis: ouverte.depuis.slice(0, -1) });
                              }}
                            >
                              <Icone nom="fleche-g" />
                              Revenir au {noms[ouverte.depuis[ouverte.depuis.length - 1]]?.split(" · ")[0] ?? "passage précédent"}
                            </button>
                          </p>
                        ) : null}
                        {ouverte.point ? (
                          <ul className="points a-cote__point">
                            <CartePoint projetId={projet.id} point={ouverte.point} sansOuvrir />
                          </ul>
                        ) : null}
                      </>
                    ),
                  }}
                />
              ) : (
                fiche
              )}
              {chargement ? <p className="livre-plan__chargement" role="status">Ouverture de la scène…</p> : null}
            </div>
            <div className="livre-plan__droite">
              <div ref={setPanneau} className="livre-plan__panneau" />
              <Apercu
                source={source}
                limiteAuRecit={!enPage}
                modeParDefaut={enPage ? "double" : "agrandie"}
                choisie={ouverte?.sceneId ?? null}
                aller={aller}
                nommer={(id) => noms[id] ?? "ce passage"}
                onPassage={(id) => void ouvrir(id)}
                onRenvoi={(cible, depuis) => void ouvrir(cible, { depuis: [...(ouverte?.depuis ?? []), depuis] })}
                barre={
                  aParcourir.length ? (
                    <span className="parcours" role="group" aria-label="Parcourir les problèmes">
                      <span className="parcours__nom">
                        <Icone nom="alerte" />
                        Problèmes {rangProbleme >= 0 ? `${rangProbleme + 1} / ` : ""}
                        {aParcourir.length}
                      </span>
                      <button type="button" className="parcours__b" aria-label="Problème précédent" onClick={() => parcourir(-1)}>
                        <Icone nom="chevron-haut" />
                      </button>
                      <button type="button" className="parcours__b" aria-label="Problème suivant" onClick={() => parcourir(1)}>
                        <Icone nom="chevron-bas" />
                      </button>
                    </span>
                  ) : null
                }
              />
            </div>
          </div>
        ) : (
          <EtapeFermee projet={projet} etape={etape} chemins={chemins} relire={relire} />
        )}
      </section>
    </OuvrirScene>
  );
}

type SceneOuverte = {
  sceneId: string;
  choix?: string;
  point?: PointAffiche;
  /** Les passages d'où l'on est venu en suivant des renvois : « Revenir au n° 3 » */
  depuis: string[];
  plan: Plan;
  donnees: DonneesDeLaScene;
  jeton: number;
};

/** Ouvrir une scène à côté de l'aperçu, depuis un point d'une fiche (F11-AC85). */
const OuvrirScene = createContext<((sceneId: string, choix?: string, point?: PointAffiche) => void) | null>(null);

// ——— Aide à l'ouverture de l'étape (F11-AC79) ———

const AIDES: Record<"relire" | "chemins", { titre: string; questions: (aChoix: boolean) => { question: string; reponse: ReactNode }[] }> = {
  relire: {
    titre: "Relire",
    questions: () => [
      {
        question: "Que fait-on maintenant ?",
        reponse: (
          <>
            <p>On lit le livre tel qu’il sera imprimé, et on corrige ce qu’on voit, directement dans la scène.</p>
            <ol className="aide-etape__taches">
              <li>Ce qui reste à écrire</li>
              <li>Erreurs graves</li>
              <li>À confirmer</li>
              <li>Lire et corriger</li>
            </ol>
          </>
        ),
      },
      {
        question: "Comment corriger une coquille ?",
        reponse: <p>Cliquez sur le passage dans l’aperçu : sa scène s’ouvre à côté. Ce que vous écrivez entre dans la scène, et l’aperçu se met à jour.</p>,
      },
      {
        question: "Et les scènes à finir ?",
        reponse: (
          <p>
            Elles se terminent dans le Suivi. Une scène qui ne sera pas finie peut être exclue du livre, depuis son menu ⋯ : elle reste dans le
            projet.
          </p>
        ),
      },
      {
        question: "À quoi sert le PDF de travail ?",
        reponse: <p>À relire sur papier. Il porte la référence de chaque scène, pour retrouver vos annotations, et ne peut pas servir de livre.</p>,
      },
    ],
  },
  chemins: {
    titre: "Vérifier les chemins",
    questions: () => [
      {
        question: "Que fait-on maintenant ?",
        reponse: (
          <>
            <p>On vérifie que chaque choix mène quelque part et que chaque chemin a une fin.</p>
            <ol className="aide-etape__taches">
              <li>Départ et fins</li>
              <li>Choix à relier</li>
              <li>Passages à confirmer</li>
              <li>Tester la lecture, si vous le souhaitez</li>
            </ol>
          </>
        ),
      },
      {
        question: "Que veut dire « Aucun chemin n’y mène » ?",
        reponse: <p>Aucun choix ne conduit à ce passage depuis le départ. C’est peut-être voulu, comme un passage caché, ou c’est un oubli.</p>,
      },
      {
        question: "Que veut dire « C’est voulu » ?",
        reponse: (
          <p>
            Vous gardez le passage tel quel : il ne compte plus parmi ce qui reste à faire. Si ses chemins changent, la question vous est posée de nouveau. Un
            problème qui bloque le livre, lui, se corrige.
          </p>
        ),
      },
      {
        question: "Et les scènes à finir ?",
        reponse: <p>Leurs choix seront vérifiés une fois qu’elles seront prêtes pour le livre. En attendant, elles ne sont pas signalées ici.</p>,
      },
    ],
  },
};

function AideEtape({
  etape, aChoix, rang, dejaVue, masquee, onCommencer,
}: { etape: "relire" | "chemins"; aChoix: boolean; rang: number; dejaVue: boolean; masquee: boolean; onCommencer: () => void }) {
  const [, lancer] = useTransition();
  return (
    <EcranAide
      rang={`Étape ${rang}`}
      titre={AIDES[etape].titre}
      dejaVue={dejaVue}
      masquee={masquee}
      onCommencer={() => {
        // L'aide ne revient pas avant la visite suivante de la destination Livre (F11.6, 14 octobre 2026)
        document.cookie = "aide-livre=vue; path=/; samesite=lax";
        onCommencer();
      }}
      onMasquer={(m) => lancer(() => reglerAide(`livre-${etape}`, m))}
      questions={AIDES[etape].questions(aChoix)}
    />
  );
}

// ——— « Vérifier les chemins » ———

const FAIT: Record<TacheAffichee["id"], string> = {
  "depart-fins": "Le départ et les fins sont en place.",
  choix: "Tous les choix mènent quelque part.",
  passages: "Rien à confirmer.",
  essai: "",
};

function FicheChemins({ projetId, chemins, fermee }: { projetId: string; chemins: CheminsAffiches; fermee: boolean }) {
  const { taches } = chemins;
  const [choisie, setChoisie] = useState<TacheAffichee["id"]>(() => (taches.find((t) => t.points.length) ?? taches[taches.length - 1]).id);
  const cour = taches.find((t) => t.id === choisie) ?? taches[0];
  const i = taches.indexOf(cour);
  const suivante = taches[i + 1];

  return (
    <section className="carnet-fiche carnet-fiche--decision controles" aria-labelledby="controles-t">
      <header>
        <Icone nom="chemins" />
        <h2 id="controles-t">Vérifier les chemins</h2>
      </header>
      <div className="carnet-fiche__corps">
        <ol className="fil-taches" aria-label="Tâches de l’étape">
          {taches.map((t, k) => (
            <li key={t.id}>
              <button type="button" className="fil__b" aria-current={t === cour ? "step" : undefined} onClick={() => setChoisie(t.id)}>
                <span className={`fil__n${t.faite ? " fil__n--faite" : ""}`} aria-hidden="true">
                  {t.faite ? <Icone nom="coche" /> : k + 1}
                </span>
                <span className="fil__nom">
                  {t.nom}
                  {t.faite ? <span className="vh"> — fait</span> : null}
                </span>
                {t.points.length ? (
                  <span className={`compte compte--${t.avert ? "avert" : "bloque"}`}>
                    {t.points.length}
                    <span className="vh"> {t.avert ? "à confirmer" : "à corriger"}</span>
                  </span>
                ) : t.attente ? (
                  <span className="fil__marque" title="En attente de l’écriture">
                    <Icone nom="sablier" />
                    <span className="vh"> — en attente de l’écriture</span>
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ol>

        <div className="tache-panneau" role="group" aria-labelledby="tache-t">
          <h3 className="vh" id="tache-t">
            {cour.nom}
          </h3>
          {cour.id === "essai" ? (
            <Declaration projetId={projetId} chemins={chemins} />
          ) : (
            <>
              {cour.points.length ? (
                <ul className="points">
                  {cour.points.map((p) => (
                    <CartePoint key={p.cle} projetId={projetId} point={p} />
                  ))}
                </ul>
              ) : cour.attente ? (
                <p className="tache__aide">Rien pour l’instant.</p>
              ) : (
                <p className="tache__ok">
                  <Icone nom="coche" />
                  {cour.id === "passages" && cour.acceptes.length ? "Tout est confirmé." : FAIT[cour.id]}
                </p>
              )}
              {cour.acceptes.length ? <Acceptes projetId={projetId} points={cour.acceptes} /> : null}
            </>
          )}
        </div>

        {chemins.aSavoir.length ? (
          <details className="asavoir">
            <summary>
              <Icone nom="info" />À savoir <span className="compte">{chemins.aSavoir.length}</span>
            </summary>
            <ul className="points">
              {chemins.aSavoir.map((p) => (
                <CartePoint key={p.cle} projetId={projetId} point={p} />
              ))}
            </ul>
          </details>
        ) : null}

        {chemins.finir ? (
          <p className="fiche-note">
            <Icone nom="sablier" />
            <span>
              {chemins.finir} scène{pluriel(chemins.finir)} à finir : {chemins.finir > 1 ? "leurs choix seront vérifiés" : "ses choix seront vérifiés"} ensuite.
            </span>
          </p>
        ) : null}

        <p className="tache__suite">
          {suivante ? (
            <button type="button" className="btn btn--petit" onClick={() => setChoisie(suivante.id)}>
              Continuer
              <Icone nom="fleche" />
            </button>
          ) : (
            <Link className={`controles__suite${fermee ? "" : " controles__suite--prete"}`} href={`/projet/${projetId}/livre?etape=page`} scroll={false}>
              {fermee ? <Icone nom="cadenas" /> : null}
              Étape suivante : Mettre en page
              {fermee ? null : <Icone nom="fleche" />}
            </Link>
          )}
        </p>
      </div>
    </section>
  );
}

/** Un point : sa scène, sa phrase, et de quoi le traiter, sur une seule ligne. */
function CartePoint({ projetId, point, sansOuvrir }: { projetId: string; point: PointAffiche; sansOuvrir?: boolean }) {
  const dire = useMessage();
  const ouvrirACote = use(OuvrirScene);
  const [occupe, lancer] = useTransition();
  const accepter = () =>
    lancer(async () => {
      const r = await accepterAvertissement(projetId, point.cle);
      dire({ texte: r.ok ? (point.accepterLibelle ? "C’est noté : l’image reste telle quelle." : "C’est noté : ce passage reste tel quel.") : r.erreur });
    });
  const fin = (sceneId: string) =>
    lancer(async () => {
      const r = await marquerFin(sceneId, true);
      dire({ texte: r.ok ? `${point.ref ?? "La scène"} est une fin du livre.` : r.erreur });
    });
  return (
    <li className={`point point--${point.gravite}`}>
      {point.ref ? (
        <p className="point__scene">
          <span className="code">{point.ref}</span> {point.titre ?? ""}
        </p>
      ) : null}
      <p className="point__quoi">{point.quoi}</p>
      {point.suite ? <p className="point__suite">{point.suite}</p> : null}
      <p className="point__actions">
        {point.accepter ? (
          <button type="button" className="btn btn--petit" aria-busy={occupe || undefined} disabled={occupe} onClick={accepter}>
            <Icone nom="coche" />
            {point.accepterLibelle ?? "C’est voulu"}
          </button>
        ) : null}
        {point.fin ? (
          <button type="button" className="btn btn--petit" aria-busy={occupe || undefined} disabled={occupe} onClick={() => fin(point.fin!)}>
            <Icone nom="fin" />
            Marquer comme fin
          </button>
        ) : null}
        {sansOuvrir ? null : ouvrirACote && point.sceneId ? (
          <button type="button" className="lien" onClick={() => ouvrirACote(point.sceneId!, point.choix, point)}>
            Ouvrir la scène
          </button>
        ) : point.ouvrir ? (
          <Link className="lien" href={point.ouvrir}>
            Ouvrir la scène
          </Link>
        ) : null}
        {point.chemins ? (
          <Link className="lien" href={point.chemins}>
            Voir dans les chemins
          </Link>
        ) : null}
        {point.lien ? (
          <Link className="lien" href={point.lien.href}>
            {point.lien.texte}
          </Link>
        ) : null}
      </p>
    </li>
  );
}

/** Les avertissements acceptés, repliés : ils restent consultables, et l'acceptation se retire. */
function Acceptes({ projetId, points }: { projetId: string; points: PointAffiche[] }) {
  const dire = useMessage();
  const [occupe, lancer] = useTransition();
  return (
    <details className="acceptes">
      <summary>
        {points.length} accepté{pluriel(points.length)} · Revoir
      </summary>
      <ul>
        {points.map((p) => (
          <li key={p.cle}>
            <span>
              {p.ref ? <span className="code">{p.ref}</span> : null} {p.titre ?? ""} — {p.quoi}
            </span>
            <button
              type="button"
              className="lien"
              aria-busy={occupe || undefined}
              disabled={occupe}
              onClick={() =>
                lancer(async () => {
                  const r = await retirerAcceptation(projetId, p.cle);
                  dire({ texte: r.ok ? "Ce passage est de nouveau à confirmer." : r.erreur });
                })
              }
            >
              Revoir
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** « J'ai vérifié les chemins » : la dernière tâche, quand il ne reste rien (F11.6). */
function Declaration({ projetId, chemins }: { projetId: string; chemins: CheminsAffiches }) {
  const dire = useMessage();
  const [occupe, lancer] = useTransition();
  const declarer = (oui: boolean) =>
    lancer(async () => {
      const r = await declarerChemins(projetId, oui);
      if (!r.ok) dire({ texte: r.erreur });
    });
  return (
    <>
      <p className="tache__aide">Lisez le livre comme un lecteur, en suivant ses choix : c’est facultatif.</p>
      <p className="tache__cmd">
        <Link className="btn btn--petit" href={`/projet/${projetId}/lecture?de=livre`}>
          <Icone nom="livre" />
          Tester la lecture
        </Link>
      </p>
      {chemins.terminee ? (
        <>
          <p className="tache__ok">
            <Icone nom="coche" />
            Chemins vérifiés.
          </p>
          <p className="tache__cmd">
            <button type="button" className="lien" disabled={occupe} onClick={() => declarer(false)}>
              Revenir sur cette déclaration
            </button>
          </p>
        </>
      ) : chemins.declaree ? (
        <>
          <p className="tache__aide">
            <Icone nom="sablier" />
            Vous l’avez déclaré. La coche reviendra quand il ne restera plus rien à faire.
          </p>
          <p className="tache__cmd">
            <button type="button" className="lien" disabled={occupe} onClick={() => declarer(false)}>
              Revenir sur cette déclaration
            </button>
          </p>
        </>
      ) : (
        <>
          <p className="tache__cmd">
            <button type="button" className="btn btn--primaire" disabled={!chemins.declarable || occupe} aria-busy={occupe || undefined} onClick={() => declarer(true)}>
              <Icone nom="coche" />
              J’ai vérifié les chemins
            </button>
          </p>
          {chemins.declarable ? null : (
            <p className="tache__aide">
              {chemins.finir ? "Possible quand toutes les scènes seront prêtes pour le livre." : "Possible quand les tâches précédentes sont terminées."}
            </p>
          )}
        </>
      )}
    </>
  );
}

// ——— « Relire » ———

const FAIT_RELIRE: Record<TacheRelireAffichee["id"], string> = {
  ecrire: "Toutes les scènes sont prêtes pour le livre.",
  graves: "Aucune erreur grave.",
  confirmer: "Rien à confirmer.",
  lire: "",
};

/** « Relire » (F11.6) : quatre tâches, en colonne à côté de l'aperçu. */
function FicheRelire({
  projet, relire, pdfDeTravail, fermee, suivante,
}: {
  projet: { id: string; aChoix: boolean };
  relire: RelireAffiche;
  pdfDeTravail: PdfAffiche | null;
  fermee: boolean;
  suivante: "chemins" | "page";
}) {
  const { taches } = relire;
  const [choisie, setChoisie] = useState<TacheRelireAffichee["id"]>(() => (taches.find((t) => t.points.length) ?? (relire.finir ? taches[0] : taches[taches.length - 1])).id);
  const cour = taches.find((t) => t.id === choisie) ?? taches[0];
  const i = taches.indexOf(cour);
  const apres = taches[i + 1];
  return (
    <section className="carnet-fiche carnet-fiche--decision controles" aria-labelledby="relire-t">
      <header>
        <Icone nom="loupe" />
        <h2 id="relire-t">Relire</h2>
      </header>
      <div className="carnet-fiche__corps">
        <ol className="fil-taches" aria-label="Tâches de l’étape">
          {taches.map((t, k) => (
            <li key={t.id}>
              <button type="button" className="fil__b" aria-current={t === cour ? "step" : undefined} onClick={() => setChoisie(t.id)}>
                <span className={`fil__n${t.faite ? " fil__n--faite" : ""}`} aria-hidden="true">
                  {t.faite ? <Icone nom="coche" /> : k + 1}
                </span>
                <span className="fil__nom">
                  {t.nom}
                  {t.faite ? <span className="vh"> — fait</span> : null}
                </span>
                {t.id === "ecrire" && relire.finir ? (
                  <span className="fil__marque" title="En attente de l’écriture">
                    <Icone nom="sablier" />
                    <span className="vh"> — en attente de l’écriture</span>
                  </span>
                ) : t.points.length ? (
                  <span className={`compte compte--${t.avert ? "avert" : "bloque"}`}>
                    {t.points.length}
                    <span className="vh"> {t.avert ? "à confirmer" : "à corriger"}</span>
                  </span>
                ) : t.attente ? (
                  <span className="fil__marque" title="En attente de l’écriture">
                    <Icone nom="sablier" />
                    <span className="vh"> — en attente de l’écriture</span>
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ol>

        <div className="tache-panneau" role="group" aria-labelledby="tache-relire-t">
          <h3 className="vh" id="tache-relire-t">
            {cour.nom}
          </h3>
          {cour.id === "ecrire" ? (
            relire.finir ? (
              <p className="tache__cmd">
                <span className="tache__chiffre">
                  <b>{relire.finir}</b> scène{pluriel(relire.finir)} à finir
                </span>
                <Link className="btn btn--petit" href={`/projet/${projet.id}/suivi?livre=finir&direct=1`}>
                  Voir dans le Suivi
                </Link>
              </p>
            ) : (
              <p className="tache__ok">
                <Icone nom="coche" />
                {FAIT_RELIRE.ecrire}
              </p>
            )
          ) : cour.id === "lire" ? (
            <LireEtCorriger projet={projet} relire={relire} pdfDeTravail={pdfDeTravail} />
          ) : (
            <>
              {cour.points.length ? (
                <ul className="points">
                  {cour.points.map((p) => (
                    <CartePoint key={p.cle} projetId={projet.id} point={p} />
                  ))}
                </ul>
              ) : cour.attente ? (
                <p className="tache__aide">Rien pour l’instant.</p>
              ) : (
                <p className="tache__ok">
                  <Icone nom="coche" />
                  {cour.id === "confirmer" && cour.acceptes.length ? "Tout est confirmé." : FAIT_RELIRE[cour.id]}
                </p>
              )}
              {cour.acceptes.length ? <Acceptes projetId={projet.id} points={cour.acceptes} /> : null}
            </>
          )}
        </div>

        {relire.aSavoir.length ? (
          <details className="asavoir">
            <summary>
              <Icone nom="info" />À savoir <span className="compte">{relire.aSavoir.length}</span>
            </summary>
            <ul className="points">
              {relire.aSavoir.map((p) => (
                <CartePoint key={p.cle} projetId={projet.id} point={p} />
              ))}
            </ul>
          </details>
        ) : null}

        <p className="tache__suite">
          {apres ? (
            <button type="button" className="btn btn--petit" onClick={() => setChoisie(apres.id)}>
              Continuer
              <Icone nom="fleche" />
            </button>
          ) : suivante === "chemins" ? (
            <Link className="controles__suite controles__suite--prete" href={`/projet/${projet.id}/livre?etape=chemins`} scroll={false}>
              Étape suivante : Vérifier les chemins
              <Icone nom="fleche" />
            </Link>
          ) : (
            <Link className={`controles__suite${fermee ? "" : " controles__suite--prete"}`} href={`/projet/${projet.id}/livre?etape=page`} scroll={false}>
              {fermee ? <Icone nom="cadenas" /> : null}
              Étape suivante : Mettre en page
              {fermee ? null : <Icone nom="fleche" />}
            </Link>
          )}
        </p>
      </div>
    </section>
  );
}

/** « Lire et corriger » : la lecture continue dans l'aperçu, le PDF de travail, puis « J'ai relu le livre » (F11-AC88). */
function LireEtCorriger({ projet, relire, pdfDeTravail }: { projet: { id: string; aChoix: boolean }; relire: RelireAffiche; pdfDeTravail: PdfAffiche | null }) {
  const dire = useMessage();
  const [occupe, lancer] = useTransition();
  const declarer = (oui: boolean) =>
    lancer(async () => {
      const r = await declarerRelu(projet.id, oui);
      if (!r.ok) dire({ texte: r.erreur });
    });
  return (
    <>
      <p className="tache__aide">Lisez le livre dans l’aperçu. Un clic sur un passage ouvre sa scène à côté, pour la corriger sur place.</p>
      {projet.aChoix ? null : (
        <p className="tache__cmd">
          <Link className="lien" href={`/projet/${projet.id}/lecture?de=livre`}>
            Lire comme un lecteur
          </Link>
        </p>
      )}
      <PdfDeTravail projetId={projet.id} dernier={pdfDeTravail} />
      <div className="declaration">
        {relire.terminee ? (
          <>
            <p className="tache__ok">
              <Icone nom="coche" />
              Livre relu.
            </p>
            <p className="tache__cmd">
              <button type="button" className="lien" disabled={occupe} onClick={() => declarer(false)}>
                Revenir sur cette déclaration
              </button>
            </p>
          </>
        ) : relire.declaree ? (
          <>
            <p className="tache__aide">
              <Icone nom="sablier" />
              Vous l’avez déclaré. La coche reviendra quand il ne restera plus rien à faire.
            </p>
            <p className="tache__cmd">
              <button type="button" className="lien" disabled={occupe} onClick={() => declarer(false)}>
                Revenir sur cette déclaration
              </button>
            </p>
          </>
        ) : (
          <>
            <p className="tache__cmd">
              <button type="button" className="btn btn--primaire" disabled={!relire.declarable || occupe} aria-busy={occupe || undefined} onClick={() => declarer(true)}>
                <Icone nom="coche" />
                J’ai relu le livre
              </button>
            </p>
            {relire.declarable ? null : (
              <p className="tache__aide">
                {relire.finir ? "Possible quand toutes les scènes seront prêtes pour le livre." : "Possible quand les tâches précédentes sont terminées."}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}

/** Un PDF du livre tel que l'écran le nomme. */
export type PdfAffiche = { id: string; etat: string; pages: number };

/**
 * Le PDF de travail (F11.2), pour relire sur papier : composé sur le serveur en quelques
 * secondes, puis téléchargé. Seul le dernier est gardé.
 */
function PdfDeTravail({ projetId, dernier }: { projetId: string; dernier: PdfAffiche | null }) {
  const [pdf, setPdf] = useState(dernier);
  const [calcul, setCalcul] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  async function creer() {
    setCalcul(true);
    setErreur(null);
    try {
      const reponse = await fetch(`/livre/${projetId}/pdf`, { method: "POST" });
      const r = (await reponse.json()) as { ok: true; id: string; etat: string; pages: number; adresse: string } | { ok: false; erreur: string };
      if (!r.ok) {
        setErreur(r.erreur);
        return;
      }
      setPdf({ id: r.id, etat: r.etat, pages: r.pages });
      window.location.assign(r.adresse);
    } catch {
      setErreur("Le PDF n’a pas pu être créé. Réessayez dans un instant.");
    } finally {
      setCalcul(false);
    }
  }
  return (
    <div className="pdf-travail">
      <h4 className="pdf-travail__titre">PDF de travail</h4>
      <p className="pdf-travail__phrase">Pour relire sur papier, avec les références des scènes et les points à corriger.</p>
      <p className="pdf-travail__cmd">
        <button type="button" className="btn" onClick={creer} disabled={calcul} aria-describedby={calcul ? "pdf-travail-etat" : undefined}>
          <Icone nom="papier" />
          {calcul ? "Création du PDF…" : "Créer le PDF de travail"}
        </button>
        {pdf && !calcul ? (
          <a className="lien" href={`/livre/pdf/${pdf.id}`}>
            Télécharger celui du {pdf.etat.replace(/^état du /, "")}
          </a>
        ) : null}
      </p>
      <p id="pdf-travail-etat" className="pdf-travail__etat" role="status">
        {calcul ? "Quelques secondes : le livre est mis en pages sur le serveur." : erreur ?? ""}
      </p>
    </div>
  );
}

/** Une étape fermée dit pourquoi, et mène au temps où cela se traite (F11.6). */
function EtapeFermee({
  projet, etape, chemins, relire,
}: {
  projet: { id: string; aChoix: boolean };
  etape: EtapeLivre;
  chemins: CheminsAffiches | null;
  relire: RelireAffiche;
}) {
  const nom = ETAPES_DU_LIVRE.find((x) => x.id === etape)!.nom;
  const resteRelire = relire.taches.reduce((n, t) => n + t.points.length, 0);
  const reste = chemins
    ? [chemins.taches.reduce((n, t) => n + (t.avert ? 0 : t.points.length), 0), chemins.taches.reduce((n, t) => n + (t.avert ? t.points.length : 0), 0)]
    : [0, 0];
  return (
    <section className="porte" aria-labelledby="fermee-t">
      <p className="porte__cadenas">
        <Icone nom="cadenas" />
      </p>
      <h2 id="fermee-t" tabIndex={-1}>
        « {nom} » n’est pas encore ouverte
      </h2>
      <p className="porte__phrase">
        {etape === "page"
          ? `Elle s’ouvre quand « Relire »${projet.aChoix ? " et « Vérifier les chemins » sont terminées" : " est terminée"}.`
          : "Elle s’ouvre quand la mise en page vous convient."}
      </p>
      <ul className="porte__reste">
        <li>
          <Link href={`/projet/${projet.id}/livre?etape=relire`} scroll={false}>
            Relire
          </Link>{" "}
 :{" "}
          {relire.terminee
            ? "terminée."
            : [
                relire.finir ? `${relire.finir} scène${pluriel(relire.finir)} à finir` : "",
                resteRelire ? `${resteRelire} point${pluriel(resteRelire)} à traiter` : "",
                !relire.finir && !resteRelire && !relire.declaree ? "« J’ai relu le livre » à déclarer" : "",
              ]
                .filter(Boolean)
                .join(" · ") || "en attente."}
        </li>
        {chemins ? (
          <li>
            <Link href={`/projet/${projet.id}/livre?etape=chemins`} scroll={false}>
              Vérifier les chemins
            </Link>{" "}
            :{" "}
            {chemins.terminee
              ? "terminée."
              : [reste[0] ? `${reste[0]} à corriger` : "", reste[1] ? `${reste[1]} à confirmer` : "", !reste[0] && !reste[1] && !chemins.declaree && !chemins.finir ? "« J’ai vérifié les chemins » à déclarer" : ""]
                  .filter(Boolean)
                  .join(" · ") || "en attente de l’écriture."}
          </li>
        ) : null}
      </ul>
      {relire.finir ? <p className="tache__aide">Une scène qui ne sera pas finie peut être exclue du livre, depuis son menu ⋯.</p> : null}
    </section>
  );
}
