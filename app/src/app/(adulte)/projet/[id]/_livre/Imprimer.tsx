"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bulle } from "@/composants/Bulle";
import { Icone } from "@/composants/Icone";
import { ETAPES_DU_LIVRE, type RaisonDeRefus } from "@/domaine/livre";
import { supprimerPdf } from "../../actions-livre";
import { VoletPartager, type PartageAffiche } from "./Partager";

/**
 * « Imprimer et partager », volet « Imprimer » (F11.2, F11.6) : le PDF définitif, refusé tant
 * que la règle unique ne le permet pas, sans contournement (F09-AC10) ; les avertissements
 * rappelés à sa demande ; les PDF définitifs conservés, le plus récent en tête (F11-AC101) ;
 * la couverture à préparer chez l'imprimeur (F10.2). Le volet « Partager » est dans `Partager.tsx`.
 */

export type DefinitifAffiche = { id: string; etat: string; pages: number; taille: number; aJour: boolean };

export function EtapeImprimer({
  projetId, possible, raisons, rappels, definitifs, placeOccupee, partager, voletDemande,
}: {
  projetId: string;
  /** Le volet « Partager » (étape 7) */
  partager: PartageAffiche;
  /** Le volet ouvert d'abord : « Partager » quand l'adresse le demande */
  voletDemande?: "imprimer" | "partager";
  possible: boolean;
  raisons: RaisonDeRefus[];
  /** « S014 · Image peu définie. » : avertissements et points « à savoir », rappelés avant de créer le PDF */
  rappels: string[];
  definitifs: DefinitifAffiche[];
  placeOccupee: number;
}) {
  const [volet, setVolet] = useState<"imprimer" | "partager">(voletDemande ?? "imprimer");
  return (
    <>
      <div className="volets" role="tablist" aria-label="Imprimer et partager">
        <div className="bascule">
          {(["imprimer", "partager"] as const).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={volet === v} data-choisi={volet === v || undefined} onClick={() => setVolet(v)}>
              <Icone nom={v === "imprimer" ? "imprimer" : "partager"} />
              {v === "imprimer" ? "Imprimer" : "Partager"}
              {v === "partager" && partager.partage && !partager.partage.aJour ? (
                <span className="volets__marque" title="Le livre a changé depuis la version partagée">
                  <Icone nom="alerte" />
                  <span className="vh"> — le livre a changé depuis la version partagée</span>
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      {volet === "imprimer" ? (
        <VoletImprimer projetId={projetId} possible={possible} raisons={raisons} rappels={rappels} definitifs={definitifs} placeOccupee={placeOccupee} />
      ) : (
        <VoletPartager projetId={projetId} p={partager} rappels={rappels} />
      )}
    </>
  );
}

function VoletImprimer({
  projetId, possible, raisons, rappels, definitifs, placeOccupee,
}: {
  projetId: string;
  possible: boolean;
  raisons: RaisonDeRefus[];
  rappels: string[];
  definitifs: DefinitifAffiche[];
  placeOccupee: number;
}) {
  const routeur = useRouter();
  const [rappel, setRappel] = useState(false);
  const [calcul, setCalcul] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [travail, setTravail] = useState(false);
  const dernier = definitifs[0] ?? null;
  const fait = possible && dernier?.aJour;

  const creer = async () => {
    setCalcul(true);
    setErreur(null);
    try {
      const reponse = await fetch(`/livre/${projetId}/definitif`, { method: "POST" });
      const r = (await reponse.json()) as { ok: true; adresse: string } | { ok: false; erreur: string };
      if (!r.ok) return setErreur(r.erreur);
      setRappel(false);
      routeur.refresh();
      window.location.assign(r.adresse);
    } catch {
      setErreur("Le PDF n’a pas pu être créé. Réessayez dans un instant.");
    } finally {
      setCalcul(false);
    }
  };
  const demander = () => (rappels.length ? setRappel(true) : void creer());
  const creerTravail = async () => {
    setTravail(true);
    setErreur(null);
    try {
      const reponse = await fetch(`/livre/${projetId}/pdf`, { method: "POST" });
      const r = (await reponse.json()) as { ok: true; adresse: string } | { ok: false; erreur: string };
      if (!r.ok) return setErreur(r.erreur);
      window.location.assign(r.adresse);
    } catch {
      setErreur("Le PDF n’a pas pu être créé. Réessayez dans un instant.");
    } finally {
      setTravail(false);
    }
  };

  return (
    <div className="imprimer">
      <div className="imprimer__principal">
        <section className="imprimer__pdf" aria-labelledby="definitif-t">
          <h2 id="definitif-t" className="imprimer__titre">
            PDF définitif
            <Bulle question="Qu’est-ce que le PDF définitif ?">
              <span>Le livre tel qu’il s’imprime, sans les marques du PDF de travail. Une fois créé, il ne change plus ; le projet reste modifiable.</span>
            </Bulle>
          </h2>

          {!possible ? (
            <div className="imprimer__refus">
              <p className="imprimer__etat imprimer__etat--refus">
                <Icone nom="bloque" />
                PDF définitif pas encore possible.
              </p>
              <ul className="imprimer__raisons">
                {raisons.map((r) => (
                  <li key={`${r.etape}-${r.texte}`}>
                    <Link className="lien" href={`/projet/${projetId}/livre?etape=${r.etape}`} scroll={false}>
                      {ETAPES_DU_LIVRE.find((x) => x.id === r.etape)!.nom}
                    </Link>{" "}
                    · {r.texte}
                  </li>
                ))}
              </ul>
              <p className="imprimer__travail">
                <button type="button" className="btn" disabled={travail} aria-busy={travail || undefined} onClick={() => void creerTravail()}>
                  <Icone nom="papier" />
                  {travail ? "Création du PDF…" : "Créer un PDF de travail à la place"}
                </button>
              </p>
            </div>
          ) : fait ? (
            <p className="imprimer__etat imprimer__etat--fait">
              <Icone nom="coche" />
              <span>
                <b>Le livre est fait.</b> PDF définitif du {dernier.etat.replace(/^état du /, "")}.
              </span>
            </p>
          ) : (
            <>
              {dernier ? (
                <p className="imprimer__etat imprimer__etat--change">
                  <Icone nom="alerte" />
                  <span>
                    <b>Le livre a changé</b> depuis le PDF définitif du {dernier.etat.replace(/^état du /, "")}.
                  </span>
                </p>
              ) : (
                <p className="imprimer__etat imprimer__etat--pret">
                  <Icone nom="coche" />
                  <span>
                    <b>Le livre est prêt.</b> Il ne reste qu’à fabriquer le fichier.
                  </span>
                </p>
              )}
              {rappel ? (
                <div className="imprimer__rappel" role="group" aria-labelledby="rappel-t">
                  <p id="rappel-t" className="imprimer__rappel-titre">
                    À savoir avant de créer le PDF
                  </p>
                  <ul>
                    {rappels.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className="imprimer__cmd">
                    <button type="button" className="btn btn--primaire" disabled={calcul} aria-busy={calcul || undefined} onClick={() => void creer()}>
                      <Icone nom="papier" />
                      {calcul ? "Création du PDF…" : "Créer le PDF définitif"}
                    </button>
                    <button type="button" className="lien" disabled={calcul} onClick={() => setRappel(false)}>
                      Annuler
                    </button>
                  </p>
                </div>
              ) : (
                <p className="imprimer__cmd">
                  <button type="button" className="btn btn--primaire" disabled={calcul} aria-busy={calcul || undefined} onClick={demander}>
                    <Icone nom="papier" />
                    {calcul ? "Création du PDF…" : dernier ? "Nouveau PDF définitif…" : "Créer le PDF définitif…"}
                  </button>
                </p>
              )}
            </>
          )}
          <p className="imprimer__statut" role="status">
            {calcul ? "Quelques secondes : le livre est mis en pages sur le serveur." : erreur ?? ""}
          </p>

          {dernier ? (
            <div className="imprimer__suite">
              <h3>Et maintenant ?</h3>
              <ol>
                <li>
                  Préparez la couverture chez votre imprimeur.
                  <Bulle question="Pourquoi la couverture se fait-elle chez l’imprimeur ?">
                    <span>Son format dépend du papier et du nombre de pages : l’imprimeur le donne. Le PDF définitif est l’intérieur du livre.</span>
                  </Bulle>
                </li>
                <li>Envoyez-lui le PDF définitif et la couverture.</li>
              </ol>
            </div>
          ) : null}
        </section>

        {definitifs.length ? <PdfConserves definitifs={definitifs} placeOccupee={placeOccupee} /> : null}
      </div>

      <aside className="couverture" aria-labelledby="couverture-t">
        <h2 id="couverture-t" className="couverture__titre">
          <Icone nom="image" />
          La couverture, chez l’imprimeur
          <Bulle question="Que préparer pour la couverture ?">
            <span>L’imprimeur compose la couverture d’après son format : apportez-lui ces trois éléments.</span>
          </Bulle>
        </h2>
        <p>À préparer :</p>
        <ul>
          <li>
            une <b>image de face</b> au format A5 ;
          </li>
          <li>
            le <b>titre</b> et le nom de la classe ou de l’auteur ;
          </li>
          <li>
            le <b>texte de quatrième</b>.
          </li>
        </ul>
      </aside>
    </div>
  );
}

/** « 48 Ko », « 1,2 Mo », « 34 Mo » : la place d'un fichier, à la manière d'un explorateur de fichiers. */
const enMo = (octets: number) =>
  octets < 1_000_000
    ? `${Math.max(1, Math.round(octets / 1000))} Ko`
    : `${(octets / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: octets < 10_000_000 ? 1 : 0 })} Mo`;

/** Les PDF définitifs conservés : tous, le plus récent en tête ; chacun se supprime après confirmation sur place. */
function PdfConserves({ definitifs, placeOccupee }: { definitifs: DefinitifAffiche[]; placeOccupee: number }) {
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const supprimer = async (id: string) => {
    const r = await supprimerPdf(id);
    setASupprimer(null);
    if (!r.ok) setErreur(r.erreur);
  };
  return (
    <section className="conserves" aria-labelledby="conserves-t">
      <h2 id="conserves-t" className="imprimer__titre">
        PDF définitifs conservés
      </h2>
      <ul className="conserves__liste">
        {definitifs.map((d, i) => (
          <li key={d.id} className="conserve">
            <Icone nom="papier" />
            <span className="conserve__texte">
              <b>PDF définitif du {d.etat.replace(/^état du /, "")}</b>
              <small>
                A5 · {d.pages} pages · {enMo(d.taille)}
              </small>
              {d.aJour ? <small className="conserve__a-jour">Correspond au livre actuel.</small> : null}
            </span>
            {aSupprimer === d.id ? (
              <span className="conserve__confirmer" role="group" aria-label="Confirmer la suppression">
                <span>Le supprimer ? Il ne se retrouvera pas.</span>
                <button type="button" className="btn btn--petit btn--danger" onClick={() => void supprimer(d.id)}>
                  Supprimer
                </button>
                <button type="button" className="lien" onClick={() => setASupprimer(null)}>
                  Annuler
                </button>
              </span>
            ) : (
              <span className="conserve__cmd">
                <a className={`btn btn--petit${i === 0 && d.aJour ? " btn--primaire" : ""}`} href={`/livre/pdf/${d.id}`}>
                  Télécharger
                </a>
                <button type="button" className="lien conserve__supprimer" onClick={() => setASupprimer(d.id)} aria-label={`Supprimer le PDF définitif du ${d.etat.replace(/^état du /, "")}`}>
                  Supprimer
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="conserves__place">
        {definitifs.length} PDF · {enMo(placeOccupee)}
      </p>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </section>
  );
}
