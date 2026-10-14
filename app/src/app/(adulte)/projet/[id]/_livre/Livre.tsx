"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { EcranAide } from "@/composants/EcranAide";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { ETAPES_DU_LIVRE, MOT_DE_MARQUE, type EtapeLivre, type MarqueEtape } from "@/domaine/livre";
import { pluriel } from "@/domaine/texte";
import { reglerAide } from "../../../actions-compte";
import { accepterAvertissement, declarerChemins, retirerAcceptation } from "../../actions-livre";
import { marquerFin } from "../../actions-recit";
import type { CheminsAffiches, PointAffiche, TacheAffichee } from "./points";

/**
 * La destination Livre (F11.6) : la ligne d'étapes et l'étape ouverte. À l'étape 5 du plan,
 * seule « Vérifier les chemins » est construite ; « Relire » arrive avec l'aperçu du livre,
 * et les deux dernières étapes sont fermées par leurs propres règles.
 */
export function Livre({
  projet, etape, marques, chemins, relire, aideMasquee, aideVue,
}: {
  projet: { id: string; aChoix: boolean; deClasse: boolean };
  etape: EtapeLivre;
  marques: Record<EtapeLivre, MarqueEtape>;
  /** « Vérifier les chemins » ; rien en récit classique, qui n'a pas cette étape */
  chemins: CheminsAffiches | null;
  relire: { finir: number; graves: PointAffiche[] };
  aideMasquee: boolean;
  aideVue: boolean;
}) {
  const etapes = ETAPES_DU_LIVRE.filter((x) => projet.aChoix || x.id !== "chemins");
  const [aide, setAide] = useState(etape === "chemins" && !aideMasquee && !aideVue);
  // Rouverte par « Aide » une fois l'étape ouverte, elle se ferme par « Fermer l'aide »
  const [dejaVue, setDejaVue] = useState(aideVue || aideMasquee);
  const rang = etapes.findIndex((x) => x.id === etape) + 1;

  return (
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
                  onClick={() => setAide(false)}
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
        {etape === "chemins" ? (
          <button type="button" className="aide-bouton temps__aide" title="Que fait-on maintenant ?" onClick={() => setAide(true)}>
            <Icone nom="aide" />
            Aide
          </button>
        ) : null}
      </nav>

      {aide && chemins ? (
        <AideChemins
          rang={rang}
          dejaVue={dejaVue}
          masquee={aideMasquee}
          onCommencer={() => {
            setAide(false);
            setDejaVue(true);
          }}
        />
      ) : etape === "chemins" && chemins ? (
        <FicheChemins projetId={projet.id} chemins={chemins} fermee={marques.page === "fermee"} />
      ) : etape === "relire" ? (
        <RelireAVenir projet={projet} relire={relire} />
      ) : (
        <EtapeFermee projet={projet} etape={etape} chemins={chemins} relire={relire} />
      )}
    </section>
  );
}

// ——— Aide à l'ouverture de l'étape (F11-AC79) ———

function AideChemins({ rang, dejaVue, masquee, onCommencer }: { rang: number; dejaVue: boolean; masquee: boolean; onCommencer: () => void }) {
  const [, lancer] = useTransition();
  return (
    <EcranAide
      rang={`Étape ${rang}`}
      titre="Vérifier les chemins"
      dejaVue={dejaVue}
      masquee={masquee}
      onCommencer={() => {
        // L'aide ne revient pas avant la visite suivante de la destination Livre (F11.6, 14 octobre 2026)
        document.cookie = "aide-livre=vue; path=/; samesite=lax";
        onCommencer();
      }}
      onMasquer={(m) => lancer(() => reglerAide("livre-chemins", m))}
      questions={[
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
      ]}
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
function CartePoint({ projetId, point }: { projetId: string; point: PointAffiche }) {
  const dire = useMessage();
  const [occupe, lancer] = useTransition();
  const accepter = () =>
    lancer(async () => {
      const r = await accepterAvertissement(projetId, point.cle);
      dire({ texte: r.ok ? "C’est noté : ce passage reste tel quel." : r.erreur });
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
            C’est voulu
          </button>
        ) : null}
        {point.fin ? (
          <button type="button" className="btn btn--petit" aria-busy={occupe || undefined} disabled={occupe} onClick={() => fin(point.fin!)}>
            <Icone nom="fin" />
            Marquer comme fin
          </button>
        ) : null}
        {point.ouvrir ? (
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

// ——— Les autres étapes, à l'étape 5 du plan ———

/** « Relire » arrive avec l'aperçu du livre (étape 6 du plan) ; on y voit déjà ce qui reste à écrire. */
function RelireAVenir({ projet, relire }: { projet: { id: string; deClasse: boolean }; relire: { finir: number; graves: PointAffiche[] } }) {
  return (
    <section className="porte" aria-labelledby="relire-t">
      <h2 id="relire-t" tabIndex={-1}>
        Relire
      </h2>
      <p className="porte__phrase">Cette étape arrive avec l’aperçu du livre.</p>
      {relire.finir ? (
        <p className="tache__cmd">
          <span className="tache__chiffre">
            <b>{relire.finir}</b> scène{pluriel(relire.finir)} à finir
          </span>
          <Link className="btn btn--petit" href={`/projet/${projet.id}/suivi`}>
            Voir dans le Suivi
          </Link>
        </p>
      ) : null}
      {relire.graves.length ? (
        <ul className="points">
          {relire.graves.map((p) => (
            <CartePoint key={p.cle} projetId={projet.id} point={p} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Une étape fermée dit pourquoi, et mène au temps où cela se traite (F11.6). */
function EtapeFermee({
  projet, etape, chemins, relire,
}: {
  projet: { id: string; aChoix: boolean };
  etape: EtapeLivre;
  chemins: CheminsAffiches | null;
  relire: { finir: number };
}) {
  const nom = ETAPES_DU_LIVRE.find((x) => x.id === etape)!.nom;
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
          : arrive avec l’aperçu du livre{relire.finir ? ` ; ${relire.finir} scène${pluriel(relire.finir)} à finir` : ""}.
        </li>
        {chemins ? (
          <li>
            <Link href={`/projet/${projet.id}/livre?etape=chemins`} scroll={false}>
              Vérifier les chemins
            </Link>{" "}
            :{" "}
            {chemins.terminee
              ? "terminée."
              : [reste[0] ? `${reste[0]} à corriger` : "", reste[1] ? `${reste[1]} à confirmer` : "", !reste[0] && !reste[1] && !chemins.declaree && !chemins.finir ? "à déclarer" : ""]
                  .filter(Boolean)
                  .join(" · ") || "en attente de l’écriture."}
          </li>
        ) : null}
      </ul>
      {relire.finir ? <p className="tache__aide">Une scène qui ne sera pas finie peut être exclue du livre, depuis son menu ⋯.</p> : null}
    </section>
  );
}
