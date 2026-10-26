/**
 * Les textes des pages publiques et des modèles à télécharger (F14, « Pages publiques »,
 * « Textes juridiques », « Ce qu'une école peut demander sur les données »). Rédigés par Claude
 * le 20 octobre 2026 ; une relecture par un juriste est recommandée (avis extérieur, qui ne
 * bloque pas l'ouverture). Ils vivent ici, en un seul endroit, pour la page et pour le fichier
 * à télécharger.
 *
 * Qui édite et vend le site est dans `EDITEUR`.
 */

/**
 * L'éditeur du site, qui vend aussi le pass et les étoiles (F14, « Textes juridiques ») : la
 * micro-entreprise du frère du porteur, au nom de laquelle est aussi le compte Stripe (décidé
 * par le porteur le 21 octobre 2026). Le téléphone est celui du porteur, qui répond pour le site.
 */
export const EDITEUR = {
  nom: "Yohann Coussot, entrepreneur individuel",
  adresse: "6 rue des Morands, 71210 Saint-Eusèbe, France",
  siret: "837 766 526 00029",
  telephone: "+33 6 86 80 54 14",
  tva: "TVA non applicable, article 293 B du code général des impôts",
  contact: "contact@iletaituneclasse.com",
  site: "iletaituneclasse.com",
} as const;

export const PHRASE_DU_SUPPORT = "Il était une classe est fait par un enseignant qui a sa classe : la réponse peut prendre quelques jours.";

/** Un texte : des sections, chacune un titre et des paragraphes ; une ligne qui commence par « – » est un élément de liste. */
export type Section = { titre: string; paragraphes: string[] };
export type Document = { titre: string; chapeau: string; misAJour: string; sections: Section[] };

const MAJ = "21 octobre 2026";

export const CONDITIONS: Document = {
  titre: "Conditions d’utilisation",
  chapeau: "Ce que vous pouvez attendre d’Il était une classe, et ce que l’outil attend de vous.",
  misAJour: "25 octobre 2026",
  sections: [
    {
      titre: "Le service",
      paragraphes: [
        "Il était une classe est un outil en ligne pour écrire un livre, seul ou avec sa classe : préparer l’histoire, faire écrire les élèves, relire, composer le livre, l’imprimer et le partager.",
        `Il est édité et vendu par ${EDITEUR.nom}, ${EDITEUR.adresse}, SIRET ${EDITEUR.siret} ; ses coordonnées sont dans les mentions légales.`,
        "L’outil est gratuit. Des aides par l’intelligence artificielle, facultatives, s’utilisent avec des étoiles : un nouveau compte en reçoit pour essayer. Quand la vente est ouverte, un livre gratuit compte au plus 40 scènes et 10 images ; un pass, payé une fois pour un livre, lève ces limites pour ce livre et donne des étoiles. Des recharges d’étoiles s’achètent aussi.",
      ],
    },
    {
      titre: "Votre compte",
      paragraphes: [
        "Le compte est celui d’un adulte, enseignant ou auteur. Vous en gardez le mot de passe pour vous ; ce qui se fait avec votre compte est réputé fait par vous.",
        "Les élèves n’ont pas de compte : ils entrent dans la classe que vous ouvrez sur un ordinateur, avec un code que vous leur donnez.",
      ],
    },
    {
      titre: "Ce que vous y mettez",
      paragraphes: [
        "Les textes, les images et les livres restent à leurs auteurs. Vous donnez seulement à l’éditeur le droit de les garder, de les afficher et de les composer pour vous, le temps que votre compte existe.",
        "Vous êtes responsable de ce que vous et vos élèves y mettez. Avant de proposer un livre à la bibliothèque du site, faites signer l’autorisation de diffusion par les représentants légaux des élèves : un modèle est fourni dans l’aide.",
      ],
    },
    {
      titre: "Ce qui est interdit",
      paragraphes: [
        "– un contenu illicite, haineux, violent ou pornographique, ou qui porte atteinte à la vie privée ou aux droits d’autrui ;",
        "– les données sensibles sur les élèves (santé, religion, situation familiale…) : l’outil n’en a pas besoin ;",
        "– toute tentative d’entrer dans le compte ou la classe d’un autre, ou de gêner le service.",
      ],
    },
    {
      titre: "Signaler un livre et le retirer",
      paragraphes: [
        `Qui veut signaler un livre partagé écrit à ${EDITEUR.contact}, avec son lien. L’éditeur peut alors retirer le partage : le lien ne mène plus au livre, et l’adulte qui l’a partagé en est averti par courriel. Son projet ne change pas.`,
      ],
    },
    {
      titre: "La bibliothèque du site",
      paragraphes: [
        "Un livre terminé peut être proposé à la bibliothèque du site, où tout le monde le lit, sans compte. L’éditeur le relit avant de le publier, avec l’aide d’une intelligence artificielle ; il peut le refuser en disant pourquoi.",
        "En proposant un livre, vous permettez à l’éditeur de l’afficher publiquement et gratuitement tant qu’il est dans la bibliothèque. Vous attestez avoir l’autorisation écrite des représentants légaux de chaque élève dont un texte ou un dessin y figure, ou, pour votre propre livre, en être l’auteur et avoir les droits de ses images.",
        "Vous pouvez le retirer de la bibliothèque à tout moment ; l’éditeur aussi, en vous disant pourquoi.",
      ],
    },
    {
      titre: "Les aides par l’intelligence artificielle",
      paragraphes: [
        "Les aides proposent ; vous décidez. Ce qu’elles écrivent peut se tromper : relisez avant de garder. Elles s’éteignent toutes depuis « Mon compte ».",
        "Ce qu’elles reçoivent part chez leurs fournisseurs, Anthropic et OpenAI, aux États-Unis ; jamais le prénom ni le nom d’un élève. La liste est dans la page « Confidentialité ». Chaque aide use des étoiles selon ce qu’elle coûte ; une aide qui échoue n’en use pas.",
        "Une image créée par l’IA qui ne montre aucun personnage, un lieu ou un décor, peut rejoindre la bibliothèque d’images, où tout enseignant inscrit peut la choisir pour ses projets. L’éditeur relit chaque image avant de la publier. Vous pouvez le refuser depuis « Mon compte ». Une image publiée reste dans la bibliothèque, même si vous supprimez votre compte ; écrivez au créateur pour la retirer.",
      ],
    },
    {
      titre: "Le paiement",
      paragraphes: [
        `Les prix sont en euros, sans TVA : ${EDITEUR.tva}.`,
        "Le paiement se fait par carte, sur la page de paiement de Stripe ; l’éditeur ne voit jamais le numéro de la carte. Une facture est envoyée à chaque paiement.",
        "Le pass et les étoiles donnent un accès immédiat : en payant, vous demandez cet accès immédiat et renoncez à votre droit de rétractation, ce que la page de paiement vous fait confirmer.",
        "Le pass vaut pour le livre pour lequel il est acheté, tant que le compte existe ; il ne s’arrête pas et ne se renouvelle pas.",
      ],
    },
    {
      titre: "Disponibilité",
      paragraphes: [
        "L’éditeur fait de son mieux pour que l’outil marche et que rien ne se perde : la base et les images sont sauvegardées chaque nuit. Il ne peut pas promettre qu’il n’y aura jamais de panne. Imprimez ou enregistrez le PDF de vos livres finis.",
      ],
    },
    {
      titre: "Supprimer",
      paragraphes: [
        "Vous pouvez supprimer à tout moment votre compte depuis « Mon compte » : tout ce qu’il contient est effacé aussitôt, et ses livres partagés ne sont plus lisibles.",
        "Un compte où personne ne s’est connecté depuis cinq ans reçoit un courriel ; sans connexion dans les trente jours, il est supprimé de la même façon.",
      ],
    },
    {
      titre: "Droit applicable et contact",
      paragraphes: [
        "Ces conditions relèvent du droit français. Elles peuvent changer ; la date de mise à jour est en tête de cette page.",
        `Pour toute question : ${EDITEUR.contact}. ${PHRASE_DU_SUPPORT}`,
      ],
    },
  ],
};

/** Ce qui part à l'IA, aide par aide (F13, « Ce qui est transmis »), dit pour les familles et les écoles. */
const TRANSMIS = [
  "– la correction : les paragraphes de la scène, sa consigne, les noms des personnages et des objets de l’histoire ;",
  "– la consigne, les idées de choix, la préparation, les parties et les chapitres, les titres : ce que l’adulte a écrit pour préparer l’histoire, et les titres et consignes des scènes ;",
  "– l’écriture d’une scène vide : sa consigne, son titre et la fin des scènes qui y mènent ;",
  "– les images : l’idée d’illustration, le texte de la scène, le style choisi, la description et le portrait des personnages ;",
  "– la bibliothèque d’images : la vignette d’une image acceptée par l’éditeur, pour en tirer les mots-clés ;",
  "– la bibliothèque des livres : la présentation d’un livre proposé, d’après la préparation et son début ; puis, pour l’éditeur, le livre proposé entier, ses textes et ses images, sans la page des auteurs ni la ligne de la page de titre.",
];

export const CONFIDENTIALITE: Document = {
  titre: "Confidentialité",
  chapeau: "Ce qui est gardé, où, combien de temps, ce qui part à l’IA, et comment tout supprimer.",
  misAJour: "25 octobre 2026",
  sections: [
    {
      titre: "Qui fait quoi",
      paragraphes: [
        `Le site est édité par ${EDITEUR.nom} (${EDITEUR.contact}).`,
        "Quand un enseignant d’une école publique utilise l’outil avec sa classe, le responsable des données de ses élèves est l’Éducation nationale (le directeur académique des services de l’Éducation nationale) ; l’éditeur agit pour son compte, en sous-traitant. Un contrat de sous-traitance type se télécharge dans l’aide, pour l’école qui le demande.",
      ],
    },
    {
      titre: "Ce qui est gardé",
      paragraphes: [
        "– pour l’adulte : son adresse électronique, le nom qu’il affiche aux élèves, ses réglages ;",
        "– pour une classe : son nom et son année, le prénom de chaque élève et, s’il est donné, son nom ; les codes des élèves et le mot de passe de la classe, chiffrés ;",
        "– les histoires : textes, consignes, remarques de l’enseignant, images importées ou créées, livres composés et partagés ;",
        "– un journal des appels aux aides IA, sans leur contenu : la date, l’aide, son coût ;",
        "– pour un achat : ce qui a été acheté, son montant et sa date ; le paiement lui-même se fait chez Stripe, qui garde les données de la carte.",
      ],
    },
    {
      titre: "Où",
      paragraphes: [
        "– Vercel (le site et la mesure d’audience) et Supabase (la base et les images), en Europe, à Paris ;",
        "– Amazon Web Services, à Paris : la sauvegarde de chaque nuit et l’envoi des courriels ;",
        "– Anthropic et OpenAI, aux États-Unis : les aides IA, seulement quand l’adulte en demande une ;",
        "– Stripe : le paiement, seulement quand l’adulte achète.",
      ],
    },
    {
      titre: "Ce qui part à l’IA",
      paragraphes: [
        "Seulement quand l’adulte demande une aide, et seulement ce dont elle a besoin :",
        ...TRANSMIS,
        "Ne partent jamais : le prénom ou le nom d’un élève, la classe, l’école, le nom de l’adulte, les remarques, les encouragements, les codes. Les élèves n’ont accès à aucune aide IA.",
        "Le texte d’une scène envoyé à la correction peut contenir le prénom d’un camarade, si l’élève l’a écrit dans son histoire : l’enseignant le voit avant de demander l’aide.",
        "Ces fournisseurs n’utilisent pas ce qu’ils reçoivent ainsi pour entraîner leurs modèles, selon leurs conditions d’utilisation de l’API, et ne le gardent que le temps de contrôler les abus.",
      ],
    },
    {
      titre: "Combien de temps",
      paragraphes: [
        "Tout est gardé tant que le compte existe, et rien ne s’efface seul, sauf un compte où personne ne s’est connecté depuis cinq ans : il reçoit un courriel, puis il est supprimé trente jours plus tard, sans connexion entre-temps.",
        "Les sauvegardes de la nuit sont gardées quatre-vingt-dix jours, puis s’effacent d’elles-mêmes.",
      ],
    },
    {
      titre: "Mesure d’audience, sans publicité",
      paragraphes: [
        "Sur l’accueil, la bibliothèque, l’aide, ces textes et les pages d’entrée de l’adulte, Vercel compte les pages vues et la vitesse d’affichage, sans témoin et sans reconnaître un visiteur d’un jour à l’autre. Il compte aussi, sans nom ni adresse, les comptes et les projets créés, et les achats.",
        "Rien n’est mesuré dans l’espace des élèves, dans l’outil de l’adulte ni dans les livres lus en ligne. Aucune publicité, aucune revente de données.",
      ],
    },
    {
      titre: "Les témoins",
      paragraphes: [
        "Le site ne pose que des témoins nécessaires, sans demander d’accord :",
        "– la connexion de l’adulte ;",
        "– sur l’ordinateur d’une classe, la classe ouverte, et le compte des codes faux, qui bloque les essais au hasard ;",
        "– les écrans d’aide déjà vus.",
        "Le navigateur garde aussi, sans témoin et sans rien envoyer, où un lecteur en est de sa lecture et quelques réglages d’affichage.",
        "Dans la bibliothèque, pour qu’un lecteur donne un seul cœur à un livre et puisse le retirer, son navigateur garde un identifiant tiré au hasard, qui ne dit rien de lui ; le site n’en garde qu’une empreinte, avec celle de l’adresse réseau, qui sert seulement à limiter les cœurs d’une même adresse dans la journée.",
      ],
    },
    {
      titre: "Supprimer et vos droits",
      paragraphes: [
        "L’adulte supprime une scène ou un chapitre (corbeille, puis « Supprimer pour de bon »), une classe passée et ses élèves, ou tout son compte, depuis l’outil, sans rien demander à personne.",
        `Pour exercer vos droits d’accès, de rectification ou d’effacement, ou pour toute question : ${EDITEUR.contact}. Vous pouvez aussi saisir la Commission nationale de l’informatique et des libertés (cnil.fr).`,
      ],
    },
  ],
};

export const MENTIONS_LEGALES: Document = {
  titre: "Mentions légales",
  chapeau: "Qui édite ce site, et qui l’héberge.",
  misAJour: MAJ,
  sections: [
    {
      titre: "Édition",
      paragraphes: [
        `Le site ${EDITEUR.site} est édité par ${EDITEUR.nom}, qui en est le directeur de la publication.`,
        `Adresse : ${EDITEUR.adresse}. SIRET : ${EDITEUR.siret}. ${EDITEUR.tva}.`,
        `Contact : ${EDITEUR.contact}, téléphone ${EDITEUR.telephone}.`,
      ],
    },
    {
      titre: "Hébergement",
      paragraphes: [
        "Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vercel.com), dans sa région de Paris.",
        "La base de données et les images sont hébergées par Supabase Inc. (supabase.com), dans sa région de Paris.",
      ],
    },
    {
      titre: "Marques et crédits",
      paragraphes: ["La vue « Chemins » utilise la bibliothèque React Flow (reactflow.dev), sous licence MIT."],
    },
  ],
};

/** La foire aux questions de la page « Aide » (F14, « Support »). */
/** `vente` : la question n'a de sens que « Paiement ouvert » allumé. */
export const QUESTIONS: { question: string; reponse: string; vente?: boolean }[] = [
  {
    question: "Comment commencer ?",
    reponse: "Créez un compte, puis votre premier projet : il s’ouvre sur sa préparation. La classe se crée quand les élèves commencent à écrire.",
  },
  {
    question: "Où retrouver les codes des élèves ?",
    reponse: "Dans « Mes classes », en ouvrant la classe : chaque élève a son code, et l’affiche de la classe et les étiquettes s’impriment de là.",
  },
  {
    question: "Les élèves ont-ils besoin d’une adresse électronique ?",
    reponse: "Non. Vous ouvrez la classe sur un ordinateur avec son identifiant et son mot de passe ; chaque élève choisit son prénom et tape son code.",
  },
  {
    question: "Que sont les étoiles ?",
    reponse: "Les aides par l’IA, facultatives, usent des étoiles selon ce qu’elles coûtent. Un nouveau compte en reçoit pour essayer ; votre solde est dans « Mon compte ». Tout le reste de l’outil marche sans elles.",
  },
  {
    question: "À quoi sert le pass ?",
    reponse: "Payé une fois pour un livre, il lève les limites du livre gratuit (scènes et images) pour ce livre, pour toujours, et donne des étoiles.",
    vente: true,
  },
  {
    question: "De quel matériel ai-je besoin ?",
    reponse: "D’un navigateur, sur les ordinateurs ou les tablettes de la classe : plusieurs élèves écrivent en même temps, chacun sur son poste, ou à tour de rôle sur un seul.",
  },
  {
    question: "Puis-je partager le livre avec les familles ?",
    reponse: "Oui. Vos élèves le lisent chez eux avec leur code de classe, même après la fin de l’année. Vous pouvez aussi le proposer à la bibliothèque du site, lisible par tous, après avoir fait signer l’autorisation de diffusion par les représentants légaux des élèves.",
  },
  {
    question: "Comment tout supprimer ?",
    reponse: "Depuis « Mon compte », « Supprimer mon compte » efface aussitôt vos projets, vos classes, vos images et vos livres partagés.",
  },
];

/** Les modèles à télécharger (F14-AC33, et le contrat type pour l'école qui le demande). */
export type Modele = { cle: "autorisation-de-diffusion" | "information-des-familles" | "contrat-de-sous-traitance"; nom: string; pour: string; document: Document };

export const MODELES: Modele[] = [
  {
    cle: "autorisation-de-diffusion",
    nom: "Autorisation de diffusion",
    pour: "À faire signer par les représentants légaux de chaque élève, avant de proposer le livre à la bibliothèque du site.",
    document: {
      titre: "Autorisation de diffusion des textes et dessins d’un élève",
      chapeau: "Livre écrit par la classe avec l’outil Il était une classe",
      misAJour: "25 octobre 2026",
      sections: [
        {
          titre: "La classe",
          paragraphes: ["École : ……………………………………………", "Classe : ……………………………… Année scolaire : ………………", "Enseignant(e) : ……………………………………………"],
        },
        {
          titre: "Ce qui est demandé",
          paragraphes: [
            "Cette année, la classe écrit un livre. Votre enfant y écrit des textes et peut y faire des dessins. Le livre sera imprimé pour la classe, et les élèves pourront le lire en ligne avec leur code de classe. Si vous l’acceptez, il sera aussi publié dans la bibliothèque du site Il était une classe : tout le monde pourra le lire sur un écran, sans compte, et les moteurs de recherche pourront trouver la bibliothèque.",
            "Dans le livre, votre enfant est désigné par son prénom seulement.",
          ],
        },
        {
          titre: "Votre réponse",
          paragraphes: [
            "Je soussigné(e) ……………………………………………, représentant légal de l’élève ……………………………………………,",
            "☐ autorise ☐ n’autorise pas la diffusion des textes et des dessins de mon enfant, avec son prénom, dans la bibliothèque du site.",
            "Cette autorisation vaut pour ce livre. Je peux la retirer à tout moment en le disant à l’enseignant(e) : le livre quittera alors la bibliothèque.",
            "Fait à ……………………, le ……………………     Signature :",
          ],
        },
      ],
    },
  },
  {
    cle: "information-des-familles",
    nom: "Information des familles",
    pour: "À remettre aux familles en début de projet : ce qu’est l’outil, ce qui est gardé, ce qui part à l’IA.",
    document: {
      titre: "Information des familles",
      chapeau: "La classe écrit un livre avec l’outil Il était une classe",
      misAJour: MAJ,
      sections: [
        {
          titre: "L’outil",
          paragraphes: [
            "Il était une classe est un site où la classe écrit un livre ensemble : l’enseignant(e) prépare l’histoire, les élèves écrivent chacun des scènes, la classe relit, puis le livre est imprimé et, avec votre accord, partagé.",
            "Les élèves n’ont pas de compte et pas d’adresse électronique : ils entrent dans la classe ouverte sur un ordinateur de l’école, en choisissant leur prénom et en tapant un code à quatre chiffres.",
          ],
        },
        {
          titre: "Ce qui est gardé",
          paragraphes: [
            "Le prénom de votre enfant (et son nom, si l’enseignant(e) l’indique pour distinguer deux prénoms), son code chiffré, et les textes qu’il écrit. Rien d’autre : ni date de naissance, ni adresse, ni photo.",
            "Les données sont hébergées en Europe, à Paris. Elles sont gardées tant que l’enseignant(e) garde la classe, qui peut les supprimer à tout moment.",
          ],
        },
        {
          titre: "L’intelligence artificielle",
          paragraphes: [
            "L’enseignant(e) peut se faire aider par une intelligence artificielle, par exemple pour corriger un texte ou proposer une illustration. Les élèves ne l’utilisent pas. Ce qui lui est envoyé ne contient jamais le prénom ni le nom d’un élève.",
          ],
        },
        {
          titre: "Vos droits",
          paragraphes: [
            "Pour toute question, ou pour demander l’accès aux données de votre enfant ou leur suppression, adressez-vous à l’enseignant(e) ou à l’école. La page « Confidentialité » du site iletaituneclasse.com dit tout le détail.",
          ],
        },
      ],
    },
  },
  {
    cle: "contrat-de-sous-traitance",
    nom: "Contrat de sous-traitance type",
    pour: "Pour l’école ou la circonscription qui le demande : les engagements de l’éditeur sur les données des élèves.",
    document: {
      titre: "Contrat de sous-traitance des données personnelles (modèle)",
      chapeau: "Article 28 du règlement général sur la protection des données",
      misAJour: MAJ,
      sections: [
        {
          titre: "Les parties",
          paragraphes: [
            "Le responsable de traitement : ……………………………………………… (pour une école publique, la direction académique des services de l’Éducation nationale), représenté par ………………………………, ci-après « le responsable ».",
            `Le sous-traitant : ${EDITEUR.nom}, ${EDITEUR.adresse}, SIRET ${EDITEUR.siret}, éditeur du site ${EDITEUR.site}, ${EDITEUR.contact}, ci-après « l’éditeur ».`,
          ],
        },
        {
          titre: "Objet",
          paragraphes: [
            "L’éditeur fournit l’outil Il était une classe, qui permet à un enseignant de faire écrire un livre à sa classe. Il traite pour le compte du responsable les données des élèves que l’enseignant y saisit, pour la seule durée de l’utilisation.",
          ],
        },
        {
          titre: "Les données et les personnes",
          paragraphes: [
            "Élèves : prénom, nom facultatif, code d’accès chiffré, textes écrits. Enseignant : adresse électronique, nom affiché. Aucune donnée sensible n’est demandée.",
          ],
        },
        {
          titre: "Les engagements de l’éditeur",
          paragraphes: [
            "– ne traiter les données que pour fournir l’outil, sur instruction de l’enseignant ;",
            "– garder la confidentialité des données ; seul l’éditeur y a accès, pour la maintenance ;",
            "– les héberger en Europe, à Paris (Supabase, Vercel, Amazon Web Services) ; n’envoyer aux aides IA (Anthropic, OpenAI, aux États-Unis), à la demande de l’enseignant, aucun prénom ni nom d’élève ;",
            "– protéger les accès : codes et mots de passe chiffrés, connexions chiffrées, sauvegarde chaque nuit, gardée quatre-vingt-dix jours ;",
            "– aider le responsable à répondre aux demandes d’exercice des droits ;",
            "– prévenir le responsable sans retard injustifié de toute violation de données dont il a connaissance ;",
            "– effacer les données à la fin de l’utilisation : l’enseignant les supprime lui-même depuis l’outil, ou l’éditeur le fait sur demande ;",
            "– tenir à disposition du responsable les informations nécessaires pour démontrer le respect de ces obligations.",
          ],
        },
        {
          titre: "Sous-traitants ultérieurs",
          paragraphes: [
            "Vercel (hébergement du site), Supabase (base de données et images), Amazon Web Services (sauvegardes et courriels), Anthropic et OpenAI (aides IA, à la demande), Stripe (paiement, sans données d’élèves). L’éditeur informe le responsable de tout changement.",
          ],
        },
        {
          titre: "Signatures",
          paragraphes: ["Fait à ……………………, le ……………………", "Pour le responsable :                              Pour l’éditeur :"],
        },
      ],
    },
  },
];

export const modeleDe = (cle: string): Modele | undefined => MODELES.find((m) => m.cle === cle);

/** Le document en RTF, qu'ouvrent Word et LibreOffice pour le compléter ou le modifier. */
export function enRtf(d: Document): string {
  const echapper = (t: string) =>
    [...t].map((c) => {
      const code = c.codePointAt(0)!;
      if (c === "\\" || c === "{" || c === "}") return `\\${c}`;
      if (code > 127) return code > 0xffff ? "?" : `\\u${code > 32767 ? code - 65536 : code}?`;
      return c;
    }).join("");
  const lignes = [
    "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Georgia;}}\\fs24",
    `{\\pard\\sa120\\fs36\\b ${echapper(d.titre)}\\b0\\par}`,
    `{\\pard\\sa240\\i ${echapper(d.chapeau)}\\i0\\par}`,
    ...d.sections.flatMap((s) => [
      `{\\pard\\sb240\\sa120\\fs28\\b ${echapper(s.titre)}\\b0\\par}`,
      ...s.paragraphes.map((p) => `{\\pard\\sa120 ${echapper(p)}\\par}`),
    ]),
    "}",
  ];
  return lignes.join("\n");
}
