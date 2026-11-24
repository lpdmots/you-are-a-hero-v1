/**
 * « La dernière traversée du Cormoran », un court livre-jeu pour adultes, écrit par Claude le 24 novembre 2026 pour
 * les captures de la page de l'auteur seul (F14-AC76) : le porteur jugeait celles des livres de classe « un peu
 * bébé » pour ce public. Un projet personnel, un chapitre de treize passages, au présent et au « vous », trois
 * images à l'encre faites par le porteur. Il n'est pas un livre de la bibliothèque ; il se charge en local :
 *   npm run livres:exemple -- cormoran --brouillon --refaire
 *
 * L'intrigue : en 1928, sur un paquebot entre Le Havre et New York, le médecin de bord cherche un passager disparu
 * dans la nuit. Ruiné par le jeu, Varenne a monté sa propre chute à la mer et se cache parmi les chauffeurs.
 */
import type { Conception } from "./conception";

const DOSSIER = "scripts/exemples/la-derniere-traversee-du-cormoran/images-du-porteur";

export const livre: Conception = {
  TITRE: "La dernière traversée du Cormoran",
  ORGANISATION: "personnel",
  DEPART: 1,
  AGE: "adultes",
  VISUEL_DU_PROJET: "bateau",
  STYLE: { style: "encre", autre: "" },
  CONSIGNE_ECRITURE: "Au présent et au « vous » : le lecteur est le médecin de bord. Un polar d’époque, sobre, sans effets ; des phrases variées, des répliques courtes. Ne donnez jamais la solution avant le choix.",

  PREPARATION: {
    univers: "Octobre 1928, à bord du Cormoran, un paquebot de la Compagnie transatlantique, entre Le Havre et New York. Le brouillard ne se lève pas depuis deux jours. Les premières classes dorment ; sous elles, les chauffeurs nourrissent les chaudières jour et nuit.",
    personnages: "Vous, le médecin de bord.\nÉdouard Varenne, passager de la cabine A-24, joueur ruiné.\nMorel, le steward des premières.\nLe commandant Le Gall.\nRaymond Delorme, croupier du salon de jeu.\nMme Ostrowska, la voisine de Varenne.",
    enjeu: "Un passager a disparu dans la nuit. Le commandant vous donne jusqu’à l’aube pour dire s’il est tombé à la mer, ou autre chose.",
    regles: "",
    formuleRenvoi: "rendez",
    constructions: ["neutre"],
  },

  PERSONNAGES: [
    { nom: "le médecin de bord", autresNoms: ["vous", "le docteur"], heros: true, portrait: false, description: "Le médecin du Cormoran, que le lecteur incarne. On ne le décrit pas." },
    { nom: "Édouard Varenne", autresNoms: ["Varenne"], heros: false, portrait: false, description: "Passager de la cabine A-24, la cinquantaine, moustache taillée, ruiné par le jeu." },
    { nom: "Morel", autresNoms: ["le steward"], heros: false, portrait: false, description: "Le steward des premières classes, inquiet et loyal." },
    { nom: "Le Gall", autresNoms: ["le commandant"], heros: false, portrait: false, description: "Le commandant du Cormoran, qui craint les journaux plus que la mer." },
    { nom: "Raymond Delorme", autresNoms: ["Raymond"], heros: false, portrait: false, description: "Le croupier du salon de jeu, à qui Varenne doit une fortune." },
    { nom: "Mme Ostrowska", autresNoms: [], heros: false, portrait: false, description: "La voisine de Varenne, qui ne dort pas." },
  ],
  OBJETS: [],
  FORMULES: [],
  FEUILLE: { on: false, des: 0, sections: [] },
  ACTIONS: {},

  PARTIES: [
    {
      titre: "La traversée", visuel: "bateau",
      chapitres: [
        {
          cle: "nuit", titre: "La nuit du 14 octobre", couleur: 4, visuel: "bateau",
          resume: "Varenne a disparu. Le pardessus sur le pont, la cabine retournée, les dettes et les machines : le médecin de bord a jusqu’à l’aube.",
          scenes: [
            { ref: 1, numero: 1, titre: "Pont promenade — le pardessus", consigne: "Le steward vous réveille : Varenne a disparu. Son pardessus attend sur une chaise longue du pont, dans le brouillard.", choix: [["Examiner le pardessus", 2], ["Descendre à la cabine A-24", 3], ["Réveiller le commandant", 4]] },
            { ref: 2, titre: "Pont promenade — les poches", consigne: "Un jeton, un billet signé R., et une traînée d’huile de machine sur la manche.", choix: [["Descendre à la cabine A-24", 3], ["Suivre l’odeur jusqu’aux machines", 6]] },
            { ref: 3, titre: "Cabine A-24 — le désordre", consigne: "La cabine retournée, mais le verre n’a pas versé. La montre arrêtée à une heure douze.", choix: [["Ramasser les lettres", 5], ["Frapper chez la voisine, Mme Ostrowska", 7], ["Descendre aux machines", 6]] },
            { ref: 4, titre: "Passerelle — le commandant", consigne: "Le Gall vous donne jusqu’à l’aube.", choix: [["Retourner examiner le pardessus", 2], ["Descendre à la cabine A-24", 3]] },
            { ref: 5, titre: "Cabine A-24 — les lettres", consigne: "Les dettes, les billets de R., et le reçu d’un bleu de chauffe.", choix: [["Chercher R. au salon de jeu", 8], ["Descendre aux machines", 6]] },
            { ref: 6, titre: "Salle des machines — l’homme de dos", consigne: "On arrive ici de plusieurs façons. Un chauffeur de dos, qui file vers les passerelles ; un monsieur en habit descendu vers une heure.", choix: [["Fouiller la soute à charbon", 9], ["Monter sur les passerelles", 10]] },
            { ref: 7, titre: "Coursive — Mme Ostrowska", consigne: "Des voix vers une heure, un prénom : Raymond. Puis un bruit de tiroirs.", choix: [["Chercher Raymond au salon de jeu", 8], ["Descendre aux machines", 6]] },
            { ref: 8, titre: "Salon de jeu — Raymond", consigne: "Raymond ne nie rien : un mort ne rembourse personne. Il signale le canot numéro sept.", choix: [["Aller au canot numéro sept", 11], ["Descendre aux machines", 6]] },
            { ref: 9, titre: "Soute à charbon — la porte", consigne: "L’habit de Varenne sous le charbon, puis la porte qui se referme. Fin.", fin: true },
            { ref: 10, titre: "Passerelles — le chauffeur", consigne: "Le chauffeur, c’est Varenne. Il avoue sa mise en scène.", choix: [["Le conduire au commandant", 12], ["Garder son secret", 13]] },
            { ref: 11, titre: "Canot numéro sept — des traces noires", consigne: "Un canot desserré, vide ; des traces de semelles noires qui descendent.", choix: [["Suivre les traces jusqu’aux machines", 6]] },
            { ref: 12, titre: "Passerelle — l’aube", consigne: "Varenne devant le commandant. Fin.", fin: true },
            { ref: 13, titre: "Passerelles — le secret", consigne: "Vous gardez le secret. Fin.", fin: true },
          ],
        },
      ],
    },
  ],

  TEXTES_DE_BASE: {
    1: [
      "Trois coups secs à votre porte. Il est deux heures passées quand Morel, le steward des premières, vous tire du sommeil, la casquette à la main et le visage gris. « Docteur, c’est M. Varenne, de la A-24. On ne le trouve plus. »",
      "Vous enfilez votre veste par-dessus votre pyjama et le suivez jusqu’au pont promenade. Le brouillard a avalé l’Atlantique ; les lampes du plafond n’éclairent plus que leur propre halo. Sur une chaise longue, un pardessus à chevrons attend son propriétaire, trempé, posé avec un soin étrange.",
      "« Il était au salon de jeu jusqu’à minuit, murmure Morel. Après, personne ne l’a vu. » Le bastingage ruisselle. Si un homme est passé par-dessus, la mer a déjà effacé la question.",
    ],
    2: [
      "Vous retournez le pardessus sous la lampe. La laine est lourde d’eau, mais la doublure est presque sèche : il n’est pas resté longtemps sous le crachin. Dans la poche intérieure, un jeton de cent francs du salon de jeu, et un billet plié en quatre : « Ce soir, ou je parle. R. »",
      "Sur la manche droite, une traînée noire, grasse, qui sent l’huile chaude. Ce n’est pas une odeur de pont promenade. C’est celle des étages que les passagers de première ne voient jamais.",
    ],
    3: [
      "Morel déverrouille la porte avec son passe. La cabine a été retournée : la valise bâille sur le lit, les tiroirs du secrétaire pendent, des lettres jonchent le tapis comme des feuilles mortes. Sur la table de nuit, un verre de whisky à moitié plein n’a pas versé une goutte.",
      "À côté, la montre de gousset de Varenne est ouverte, arrêtée à une heure douze. « On dirait qu’il s’est battu », souffle Morel. Vous n’en êtes pas si sûr : un homme qui se bat renverse son verre.",
    ],
    4: [
      "Le commandant Le Gall vous reçoit en robe de chambre, une tasse de café froid à la main. Il écoute sans vous interrompre, puis repose la tasse avec précaution.",
      "« Un passager à la mer, docteur, c’est une ligne dans le journal de bord et trois jours de télégrammes. Un passager assassiné, c’est la Compagnie à la une des journaux de New York. Vous avez jusqu’à l’aube pour me dire lequel des deux. Ensuite, j’écrirai ce qui m’arrange. »",
    ],
    5: [
      "Vous ramassez les lettres une à une. Des relances de banque, polies, puis moins polies. Une note d’un cercle de la rue Royale qui réclame quarante mille francs. Et trois billets de la même écriture penchée, signés d’une seule initiale : R.",
      "Le dernier date d’hier : « Vous m’avez promis de régler avant New York. Je ne suis pas un homme patient. » Sous la pile, le reçu d’un tailleur du Havre, pour un article qui n’a rien à faire dans une malle de première classe : un bleu de chauffe, taille 48.",
    ],
    6: [
      "Il faut descendre six échelles de fer pour atteindre la salle des machines. Ici, il n’y a ni nuit ni brouillard : les bielles montent et retombent dans un fracas régulier, et la chaleur colle la chemise au dos.",
      "Un chauffeur, la casquette enfoncée, vous tourne le dos près d’une lanterne. Le mécanicien de quart hausse les épaules : « Un monsieur en habit est descendu vers une heure. Perdu, qu’il a dit. Je l’ai renvoyé là-haut. Enfin, je crois. » Quand vous vous retournez, le chauffeur a disparu par l’échelle des passerelles.",
    ],
    7: [
      "Mme Ostrowska ouvre sa porte de la largeur d’une chaîne de sûreté. Elle ne dormait pas : on ne dort pas, dit-elle, à côté d’un homme qui fait les cent pas depuis Le Havre.",
      "« Vers une heure, il y a eu des voix. Un homme est entré chez lui ; il l’a appelé Raymond. Puis plus rien, et ensuite ce bruit de tiroirs, longtemps. Comme quelqu’un qui cherche. Ou qui veut qu’on croie qu’il a cherché. » Elle referme sans attendre votre réponse.",
    ],
    8: [
      "Le salon de jeu est fermé depuis minuit, mais une lampe brûle encore au-dessus de la table de baccara. Raymond Delorme compte des jetons, en gilet, une cigarette éteinte aux lèvres. Il ne nie rien : Varenne lui doit une fortune, et il est bien passé à la A-24 vers une heure.",
      "« Pour me payer, docteur, il faut être vivant. Un mort ne rembourse personne. Il m’a juré qu’il aurait l’argent à New York, et il souriait, ce qui m’a inquiété. » Il écrase la cigarette. « Allez donc voir le canot numéro sept. Je l’ai trouvé desserré en remontant. »",
    ],
    9: [
      "La soute à charbon est une caverne noire où l’air brûle la gorge. Vous avancez à la lueur d’une lampe empruntée, et votre pied heurte quelque chose de mou : un habit de soirée, roulé en boule, enfoui sous le charbon.",
      "Derrière vous, la porte d’acier claque. Le loquet tourne de l’extérieur. Vous frappez, vous criez, mais le vacarme des machines couvre tout. On ne vous ouvrira qu’au matin, quand les chauffeurs reviendront remplir leurs pelles. À l’aube, le commandant Le Gall aura écrit ce qui l’arrange.",
    ],
    10: [
      "Vous grimpez jusqu’à la passerelle la plus haute, au-dessus des cylindres. L’homme à la casquette est là, adossé à la rambarde, et cette fois il ne peut plus vous tourner le dos. Sous la suie, vous reconnaissez la moustache taillée d’Édouard Varenne.",
      "Il ne cherche pas à mentir longtemps. Ruiné, menacé, il a monté sa propre disparition : le pardessus sur le pont, la cabine retournée, la montre arrêtée pour qu’on le croie tombé à la mer. Un chauffeur, payé de sa dernière bague, lui prête sa couchette. « À New York, docteur, je descends avec l’équipage, et Édouard Varenne n’existe plus. Que décidez-vous ? »",
    ],
    11: [
      "Le canot numéro sept pend un peu de travers sous ses bossoirs. Une sangle a été défaite, puis refaite à la hâte. Personne dedans. Sur le pont, des empreintes de semelles noires, presque effacées par le crachin, mènent vers une écoutille de service.",
      "Elles ne vont pas vers la mer. Elles descendent.",
    ],
    12: [
      "Le jour se lève sur une mer d’étain quand vous poussez Varenne, en bleu de chauffe, dans la cabine du commandant. Le Gall le regarde longuement, puis se tourne vers vous. « Un passager retrouvé, docteur. Voilà une ligne que j’aime écrire dans un journal de bord. »",
      "Varenne débarquera à New York sous son nom, avec ses dettes, et Raymond l’attendra sur le quai. Vous retournez enfin dormir. Dehors, le brouillard se lève.",
    ],
    13: [
      "Vous redescendez sans un mot. À l’aube, vous dites au commandant ce qu’il espère entendre : un homme ivre, un bastingage glissant, une nuit sans témoin. Le Gall écrit la ligne et vous remercie.",
      "Six jours plus tard, à New York, un chauffeur de plus descend la passerelle de l’équipage, la casquette basse. Vous ne le regardez pas partir. Mais longtemps, en traversant le pont promenade, vous chercherez des yeux un pardessus à chevrons.",
    ],
  },
  A_ECRIRE: [],
  IMAGES: [],
  // Les trois images à l'encre faites par le porteur le 24 novembre 2026, en tête de leur passage
  IMAGES_DU_PORTEUR: [
    { ref: 1, fichier: `${DOSSIER}/pont-promenade.webp`, alt: "Le pont promenade d’un paquebot, la nuit, dans le brouillard : des chaises longues vides, un pardessus abandonné." },
    { ref: 3, fichier: `${DOSSIER}/cabine-a-24.webp`, alt: "La cabine A-24 en désordre : valise ouverte, lettres sur le tapis, une montre de gousset sur la table de nuit." },
    { ref: 6, fichier: `${DOSSIER}/salle-des-machines.webp`, alt: "La salle des machines : passerelles de fer, grandes bielles, une lanterne, un homme de dos en casquette." },
  ],
};
