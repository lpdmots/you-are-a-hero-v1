"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Bulle } from "@/composants/Bulle";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { ETAPES_DU_LIVRE, type RaisonDeRefus } from "@/domaine/livre";
import { commeLeLivre, type NomsDuPartage } from "@/domaine/partage";
import { couperUnCanal, mettreAJour, noms as reglerNoms, nouveauLien, ouvrirUnCanal } from "../../actions-partage";

/**
 * « Imprimer et partager », volet « Partager » (F12.1, F12.3), allégé à l'entretien de
 * l'étape 7 (16 octobre 2026) : l'état en une phrase, « Qui peut lire » en deux interrupteurs,
 * le rappel à cocher sur place à chaque ouverture et mise à jour (F12-AC17, AC20), le retrait
 * par le dernier interrupteur, et les noms repliés. « Prévisualiser » avant le partage,
 * « Ouvrir » sur le lien ensuite.
 */

export type PartageAffiche = {
  deClasse: boolean;
  /** La règle unique le permet (F11.2) */
  possible: boolean;
  raisons: RaisonDeRefus[];
  /** Le compte a une classe en cours : « À mes classes » est proposé (F12-AC24) */
  classes: boolean;
  noms: NomsDuPartage;
  /** Ce que le livre imprime des auteurs, pour les réglages des noms */
  livre: { titreEnImage: boolean; ligne: string; annee: string; auteurs: { enImage: boolean; nombre: number } | null };
  partage: {
    parLien: boolean;
    auxClasses: boolean;
    adresse: string;
    /** « 18 juin, 16 h 45 » */
    etatDu: string;
    aJour: boolean;
    /** Le dernier PDF définitif et la version ont-ils le même texte ? « inconnu » pour un PDF d'avant le partage */
    pdf: { etatDu: string; memeTexte: boolean | "inconnu" } | null;
  } | null;
};

type Canal = "lien" | "classes";
type Ouvert = { sorte: "ouvrir"; canal: Canal } | { sorte: "maj" } | { sorte: "couper"; canal: Canal } | { sorte: "lien" } | null;

export function VoletPartager({ projetId, p, rappels }: { projetId: string; p: PartageAffiche; rappels: string[] }) {
  const dire = useMessage();
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<{ texte: string; raisons?: RaisonDeRefus[] } | null>(null);
  const partage = p.partage;
  const parLien = partage?.parLien ?? false;
  const auxClasses = partage?.auxClasses ?? false;

  const faire = async (action: () => Promise<{ ok: true } | { ok: false; erreur: string; raisons?: RaisonDeRefus[] }>, message?: string) => {
    setEnCours(true);
    setErreur(null);
    const r = await action();
    setEnCours(false);
    if (!r.ok) return setErreur({ texte: r.erreur, raisons: r.raisons });
    setOuvert(null);
    if (message) dire({ texte: message });
  };

  const basculer = (canal: Canal, oui: boolean) => {
    setErreur(null);
    setOuvert(oui ? { sorte: "ouvrir", canal } : { sorte: "couper", canal });
  };
  const autreOuvert = (canal: Canal) => (canal === "lien" ? auxClasses : parLien);
  // Sans version lisible, un canal ne s'ouvre que si la règle le permet ; avec elle, l'autre canal la reprend telle quelle
  const ouvrable = Boolean(partage) || p.possible;

  return (
    <div className="partager">
      <section className="partager__principal" aria-labelledby="partage-t">
        <h2 id="partage-t" className="imprimer__titre">
          Version partagée
          <Bulle question="Qu’est-ce que la version partagée ?">
            <span>
              Une copie datée du livre, à lire en ligne. Vos corrections ne la changent pas tant que vous ne la mettez pas à jour. Elle ne montre jamais le
              travail de la classe.
            </span>
          </Bulle>
        </h2>

        <Etat projetId={projetId} p={p} onMettreAJour={() => setOuvert({ sorte: "maj" })} majOuverte={ouvert?.sorte === "maj"} />

        {ouvert?.sorte === "maj" ? (
          <Rappel
            deClasse={p.deClasse}
            rappels={rappels}
            action="Mettre à jour"
            enCours={enCours}
            onConfirmer={() => void faire(() => mettreAJour(projetId, true), "Version partagée mise à jour : les lecteurs lisent le livre corrigé.")}
            onAnnuler={() => setOuvert(null)}
          />
        ) : null}

        <section className="partager__carte" aria-labelledby="qui-t">
          <h3 id="qui-t" className="partager__carte-titre">
            Qui peut lire
          </h3>

          <Canal
            icone="lien"
            nom="Par un lien"
            phrase="Pour les familles : toute personne qui a le lien, sans compte."
            oui={parLien}
            ouvrable={ouvrable}
            onBasculer={(oui) => basculer("lien", oui)}
          >
            {ouvert?.sorte === "ouvrir" && ouvert.canal === "lien" ? (
              <Rappel deClasse={p.deClasse} rappels={partage ? [] : rappels} action="Partager" enCours={enCours}
                onConfirmer={() => void faire(() => ouvrirUnCanal(projetId, "lien", true), "Le lien est ouvert.")} onAnnuler={() => setOuvert(null)} />
            ) : ouvert?.sorte === "couper" && ouvert.canal === "lien" ? (
              <Couper
                question={autreOuvert("lien") ? "Couper le lien ?" : "Retirer le partage ?"}
                effet={autreOuvert("lien")
                  ? "Le lien affichera « Ce livre n’est plus partagé ». Vos classes le lisent toujours."
                  : "Le lien affichera « Ce livre n’est plus partagé »."}
                action={autreOuvert("lien") ? "Couper le lien" : "Retirer le partage"}
                enCours={enCours}
                onConfirmer={() => void faire(() => couperUnCanal(projetId, "lien"), autreOuvert("lien") ? "Le lien est coupé." : "Le partage est retiré.")}
                onAnnuler={() => setOuvert(null)}
              />
            ) : parLien && partage ? (
              <AdresseDuLien
                adresse={partage.adresse}
                changer={ouvert?.sorte === "lien"}
                enCours={enCours}
                onChanger={() => setOuvert({ sorte: "lien" })}
                onConfirmerChanger={() => void faire(() => nouveauLien(projetId), "Nouveau lien : l’ancien affiche « Ce livre n’est plus partagé ».")}
                onAnnuler={() => setOuvert(null)}
              />
            ) : null}
          </Canal>

          {p.classes ? (
            <Canal
              icone="eleves"
              nom="À mes classes"
              phrase="Vos élèves le trouvent dans « Lire », sans lien à distribuer."
              oui={auxClasses}
              ouvrable={ouvrable}
              onBasculer={(oui) => basculer("classes", oui)}
            >
              {ouvert?.sorte === "ouvrir" && ouvert.canal === "classes" ? (
                <Rappel deClasse={p.deClasse} rappels={partage ? [] : rappels} action="Partager" enCours={enCours}
                  onConfirmer={() => void faire(() => ouvrirUnCanal(projetId, "classes", true), "Vos classes peuvent lire le livre.")} onAnnuler={() => setOuvert(null)} />
              ) : ouvert?.sorte === "couper" && ouvert.canal === "classes" ? (
                <Couper
                  question={autreOuvert("classes") ? "Ne plus proposer le livre à vos classes ?" : "Retirer le partage ?"}
                  effet={autreOuvert("classes")
                    ? "Vos élèves ne le verront plus dans « Lire ». Le lien reste ouvert."
                    : "Vos élèves ne le verront plus dans « Lire »."}
                  action={autreOuvert("classes") ? "Ne plus le proposer" : "Retirer le partage"}
                  enCours={enCours}
                  onConfirmer={() => void faire(() => couperUnCanal(projetId, "classes"), autreOuvert("classes") ? "Vos classes ne voient plus le livre." : "Le partage est retiré.")}
                  onAnnuler={() => setOuvert(null)}
                />
              ) : null}
            </Canal>
          ) : null}
        </section>

        {erreur ? (
          <div className="erreur" role="alert">
            <p>{erreur.texte}</p>
            {erreur.raisons?.length ? <Raisons projetId={projetId} raisons={erreur.raisons} /> : null}
          </div>
        ) : null}

        <Noms projetId={projetId} p={p} />

        <p className="partager__voir">
          {!partage ? (
            <Link className="btn" href={`/projet/${projetId}/previsualiser`}>
              <Icone nom="oeil" />
              Prévisualiser
            </Link>
          ) : null}
          <span className="partager__jamais">
            <Icone nom="cadenas" />
            Le partage ne montre jamais le travail de la classe.
          </span>
        </p>
      </section>
    </div>
  );
}

/** L'état du partage en une phrase, et la mise à jour quand elle est possible (F12-AC09, F11-AC72). */
function Etat({ projetId, p, onMettreAJour, majOuverte }: { projetId: string; p: PartageAffiche; onMettreAJour: () => void; majOuverte: boolean }) {
  const partage = p.partage;
  if (!partage) {
    return p.possible ? (
      <p className="imprimer__etat imprimer__etat--neutre">
        <Icone nom="partager" />
        <span>
          <b>Ce livre n’est pas partagé.</b> Choisissez qui peut le lire.
        </span>
      </p>
    ) : (
      <div className="imprimer__refus">
        <p className="imprimer__etat imprimer__etat--refus">
          <Icone nom="bloque" />
          Partage pas encore possible.
        </p>
        <Raisons projetId={projetId} raisons={p.raisons} />
      </div>
    );
  }
  return (
    <div className="partager__etat">
      {partage.aJour ? (
        <p className="imprimer__etat imprimer__etat--fait">
          <Icone nom="coche" />
          <span>
            <b>Livre partagé</b>, à jour depuis le {partage.etatDu}.
          </span>
        </p>
      ) : (
        <p className="imprimer__etat imprimer__etat--change">
          <Icone nom="alerte" />
          <span>
            <b>Le livre a changé</b> depuis la version partagée du {partage.etatDu}.
          </span>
        </p>
      )}
      {!partage.aJour && !majOuverte ? (
        p.possible ? (
          <p className="imprimer__cmd">
            <button type="button" className="btn btn--primaire" onClick={onMettreAJour}>
              <Icone nom="refaire" />
              Mettre à jour le partage…
            </button>
          </p>
        ) : (
          <div className="imprimer__refus">
            <p className="partager__impossible">Mise à jour impossible pour l’instant : les lecteurs gardent la version du {partage.etatDu}.</p>
            <Raisons projetId={projetId} raisons={p.raisons} />
          </div>
        )
      ) : null}
      {partage.pdf ? (
        <p className="partager__pdf">
          {partage.pdf.memeTexte === "inconnu"
            ? `Comparaison impossible avec le PDF définitif du ${partage.pdf.etatDu}.`
            : partage.pdf.memeTexte
              ? `Même texte que le PDF définitif du ${partage.pdf.etatDu}.`
              : `Texte différent du PDF définitif du ${partage.pdf.etatDu}.`}
        </p>
      ) : null}
    </div>
  );
}

function Raisons({ projetId, raisons }: { projetId: string; raisons: RaisonDeRefus[] }) {
  return (
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
  );
}

function Canal({ icone, nom, phrase, oui, ouvrable, onBasculer, children }: {
  icone: "lien" | "eleves"; nom: string; phrase: string; oui: boolean; ouvrable: boolean; onBasculer: (oui: boolean) => void; children: ReactNode;
}) {
  return (
    <div className="canal">
      <span className="canal__signe" aria-hidden="true">
        <Icone nom={icone} />
      </span>
      <span className="canal__texte">
        <b>{nom}</b>
        <small>{phrase}</small>
      </span>
      <label className="inter canal__inter">
        <input type="checkbox" role="switch" checked={oui} disabled={!oui && !ouvrable} onChange={(e) => onBasculer(e.target.checked)} aria-label={nom} />
        <span className="inter__piste" aria-hidden="true" />
        <span>{oui ? "Activé" : "Désactivé"}</span>
      </label>
      {children ? <div className="canal__suite">{children}</div> : null}
    </div>
  );
}

/** Le rappel avant chaque partage et chaque mise à jour (F12-AC17), à cocher sur place. */
function Rappel({ deClasse, rappels, action, enCours, onConfirmer, onAnnuler }: {
  deClasse: boolean; rappels: string[]; action: string; enCours: boolean; onConfirmer: () => void; onAnnuler: () => void;
}) {
  const [relu, setRelu] = useState(false);
  return (
    <div className="imprimer__rappel partager__rappel" role="group" aria-labelledby="rappel-partage-t">
      <p id="rappel-partage-t" className="imprimer__rappel-titre">
        À relire avant de partager
      </p>
      {rappels.length ? (
        <>
          <p className="partager__a-savoir">À savoir :</p>
          <ul>
            {rappels.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      ) : null}
      <ul>
        <li>Aucun nom ni prénom réel dans le récit, sauf si vous l’avez voulu.</li>
        <li>Aucune photo où une personne est reconnaissable.</li>
        <li>Aucune image dont vous n’avez pas les droits.</li>
        {deClasse ? <li>Les autorisations des familles couvrent cette diffusion.</li> : null}
      </ul>
      <label className="partager__relu">
        <input type="checkbox" checked={relu} onChange={(e) => setRelu(e.target.checked)} />
        J’ai relu le livre sur ces points.
      </label>
      <p className="imprimer__cmd">
        <button type="button" className="btn btn--primaire" disabled={!relu || enCours} aria-busy={enCours || undefined} onClick={onConfirmer}>
          <Icone nom="partager" />
          {enCours ? "Un instant…" : action}
        </button>
        <button type="button" className="lien" disabled={enCours} onClick={onAnnuler}>
          Annuler
        </button>
      </p>
      <small className="partager__detecte">L’application ne détecte ni les noms ni les visages.</small>
    </div>
  );
}

/** Couper un canal, confirmé sur place : ce que le lien affichera est dit avant (F12-AC10). */
function Couper({ question, effet, action, enCours, onConfirmer, onAnnuler }: {
  question: string; effet: string; action: string; enCours: boolean; onConfirmer: () => void; onAnnuler: () => void;
}) {
  return (
    <div className="partager__couper" role="group" aria-label={question}>
      <p>
        <b>{question}</b> {effet}
      </p>
      <p className="imprimer__cmd">
        <button type="button" className="btn btn--danger" disabled={enCours} aria-busy={enCours || undefined} onClick={onConfirmer}>
          {action}
        </button>
        <button type="button" className="lien" disabled={enCours} onClick={onAnnuler}>
          Annuler
        </button>
      </p>
    </div>
  );
}

/** Le lien ouvert : son adresse, « Copier le lien », « Ouvrir », et « Changer de lien… » (F12-AC11). */
function AdresseDuLien({ adresse, changer, enCours, onChanger, onConfirmerChanger, onAnnuler }: {
  adresse: string; changer: boolean; enCours: boolean; onChanger: () => void; onConfirmerChanger: () => void; onAnnuler: () => void;
}) {
  const dire = useMessage();
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(adresse);
      dire({ texte: "Lien copié." });
    } catch {
      dire({ texte: "Le lien n’a pas pu être copié : sélectionnez-le à la main." });
    }
  };
  return (
    <div className="lien-de-lecture">
      <p className="lien-de-lecture__ligne">
        <input className="champ lien-de-lecture__adresse" readOnly value={adresse} aria-label="Lien de lecture" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn--petit" onClick={() => void copier()}>
          Copier le lien
        </button>
        <a className="btn btn--petit" href={adresse} target="_blank" rel="noreferrer">
          Ouvrir
        </a>
      </p>
      <small className="lien-de-lecture__note">
        Il se transmet, comme une adresse ; il n’est pas indexé par les moteurs de recherche, mais n’est pas secret pour autant.
      </small>
      {changer ? (
        <div className="partager__couper" role="group" aria-label="Changer de lien ?">
          <p>
            <b>Changer de lien ?</b> L’ancien affichera « Ce livre n’est plus partagé » ; il faudra redonner le nouveau.
          </p>
          <p className="imprimer__cmd">
            <button type="button" className="btn" disabled={enCours} aria-busy={enCours || undefined} onClick={onConfirmerChanger}>
              Changer de lien
            </button>
            <button type="button" className="lien" disabled={enCours} onClick={onAnnuler}>
              Annuler
            </button>
          </p>
        </div>
      ) : (
        <button type="button" className="lien lien-de-lecture__changer" onClick={onChanger}>
          Changer de lien…
        </button>
      )}
    </div>
  );
}

/**
 * Ce que la version montre des auteurs (F12.1, révisé le 16 octobre 2026) : la ligne de la page
 * de titre, retirée ou remplacée pour le partage ; la page des auteurs, affichée ou non.
 */
function Noms({ projetId, p }: { projetId: string; p: PartageAffiche }) {
  const [ouverts, setOuverts] = useState(false);
  const [noms, setNoms] = useState(p.noms);
  const [texte, setTexte] = useState(p.noms.texte ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const nomDeLaLigne = p.deClasse ? "Ligne de classe" : "Nom de l’auteur";
  const garder = async (n: NomsDuPartage) => {
    setNoms(n);
    setErreur(null);
    const r = await reglerNoms(projetId, n);
    if (!r.ok) setErreur(r.erreur);
  };
  const livre = [p.livre.ligne, p.livre.annee].filter(Boolean).join(", ");
  return (
    <section className="partager__carte partager__noms" aria-labelledby="noms-t">
      <h3 id="noms-t" className="partager__carte-titre">
        Noms affichés
      </h3>
      {!ouverts ? (
        <p className="partager__noms-ligne">
          {commeLeLivre(noms) ? "Comme dans le livre." : "Modifiés pour le partage ; le livre imprimé ne change pas."}{" "}
          <button type="button" className="lien" onClick={() => setOuverts(true)}>
            Modifier
          </button>
        </p>
      ) : (
        <div className="partager__noms-reglages">
          <p className="partager__noms-ligne">
            Le livre imprimé ne change pas.{" "}
            <button type="button" className="lien" onClick={() => setOuverts(false)}>
              Replier
            </button>
          </p>
          <div className="nom-partage">
            <span className="canal__texte">
              <b>{nomDeLaLigne}</b>
              <small>{p.livre.titreEnImage ? "La page de titre est une image : elle s’affiche telle quelle." : "Sous le titre, sur la première page."}</small>
            </span>
            {!p.livre.titreEnImage ? (
              <>
                <label className="inter canal__inter">
                  <input type="checkbox" role="switch" checked={noms.ligne} onChange={(e) => void garder({ ...noms, ligne: e.target.checked })} aria-label={nomDeLaLigne} />
                  <span className="inter__piste" aria-hidden="true" />
                  <span>{noms.ligne ? "Affichée" : "Retirée"}</span>
                </label>
                {noms.ligne ? (
                  <label className="nom-partage__texte">
                    <span>Texte affiché</span>
                    <input
                      className="champ"
                      value={texte}
                      placeholder={p.livre.ligne || "Comme dans le livre"}
                      maxLength={120}
                      onChange={(e) => setTexte(e.target.value)}
                      onBlur={() => void garder({ ...noms, texte: texte.trim() || null })}
                    />
                    <small>{texte.trim() ? `Le livre imprime : « ${livre} ».` : "Vide : celle du livre."}</small>
                  </label>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="nom-partage">
            <span className="canal__texte">
              <b>Page des auteurs</b>
              <small>
                {p.livre.auteurs
                  ? p.livre.auteurs.enImage
                    ? "Une image : affichée ou retirée en entier."
                    : `${p.livre.auteurs.nombre} prénom${p.livre.auteurs.nombre > 1 ? "s" : ""}, comme dans le livre.`
                  : "Le livre n’a pas de page des auteurs."}
              </small>
            </span>
            {p.livre.auteurs ? (
              <label className="inter canal__inter">
                <input type="checkbox" role="switch" checked={noms.auteurs} onChange={(e) => void garder({ ...noms, auteurs: e.target.checked })} aria-label="Page des auteurs" />
                <span className="inter__piste" aria-hidden="true" />
                <span>{noms.auteurs ? "Affichée" : "Retirée"}</span>
              </label>
            ) : null}
          </div>
          {p.partage ? <small className="partager__prochaine">Un changement vaut pour la prochaine mise à jour du partage.</small> : null}
        </div>
      )}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </section>
  );
}
