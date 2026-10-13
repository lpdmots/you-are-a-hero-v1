"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Bulle } from "@/composants/Bulle";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { TamponScene } from "@/composants/TamponScene";
import { nomPourEleves } from "@/domaine/eleves";
import { NOM_TAMPON, SIGNE_TAMPON, type Tampon } from "@/domaine/etats";
import { couleurDeChapitre, motSansEleve, referenceScene, type Chapitre, type ElevePlan, type Plan, type Scene } from "@/domaine/recit";
import {
  adresseDesFiltres, bilanDesEleves, compterEtats, filtrer, filtrerHorsEtat, grouper, lignesDuPlan, SANS_FILTRE, TAMPONS_DU_SUIVI, TAMPONS_PERSONNELS,
  type FiltresSuivi,
} from "@/domaine/suivi";
import { de, pluriel } from "@/domaine/texte";
import type { RappelTextes as Rappel } from "@/serveur/copie";
import { RappelTextes } from "../_commun/RappelTextes";
import { AideSuivi, LegendeDesEtats, QUI_S_EN_OCCUPE } from "./AideSuivi";

const vars = (rang: number): CSSProperties => {
  const c = couleurDeChapitre(rang);
  return { "--dos": c.dos, "--bandeau": c.bandeau, "--teinte": c.teinte } as CSSProperties;
};
const MINI: Record<Tampon, string> = { valider: "à valider", reprendre: "à reprendre", cours: "en cours", vide: "texte vide", valide: "validé", prete: "prête" };

/**
 * Suivi d'un projet (F06.5 ; docs/design.md, « Suivi repris après critique ») : où en est
 * chaque scène, et celles qui attendent une relecture. Une vue « Scènes » pour agir, une
 * vue « Élèves » pour la répartition. Les filtres vivent dans l'adresse : ils tiennent
 * pendant la visite, aller-retour vers une scène compris, et repartent de « Toutes » à
 * chaque nouvelle entrée. Un projet personnel a le même écran, sans ce qui concerne les
 * élèves (F06-AC91).
 */
export function Suivi({
  projet, plan, eleves, gardes, filtres: recus, vue: vueRecue, aideMasquee, aideVue, direct, revenu,
}: {
  projet: { id: string; deClasse: boolean };
  plan: Plan; eleves: ElevePlan[];
  /** Les scènes où un texte est gardé à part : seconde ligne de rappel (F08-AC11) */
  gardes: Rappel[];
  filtres: FiltresSuivi;
  vue: "scenes" | "eleves";
  aideMasquee: boolean; aideVue: boolean;
  /** Arrivé par « Voir », sur la carte du projet : pas d'écran d'aide (F06-AC60) */
  direct: boolean;
  /** Revenu d'une scène par « Retour au Suivi » : la liste retrouve l'endroit quitté (F06-AC54) */
  revenu: boolean;
}) {
  const [filtres, setFiltres] = useState(recus);
  const [vue, setVue] = useState<"scenes" | "eleves">(projet.deClasse ? vueRecue : "scenes");
  const [aide, setAide] = useState(!aideMasquee && !aideVue && !direct && !revenu);
  const [dejaVue, setDejaVue] = useState(aideVue || direct || revenu);
  const rangee = useRef<HTMLDivElement>(null);
  const adresse = adresseDesFiltres(filtres, vue);

  // Les filtres s'écrivent dans l'adresse, sans recharger la page : « Retour au Suivi » les retrouve
  const montrer = (suite: FiltresSuivi, autreVue: "scenes" | "eleves" = vue) => {
    setFiltres(suite);
    setVue(autreVue);
    const requete = adresseDesFiltres(suite, autreVue);
    window.history.replaceState(null, "", `/projet/${projet.id}/suivi${requete ? `?${requete}` : ""}`);
  };

  // Revenu d'une scène : la liste reprend l'endroit quitté, une fois que la page a fini de se placer en haut
  useEffect(() => {
    if (!revenu) return;
    const cle = `suivi:${projet.id}`;
    const y = Number(window.sessionStorage.getItem(cle));
    window.sessionStorage.removeItem(cle);
    const requete = adresseDesFiltres(recus, vueRecue);
    window.history.replaceState(null, "", `/projet/${projet.id}/suivi${requete ? `?${requete}` : ""}`);
    if (!Number.isFinite(y) || y <= 0) return;
    const replacer = () => window.scrollTo(0, y);
    requestAnimationFrame(() => requestAnimationFrame(replacer));
    window.setTimeout(replacer, 120);
  }, [revenu, projet.id, recus, vueRecue]);

  // Sur téléphone, les tampons défilent sur une rangée : le bord s'estompe du côté où il en reste
  useEffect(() => {
    const el = rangee.current;
    if (!el) return;
    const mesurer = () => {
      const g = el.scrollLeft > 4;
      const d = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      el.dataset.plus = `${g ? "g" : ""}${d ? "d" : ""}`;
    };
    mesurer();
    el.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
    el.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);
    return () => {
      el.removeEventListener("scroll", mesurer);
      window.removeEventListener("resize", mesurer);
    };
  }, [filtres.etat, vue, aide]);

  if (aide) {
    return (
      <AideSuivi
        deClasse={projet.deClasse}
        dejaVue={dejaVue}
        masquee={aideMasquee}
        onCommencer={() => {
          setAide(false);
          setDejaVue(true);
        }}
      />
    );
  }

  const toutes = lignesDuPlan(plan);
  const horsEtat = filtrerHorsEtat(toutes, filtres);
  const listees = filtrer(toutes, filtres);
  const comptes = compterEtats(horsEtat);
  const tampons = projet.deClasse ? TAMPONS_DU_SUIVI : TAMPONS_PERSONNELS;
  const chapitres = plan.parties.flatMap((p) => p.chapitres);
  const eleve = eleves.find((e) => e.id === filtres.eleve) ?? null;
  const nom = (e: ElevePlan) => nomPourEleves(e, eleves);
  const sesChapitres = eleve ? chapitres.filter((c) => c.attributions.some((a) => a.eleveId === eleve.id)) : [];
  const toutSonChapitre = sesChapitres.length > 1 ? "Tous ses chapitres" : "Tout son chapitre";
  const sansChapitre = projet.deClasse && chapitres.length > 0 ? eleves.filter((e) => !chapitres.some((c) => c.attributions.some((a) => a.eleveId === e.id))).length : 0;

  const lienScene = (s: Scene) => `/projet/${projet.id}/scene/${s.id}?de=suivi${adresse ? `&suivi=${encodeURIComponent(adresse)}` : ""}`;
  const quitter = () => window.sessionStorage.setItem(`suivi:${projet.id}`, String(window.scrollY));

  const qui = (s: Scene, c: Chapitre): ReactNode => {
    if (s.priseParEnseignant) return <span className="suivi-qui">Vous</span>;
    if (s.ancien) {
      return (
        <span className="suivi-qui">
          <Gommette prenom={s.ancien.prenom} couleur={s.ancien.couleur} taille="s" />
          {s.ancien.prenom} s’en occupait
        </span>
      );
    }
    const e = eleves.find((x) => x.id === s.priseParEleve);
    return e ? (
      <span className="suivi-qui">
        <Gommette prenom={e.prenom} couleur={e.couleur} taille="s" />
        {nom(e)}
      </span>
    ) : (
      <span className="suivi-qui suivi-qui--libre">{motSansEleve(c)}</span>
    );
  };

  // « Aucune scène pour : La lisière · Prête. Tout afficher » nomme les filtres en cause
  const aucune = (): ReactNode => {
    const tout = (
      <button type="button" className="lien" onClick={() => montrer(SANS_FILTRE, "scenes")}>
        Tout afficher
      </button>
    );
    if (eleve && sesChapitres.length === 0) {
      return (
        <p className="suivi-aucun">
          {nom(eleve)} n’a aucun chapitre. Le travail sur papier reste possible.{" "}
          <Link className="lien" href={`/projet/${projet.id}/plan`}>
            Attribuer un chapitre
          </Link>{" "}
          · {tout}
        </p>
      );
    }
    const actifs = [
      filtres.chapitre ? chapitres.find((c) => c.id === filtres.chapitre)?.titre : null,
      filtres.eleve === "moi" ? "vos scènes" : eleve ? (filtres.mode === "occupe" ? nom(eleve) : `tout le chapitre ${de(nom(eleve))}`) : null,
      filtres.etat !== "tous" ? NOM_TAMPON[filtres.etat] : null,
    ].filter(Boolean);
    return (
      <p className="suivi-aucun">
        {toutes.length === 0 ? "Ce projet n’a pas encore de scène." : `Aucune scène${actifs.length ? ` pour : ${actifs.join(" · ")}` : ""}.`}{" "}
        {toutes.length === 0 ? (
          <Link className="lien" href={`/projet/${projet.id}/plan`}>
            Ouvrir « Parties et chapitres »
          </Link>
        ) : (
          tout
        )}
      </p>
    );
  };

  const vueScenes = (
    <>
      <div className="suivi-etats">
        <span className="suivi-etats__lib" aria-hidden="true">
          État
        </span>
        <div className="suivi-etats__tampons" role="group" aria-label="Filtrer par état" ref={rangee}>
          <button type="button" className="tampon tampon--filtre" data-e="tous" aria-pressed={filtres.etat === "tous"} onClick={() => montrer({ ...filtres, etat: "tous" })}>
            Toutes <b>{horsEtat.length}</b>
          </button>
          {tampons.map((t) => (
            <button
              key={t}
              type="button"
              className="tampon tampon--filtre"
              data-e={t}
              aria-pressed={filtres.etat === t}
              // Celui qui ne compte aucune scène est éteint, et garde sa place
              disabled={comptes[t] === 0 && filtres.etat !== t}
              onClick={() => montrer({ ...filtres, etat: t })}
            >
              <Icone nom={SIGNE_TAMPON[t]} />
              {NOM_TAMPON[t]} <b>{comptes[t]}</b>
            </button>
          ))}
        </div>
        <Bulle question="Que veulent dire ces états ?">
          <LegendeDesEtats deClasse={projet.deClasse} />
        </Bulle>
        {/* Les fiches des scènes listées à ce moment-là ; un projet personnel n'en a pas (F06-AC57, F07-AC69) */}
        {projet.deClasse ? (
          <div className="suivi-fiches">
            <Link className="btn" href={`/projet/${projet.id}/fiches${adresse ? `?suivi=${encodeURIComponent(adresse)}` : ""}`}>
              <Icone nom="imprimer" />
              Imprimer les fiches de rédaction
            </Link>
            <Bulle question="Que sont les fiches de rédaction ?">
              <span>
                Une feuille par chapitre ou par élève : les scènes à écrire ou à reprendre, sous leur référence, avec leur consigne. Les élèves écrivent sur leur
                cahier, puis recopient. Une scène sans consigne n’est pas imprimée. Vous choisirez les scènes avant d’imprimer.
              </span>
            </Bulle>
          </div>
        ) : null}
      </div>
      {listees.length === 0 ? (
        aucune()
      ) : (
        <>
          <div className={`suivi-colonnes${projet.deClasse ? "" : " suivi-colonnes--seul"}`}>
            <span aria-hidden="true">Réf.</span>
            <span aria-hidden="true">Scène</span>
            <span aria-hidden="true">État</span>
            {projet.deClasse ? (
              <span>
                <span aria-hidden="true">Qui s’en occupe</span>
                <Bulle question="Que veut dire « Qui s’en occupe » ?">
                  <span>{QUI_S_EN_OCCUPE}</span>
                </Bulle>
              </span>
            ) : null}
            <span />
          </div>
          <div className="suivi-liste">
            {grouper(listees).map(({ chapitre, partie, scenes }) => {
              const compte = (etat: string) => scenes.filter((s) => s.etat === etat).length;
              const [aValider, aReprendre, validees, pretes] = [compte("valider"), compte("reprendre"), compte("valide"), compte("prete")];
              const duChapitre = chapitre.attributions.flatMap((a) => eleves.filter((e) => e.id === a.eleveId));
              return (
                <details key={chapitre.id} className="suivi-groupe" style={vars(chapitre.couleur)} open>
                  <summary>
                    <span className="suivi-groupe__dos" aria-hidden="true" />
                    <span className="suivi-groupe__titre">
                      <b>{chapitre.titre}</b>
                      <span>{partie.titre}</span>
                    </span>
                    <span className="suivi-groupe__meta">
                      {projet.deClasse ? (
                        duChapitre.length ? (
                          <span className="suivi-groupe__eleves" role="img" aria-label={`Élèves du chapitre : ${duChapitre.map(nom).join(", ")}`} title={duChapitre.map(nom).join(", ")}>
                            {duChapitre.map((e) => (
                              <Gommette key={e.id} prenom={e.prenom} couleur={e.couleur} taille="s" />
                            ))}
                          </span>
                        ) : (
                          <span className="suivi-groupe__eleves">Chapitre non attribué</span>
                        )
                      ) : null}
                      <span className="suivi-groupe__compte">
                        {scenes.length} scène{pluriel(scenes.length)}
                        {validees ? <span className="suivi-groupe__plus"> · {validees} validée{pluriel(validees)}</span> : null}
                        {pretes ? <span className="suivi-groupe__plus"> · {pretes} prête{pluriel(pretes)}</span> : null}
                        {aValider ? (
                          <>
                            {" "}
                            · <b>{aValider} à valider</b>
                          </>
                        ) : null}
                        {aReprendre ? <span className="suivi-groupe__plus"> · {aReprendre} à reprendre</span> : null}
                      </span>
                    </span>
                    <Icone nom="chevron-bas" className="suivi-groupe__chevron" />
                  </summary>
                  <table className="table-suivi table-scenes">
                    <colgroup>
                      <col />
                      <col />
                      <col className="col-etat" />
                      {projet.deClasse ? <col className="col-qui" /> : null}
                      <col className="col-action" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th scope="col">Réf.</th>
                        <th scope="col">Scène</th>
                        <th scope="col">État</th>
                        {projet.deClasse ? <th scope="col">Qui s’en occupe</th> : null}
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenes.map((s) => {
                        const ref = referenceScene(s.reference);
                        const relire = s.etat === "valider";
                        return (
                          <tr key={s.id}>
                            <td className="code">{ref}</td>
                            <td className="table-suivi__titre">
                              {/* Le titre ouvre la scène, comme le bouton de sa ligne */}
                              <Link className="table-suivi__lien" href={lienScene(s)} tabIndex={-1} onClick={quitter}>
                                {s.titre ?? <span className="sans-consigne">sans titre</span>}
                              </Link>
                              {!s.consigne.trim() && projet.deClasse ? <span className="sans-consigne">sans consigne</span> : null}
                            </td>
                            <td>
                              <TamponScene etat={s.etat} vide={s.texteVide} />
                            </td>
                            {projet.deClasse ? <td>{qui(s, chapitre)}</td> : null}
                            <td>
                              <Link className={`btn btn--petit${relire ? " btn--primaire" : ""}`} href={lienScene(s)} aria-label={`${relire ? "Relire" : "Ouvrir"} ${ref}`} onClick={quitter}>
                                {relire ? "Relire" : "Ouvrir"}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </details>
              );
            })}
          </div>
        </>
      )}
    </>
  );

  const vueEleves = (
    <div className="table-defile">
      <table className="table-suivi table-eleves">
        <thead>
          <tr>
            <th scope="col">Élève</th>
            <th scope="col">Chapitres</th>
            <th scope="col">Tout son chapitre</th>
            <th scope="col">S’en occupe</th>
            <th scope="col">À régler</th>
          </tr>
        </thead>
        <tbody>
          {bilanDesEleves(plan, eleves).map((b) => (
            <tr key={b.eleve.id} className={b.aRegler === "sans-chapitre" ? "ligne--alerte" : undefined}>
              <th scope="row">
                <span className="suivi-qui">
                  <Gommette prenom={b.eleve.prenom} couleur={b.eleve.couleur} taille="s" />
                  <b>{nom(b.eleve)}</b>
                </span>
              </th>
              <td>
                {b.chapitres.length ? (
                  b.chapitres.map((c) => (
                    <span key={c.id} className="chap-puce" style={vars(c.couleur)}>
                      {c.titre}
                    </span>
                  ))
                ) : (
                  <span className="suivi-qui--libre">Aucun chapitre</span>
                )}
              </td>
              <td data-lib="Tout son chapitre">
                {b.accessibles ? (
                  <button type="button" className="lien" onClick={() => montrer({ ...SANS_FILTRE, eleve: b.eleve.id, mode: "chapitre" }, "scenes")}>
                    {b.accessibles} scène{pluriel(b.accessibles)}
                  </button>
                ) : (
                  <span className="suivi-qui--libre">—</span>
                )}
              </td>
              <td data-lib="S’en occupe">
                {b.occupe ? (
                  <button type="button" className="lien" onClick={() => montrer({ ...SANS_FILTRE, eleve: b.eleve.id, mode: "occupe" }, "scenes")}>
                    {b.occupe} scène{pluriel(b.occupe)}
                  </button>
                ) : (
                  <span className="suivi-qui--libre">Aucune</span>
                )}{" "}
                {TAMPONS_DU_SUIVI.filter((t) => b.parEtat[t]).map((t) => (
                  <span key={t} className="mini-etat">
                    {b.parEtat[t]} {MINI[t]}
                  </span>
                ))}
              </td>
              <td>
                {b.aRegler === "sans-chapitre" ? (
                  <span className="signal-ligne">
                    <span className="signal">
                      <Icone nom="alerte" />
                      Sans chapitre
                    </span>
                    <Link className="lien" href={`/projet/${projet.id}/plan`}>
                      Attribuer un chapitre
                    </Link>
                  </span>
                ) : b.aRegler === "aucune-scene-modifiable" ? (
                  <span className="signal">
                    <Icone nom="alerte" />
                    Aucune scène modifiable
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {sansChapitre ? (
        <p className="suivi-rappel">
          <Icone nom="eleves" />
          <span>
            {sansChapitre} élève{pluriel(sansChapitre)} sans chapitre
          </span>
          {vue === "eleves" ? null : (
            <button type="button" className="lien" onClick={() => montrer(filtres, "eleves")}>
              Voir
            </button>
          )}
        </p>
      ) : null}
      <RappelTextes projetId={projet.id} scenes={gardes} />
      <div className="suivi-outils">
        {projet.deClasse ? (
          <div className="bascule" role="group" aria-label="Vue du suivi">
            <button type="button" aria-pressed={vue === "scenes"} onClick={() => montrer(filtres, "scenes")}>
              <Icone nom="feuille" />
              Scènes
            </button>
            <button type="button" aria-pressed={vue === "eleves"} onClick={() => montrer(filtres, "eleves")}>
              <Icone nom="eleves" />
              Élèves
            </button>
          </div>
        ) : null}
        {vue === "scenes" ? (
          <div className="suivi-champs">
            <label className="suivi-champ">
              <span>Chapitre</span>
              <span className="suivi-champ__select">
                <select aria-label="Chapitre" value={filtres.chapitre ?? ""} onChange={(e) => montrer({ ...filtres, chapitre: e.target.value || null })}>
                  <option value="">Tous les chapitres</option>
                  {chapitres.filter((c) => c.scenes.length).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titre}
                    </option>
                  ))}
                </select>
                <Icone nom="chevron-bas" />
              </span>
            </label>
            {projet.deClasse ? (
              <label className="suivi-champ">
                <span>Élève</span>
                <span className="suivi-champ__select">
                  <select aria-label="Élève" value={filtres.eleve ?? ""} onChange={(e) => montrer({ ...filtres, eleve: e.target.value || null, mode: "occupe" })}>
                    <option value="">Tous les élèves</option>
                    {eleves.map((e) => (
                      <option key={e.id} value={e.id}>
                        {nom(e)}
                      </option>
                    ))}
                    {/* « Moi », après les élèves, comme dans le menu « qui s'en occupe » (F06-AC93) */}
                    <option value="moi">Moi</option>
                  </select>
                  <Icone nom="chevron-bas" />
                </span>
              </label>
            ) : null}
            {eleve ? (
              <div className="suivi-selections">
                <div className="seg-mini" role="group" aria-label={`Scènes ${de(nom(eleve))}`}>
                  <button type="button" aria-pressed={filtres.mode === "occupe"} onClick={() => montrer({ ...filtres, mode: "occupe" })}>
                    Dont {nom(eleve)} s’occupe <span>{filtrerHorsEtat(toutes, { ...filtres, mode: "occupe" }).length}</span>
                  </button>
                  <button type="button" aria-pressed={filtres.mode === "chapitre"} onClick={() => montrer({ ...filtres, mode: "chapitre" })}>
                    {toutSonChapitre} <span>{filtrerHorsEtat(toutes, { ...filtres, mode: "chapitre" }).length}</span>
                  </button>
                </div>
                <Bulle question="Quelle différence entre ces deux sélections ?">
                  <span>
                    « Dont {nom(eleve)} s’occupe » : les scènes à son nom, à écrire ou à corriger. « {toutSonChapitre} » : toutes les scènes{" "}
                    {sesChapitres.length > 1 ? "de ses chapitres" : "de son chapitre"}, celles de ses camarades comprises.
                  </span>
                </Bulle>
              </div>
            ) : null}
          </div>
        ) : (
          <Bulle question="Que comptent ces nombres ?">
            <span>
              « Tout son chapitre » : les scènes que l’élève peut ouvrir, celles de ses camarades comprises. « S’en occupe » : celles à son nom, à écrire ou à corriger.
              Ces nombres ne mesurent pas ce que l’élève a écrit. Sans chapitre, le travail sur papier reste possible.
            </span>
          </Bulle>
        )}
        <button type="button" className="aide-bouton" title="Que fait-on ici ?" onClick={() => setAide(true)}>
          <Icone nom="aide" />
          Aide
        </button>
      </div>
      {vue === "eleves" ? vueEleves : vueScenes}
    </>
  );
}
