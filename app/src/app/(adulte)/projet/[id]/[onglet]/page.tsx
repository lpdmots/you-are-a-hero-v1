import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { MessageAuChargement } from "@/composants/MessageAuChargement";
import { estOnglet, NOM_ONGLET, ongletsDe, type Onglet } from "@/domaine/projets";
import { referenceScene } from "@/domaine/recit";
import { avertissementsAcceptes, conditionsDuLivre, estEtapeLivre, etatChemins, etatRelire, type EtapeLivre, type MarqueEtape } from "@/domaine/livre";
import { filtresDepuis } from "@/domaine/suivi";
import { exigerEnseignant } from "@/serveur/adulte";
import { textesGardesDuProjet } from "@/serveur/copie";
import { etatDuLivre } from "@/serveur/controles";
import { encouragementsDuProjet } from "@/serveur/encouragements";
import { projetDe } from "@/serveur/lectures";
import { elevesDeLaClasse, planDe, preparationDe } from "@/serveur/recit";
import { EnteteProjet } from "../_commun/EnteteProjet";
import { Plan } from "../_plan/Plan";
import { Suivi } from "../_suivi/Suivi";
import { PagePreparation } from "../_preparation/Preparation";
import { estEtapePreparation, etapeDOuverture, etapesDe } from "@/domaine/preparation";
import { Livre } from "../_livre/Livre";
import { afficherChemins, afficherRelire, rappelDe } from "../_livre/points";
import { instantaneDuLivre } from "@/serveur/livre/livre";
import { etatDeLOrdre, ordreDuContenu } from "@/serveur/livre/ordre";
import { contenuDuLivre } from "@/serveur/livre/contenu";
import { nomPourEleves } from "@/domaine/eleves";
import { etatEnMots, pdfDuProjet } from "@/serveur/livre/pdf";
import { aDesClassesEnCours, partageDuProjet, versionsDe } from "@/serveur/partage";
import { adresseDuSite } from "@/serveur/env";
import { codeAffiche, etatDuPartage, sortieAJour } from "@/domaine/partage";
import styles from "./projet.module.css";

type Props = { params: Promise<{ id: string; onglet: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, onglet } = await params;
  const projet = await projetDe(await exigerEnseignant(), id);
  return { title: projet && estOnglet(onglet) ? `${NOM_ONGLET[onglet]} — ${projet.titre}` : "Projet" };
}

// Ce que cet onglet deviendra, et à quelle étape du plan de réalisation.
const A_VENIR: Partial<Record<Onglet, string>> = {};

export default async function PageProjet({ params, searchParams }: Props) {
  const { id, onglet } = await params;
  const { message } = (await searchParams) as { message?: string };
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet || !estOnglet(onglet) || !ongletsDe().includes(onglet)) notFound();
  const deClasse = projet.organisation === "classe";
  const aChoix = projet.recit === "choix";

  let contenu;
  if (onglet === "plan") {
    const [plan, eleves, magasin] = await Promise.all([planDe(enseignant, projet.id), elevesDeLaClasse(enseignant, projet.classe?.id ?? null), cookies()]);
    contenu = (
      <Plan
        projet={{ id: projet.id, titre: projet.titre, deClasse, aChoix, classe: projet.classe ? { id: projet.classe.id, nom: projet.classe.nom } : null }}
        plan={plan}
        eleves={eleves}
        aideMasquee={enseignant.aidesMasquees.includes("plan")}
        aideVue={magasin.get("aide-plan")?.value === "vue"}
      />
    );
  } else if (onglet === "preparation") {
    const [preparation, plan, magasin, demande] = await Promise.all([preparationDe(enseignant, projet.id), planDe(enseignant, projet.id), cookies(), searchParams]);
    if (!preparation) notFound();
    // L'étape demandée, sinon la première étape de l'histoire sans texte retenu (F02, 17 octobre 2026)
    const etape = estEtapePreparation(demande.etape) && etapesDe(projet.recit).includes(demande.etape) ? demande.etape : etapeDOuverture(preparation, plan.parties.length);
    contenu = (
      <PagePreparation
        projet={{ id: projet.id, titre: projet.titre, organisation: projet.organisation, recit: projet.recit }}
        preparation={preparation}
        plan={plan}
        etape={etape}
        aideMasquee={enseignant.aidesMasquees.includes("preparation")}
        aideVue={magasin.get("aide-preparation")?.value === "vue"}
      />
    );
  } else if (onglet === "suivi") {
    const [plan, eleves, gardes, magasin, demande, encouragements] = await Promise.all([
      planDe(enseignant, projet.id), elevesDeLaClasse(enseignant, projet.classe?.id ?? null), textesGardesDuProjet(enseignant, projet.id), cookies(), searchParams,
      // Un projet personnel n'a ni encouragements ni classement (F07.5)
      deClasse ? encouragementsDuProjet(enseignant, projet.id) : undefined,
    ]);
    contenu = (
      <Suivi
        projet={{ id: projet.id, deClasse }}
        plan={plan}
        eleves={eleves}
        gardes={gardes}
        encouragements={encouragements}
        filtres={filtresDepuis(demande)}
        vue={demande.vue === "eleves" ? "eleves" : "scenes"}
        aideMasquee={enseignant.aidesMasquees.includes("suivi")}
        aideVue={magasin.get("aide-suivi")?.value === "vue"}
        direct={demande.direct === "1"}
        revenu={demande.revenu === "1"}
      />
    );
  } else if (onglet === "livre") {
    const [livre, plan, magasin, demande, pdf, instantane] = await Promise.all([
      etatDuLivre(enseignant, projet.id), planDe(enseignant, projet.id), cookies(), searchParams, pdfDuProjet(enseignant, projet.id), instantaneDuLivre(enseignant, projet.id),
    ]);
    if (!livre || !instantane) notFound();
    const travail = pdf.find((x) => x.sorte === "travail");
    const acceptes = avertissementsAcceptes(livre.problemes, livre.acceptations, livre.changements);
    const chemins = aChoix ? etatChemins(livre.problemes, acceptes, livre.cheminsVerifies) : null;
    const relire = etatRelire(livre.problemes, acceptes, livre.livreRelu);
    // « Mettre en page » s'ouvre quand les deux premières étapes sont terminées, déclarations comprises, puis ne se referme plus (F11.6)
    const pageOuverte = livre.miseEnPageOuverte || (relire.terminee && (chemins?.terminee ?? true));
    if (pageOuverte && !livre.miseEnPageOuverte) await enseignant.supabase.from("projets").update({ mise_en_page_ouverte_le: new Date().toISOString() }).eq("id", projet.id);
    // « Mettre en page » est cochée par sa déclaration ; « Imprimer et partager » s'ouvre à la
    // première, ne se referme plus, et dit « il reste à faire » si une étape d'avant le dit (F11-AC62, AC77)
    const sortieOuverte = livre.imprimerOuvert || livre.miseEnPageConvient;
    const avantTermine = relire.terminee && (chemins?.terminee ?? true);
    // L'ordre des passages et son doute (F11.6) : seulement une fois « Mettre en page » ouverte
    const ordre = aChoix && pageOuverte ? await etatDeLOrdre(enseignant, projet.id, instantane.empreinte) : null;
    const douteOrdre = Boolean(ordre?.doute);
    // La règle unique du PDF définitif (F11.2) ; l'étape d'arrivée est cochée quand il est à jour
    const conditions = conditionsDuLivre(livre.problemes, { aChoix, convient: livre.miseEnPageConvient, doute: douteOrdre, imprimerOuvert: sortieOuverte });
    const definitifs = pdf.filter((x) => x.sorte === "definitif");
    const aJour = conditions.pdf.possible && definitifs[0]?.empreinte === instantane.empreinte;
    // La version partagée (F12.1) : comparée à ce que le lecteur verrait aujourd'hui, et au dernier PDF définitif
    const [partage, classesEnCours] = sortieOuverte ? await Promise.all([partageDuProjet(enseignant, projet.id), aDesClassesEnCours(enseignant)]) : [null, false];
    const actuelle = partage ? versionsDe(instantane, partage.noms) : null;
    const etatPartage = etatDuPartage(partage?.version ?? null, { empreinte: actuelle?.empreinte ?? "" }, definitifs[0] ?? null);
    const marques: Record<EtapeLivre, MarqueEtape> = {
      relire: relire.marque,
      chemins: chemins?.marque ?? null,
      page: !pageOuverte ? "fermee" : douteOrdre ? "reste" : livre.miseEnPageConvient ? "coche" : null,
      // Cochée quand tout ce qui a été produit est à jour : PDF définitif, version partagée (F11-AC108)
      sortie: !sortieOuverte
        ? "fermee"
        : !avantTermine || (etatPartage.sorte === "partage" && !etatPartage.aJour)
          ? "reste"
          : sortieAJour({ existe: definitifs.length > 0, aJour }, { existe: etatPartage.sorte === "partage", aJour: etatPartage.sorte === "partage" && etatPartage.aJour }) ? "coche" : null,
    };
    const contenuLivre = await contenuDuLivre(enseignant, projet.id);
    const eleves = await elevesDeLaClasse(enseignant, projet.classe?.id ?? null);
    // L'étape demandée, sinon la dernière quittée, sinon « Relire » la première fois (F11.6)
    const valide = (x: unknown): x is EtapeLivre => estEtapeLivre(x) && (aChoix || x !== "chemins");
    const etape: EtapeLivre = valide(demande.etape) ? demande.etape : valide(livre.derniereEtape) ? livre.derniereEtape : "relire";
    const noms = Object.fromEntries(
      plan.parties.flatMap((p) => p.chapitres.flatMap((c) => c.scenes.map((s) => {
        const numero = instantane.livre.passages.find((x) => x.sceneId === s.id)?.numero;
        return [s.id, `${numero ? `n° ${numero} · ` : ""}${referenceScene(s.reference)}`];
      }))),
    );
    contenu = (
      <Livre
        projet={{ id: projet.id, aChoix, deClasse }}
        etape={etape}
        marques={marques}
        chemins={chemins ? afficherChemins(chemins, plan, projet.id) : null}
        relire={afficherRelire(relire, plan, projet.id)}
        pdfDeTravail={travail ? { id: travail.id, etat: etatEnMots(travail.etatDu), pages: travail.pages } : null}
        empreinte={instantane.empreinte}
        noms={noms}
        numeros={Object.fromEntries(instantane.livre.passages.flatMap((x) => (x.numero ? [[x.sceneId, x.numero]] : [])))}
        convient={livre.miseEnPageConvient}
        douteOrdre={douteOrdre}
        passages={
          aChoix && pageOuverte && contenuLivre
            ? {
                ...ordreDuContenu(contenuLivre),
                titres: Object.fromEntries(plan.parties.flatMap((p) => p.chapitres.flatMap((c) => c.scenes.map((x) => [x.id, x.titre ?? ""])))),
                nouvellesPages: plan.parties.flatMap((p) => p.chapitres.flatMap((c) => c.scenes.filter((x) => x.nouvellePage).map((x) => x.id))),
              }
            : null
        }
        imprimer={
          sortieOuverte
            ? {
                possible: conditions.pdf.possible,
                raisons: conditions.pdf.raisons,
                rappels: conditions.rappels.map((p) => rappelDe(p, noms)),
                definitifs: definitifs.map((x) => ({ id: x.id, etat: etatEnMots(x.etatDu), pages: x.pages, taille: x.taille, aJour: x.empreinte === instantane.empreinte })),
                placeOccupee: definitifs.reduce((n, x) => n + x.taille, 0),
                voletDemande: demande.volet === "partager" ? "partager" : undefined,
                partager: {
                  deClasse,
                  possible: conditions.partage.possible,
                  raisons: conditions.partage.raisons,
                  classes: classesEnCours,
                  noms: partage?.noms ?? { ligne: true, texte: null, auteurs: true },
                  livre: {
                    titreEnImage: contenuLivre?.pages.titre.forme === "image",
                    ligne: contenuLivre?.pages.titre.ligne ?? "",
                    annee: contenuLivre?.pages.titre.annee ?? "",
                    auteurs: contenuLivre?.pages.auteurs.presente ? { enImage: contenuLivre.pages.auteurs.forme === "image", nombre: contenuLivre.pages.auteurs.noms.length } : null,
                  },
                  partage: partage?.version && etatPartage.sorte === "partage"
                    ? {
                        parLien: partage.parLien,
                        auxClasses: partage.auxClasses,
                        adresse: `${adresseDuSite((await headers()).get("host"))}/lire/${codeAffiche(partage.code)}`,
                        etatDu: etatEnMots(partage.version.etatDu).replace(/^état du /, ""),
                        aJour: etatPartage.aJour,
                        pdf: definitifs[0] && etatPartage.memeTexteQueLePdf !== null
                          ? { etatDu: etatEnMots(definitifs[0].etatDu).replace(/^état du /, ""), memeTexte: etatPartage.memeTexteQueLePdf }
                          : null,
                      }
                    : null,
                },
              }
            : null
        }
        miseEnPage={
          pageOuverte && contenuLivre
            ? {
                titre: projet.titre, reglages: contenuLivre.reglages, pages: contenuLivre.pages,
                des: contenuLivre.preparation?.feuille?.on ? contenuLivre.preparation.feuille.des : 0,
                feuille: aChoix && contenuLivre.preparation?.feuille?.on && contenuLivre.preparation.feuille.sections.length ? contenuLivre.preparation.feuille.sections.map((x) => x.titre) : null,
                prenoms: eleves.map((x) => nomPourEleves(x, eleves)),
                aDesEnigmes: plan.liens.some((l) => l.cache),
                avecRegles: Boolean(contenuLivre.preparation?.regles.trim()),
                ordre,
                parties: aChoix
                  ? plan.parties.map((p) => {
                      const ids = new Set(p.chapitres.flatMap((c) => c.scenes.map((x) => x.id)));
                      const lesNumeros = instantane.livre.passages.filter((x) => ids.has(x.sceneId) && x.numero && !x.numeroFixe).map((x) => x.numero!);
                      return { id: p.id, titre: p.titre, avecPrecedente: p.groupeAvecPrecedente, numeros: lesNumeros.length ? ([Math.min(...lesNumeros), Math.max(...lesNumeros)] as [number, number]) : null };
                    })
                  : null,
              }
            : null
        }
        aideMasquee={{ relire: enseignant.aidesMasquees.includes("livre-relire"), chemins: enseignant.aidesMasquees.includes("livre-chemins") }}
        aideVue={magasin.get("aide-livre")?.value === "vue"}
      />
    );
  } else {
    contenu = (
      <>
        <section className={styles.aVenir} aria-labelledby="a-venir">
          <h2 id="a-venir">{NOM_ONGLET[onglet]}</h2>
          <p>{A_VENIR[onglet]}</p>
        </section>
      </>
    );
  }

  return (
    <div className="page">
      {message === "cree" ? <MessageAuChargement texte={`« ${projet.titre} » est créé. Commencez par la préparation.`} /> : null}
      {message === "cree-sans-image" ? (
        <MessageAuChargement texte={`« ${projet.titre} » est créé, mais son image n’a pas pu être importée. Choisissez-la depuis les réglages du projet.`} />
      ) : null}
      <EnteteProjet enseignant={enseignant} projet={projet} onglet={onglet} />
      {contenu}
    </div>
  );
}
