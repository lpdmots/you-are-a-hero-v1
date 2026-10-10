# Vocabulaire métier V1

Termes du récit et de l'organisation du travail. Les règles fonctionnelles sont
décrites dans les [spécifications](docs/specifications.md).

## Langage

**Scène** :
Unité de récit appartenant à un seul chapitre. Dans un récit à choix, elle
correspond à un passage adressable du livre, comparable à un paragraphe numéroté.
_Éviter_ : page, paragraphe typographique.

**Choix** :
Option proposée au lecteur pour poursuivre le récit, portée par un renvoi
vers une scène de destination.
_Éviter_ : ordre de rangement.

**Renvoi** :
Élément inséré dans le texte d'une scène, relié à une scène de destination,
qui affiche le numéro imprimé de celle-ci et devient activable à l'écran.
_Éviter_ : numéro saisi à la main, référence de scène.

**Phrase de choix** :
Phrase adressée au lecteur contenant un ou plusieurs renvois et occupant un
paragraphe à elle seule, identique dans le livre imprimé et à l'écran ;
composée automatiquement à partir du libellé ou écrite par l'auteur.
_Éviter_ : libellé seul, formule de renvoi, renvoi glissé dans un paragraphe de récit.

**Libellé de choix** :
Courte formulation de l'option, de préférence une action, servant à composer
la phrase de choix automatique et à repérer le choix dans le graphe.
_Éviter_ : titre de travail de la destination, phrase de choix complète.

**Paragraphe protégé** :
Paragraphe d'une scène que l'enseignant a soustrait à la modification et à la
suppression par les élèves.
_Éviter_ : scène validée, sélection de texte libre.

**Note de l'enseignant** :
Paragraphe d'une scène visible de l'adulte seul et absent du livre, servant
de rappel pour son propre travail.
_Éviter_ : consigne d'écriture, retour de révision, passage caché du récit.

**Feuille d'aventure** :
Page propre à une histoire, composée de sections par l'adulte, que le lecteur
remplit lui-même au fil de sa lecture, sur papier ou en ligne, pour noter ses
objets, ses compteurs et ce qu'il découvre.
_Éviter_ : fiche aventure, fiche de rédaction, inventaire contrôlé par l'application.

**Compteur** :
Valeur chiffrée de la feuille d'aventure, dotée d'un nom et d'une valeur de
départ, que le lecteur fait évoluer lui-même.
_Éviter_ : statistique calculée, score.

**Objet de l'histoire** :
Objet nommé dans la liste commune tenue par l'adulte pour que les auteurs
l'écrivent tous de la même façon ; cette liste n'est pas montrée au lecteur.
_Éviter_ : inventaire du lecteur, objet suivi par l'application.

**Action de jeu** :
Paragraphe à texte libre, mis en valeur, adressé au lecteur pour lui demander
d'agir sur sa feuille d'aventure ; l'application n'en interprète pas le sens.
_Éviter_ : phrase de choix, consigne d'écriture, effet automatique.

**Image en ligne** :
Petite image posée par l'adulte sur la ligne d'écriture, à la hauteur du
texte, par exemple un symbole à repérer ou l'image d'un objet obtenu.
_Éviter_ : illustration en bloc, image de repérage, émoticône saisie au clavier.

**Titre de scène** :
Nom de travail décrivant le passage pour le retrouver dans le projet.
_Éviter_ : libellé de choix, numéro imprimé.

**Référence de scène** :
Repère court et stable permettant de distinguer une scène dans le travail
sur le récit, indépendamment de son titre et de son numéro imprimé.
_Éviter_ : ordre de lecture, pagination.

**Image de repérage** :
Image stable choisie par l'adulte pour reconnaître une histoire, une partie ou un chapitre
dans l'espace de travail.
_Éviter_ : illustration automatiquement insérée dans le livre, couverture,
décor renouvelé à chaque visite.

**Visuel par défaut** :
Image de la bibliothèque de l'application qui tient lieu d'image de repérage
tant que l'adulte n'en a pas choisi ; attribué une fois, puis conservé.
_Éviter_ : image aléatoire, visuel générique masquant un chapitre non attribué.

**Visuel proposé** :
Image de la bibliothèque de l'application que l'adulte choisit lui-même
comme image de repérage, au lieu du visuel par défaut tiré d'office.
_Éviter_ : image du projet, illustration du livre.

**Style d'illustration** :
Style prédéfini choisi par l'adulte pour l'ensemble d'un projet, repris par
chaque prompt d'illustration afin de garder des images cohérentes.
_Éviter_ : réglage propre à chaque image, imitation d'un artiste nommé.

**Idée d'illustration** :
Courte description, écrite par un élève ou par l'adulte, de l'image imaginée
pour une scène ou un chapitre.
_Éviter_ : prompt d'illustration, image générée, texte de la scène.

**Prompt d'illustration** :
Texte précis proposé à l'adulte, à partir d'une idée d'illustration et du style
du projet, à copier dans un outil de génération externe ; par défaut, le héros n'y
figure pas, sauf éventuellement ses mains.
_Éviter_ : génération d'image dans l'application, illustration du livre.

**Scène de départ** :
Scène désignée par l'adulte comme point de départ unique du livre à choix.
_Éviter_ : première scène de chaque partie, premier numéro imprimé imposé.

**Scène voisine** :
Scène lue juste avant ou juste après une autre : reliée à elle par un choix ou
une liaison cachée dans un récit à choix, placée avant ou après elle dans le
plan d'un récit classique.
_Éviter_ : scène liée, scène adjacente.

**Liaison cachée** :
Lien d'une scène vers une autre qui n'est pas proposé au lecteur comme un
choix : il trouve la suite, par exemple, en résolvant une énigme. À
l'écran, « Lien caché ».
_Éviter_ : choix, renvoi imprimé, absence de lien.

**Scène de fin** :
Scène explicitement repérée comme une conclusion possible de l'histoire à choix.
_Éviter_ : scène simplement dépourvue de choix, sortie de partie.

**Scène exclue du livre** :
Scène que l'adulte a explicitement écartée du contenu du livre, tout en la
conservant dans le projet.
_Éviter_ : scène supprimée, scène automatiquement écartée faute de raccord.

**Partie** :
Enveloppe titrée d'une histoire regroupant un ou plusieurs chapitres.
Le déroulement préparé se situe dans les chapitres.
_Éviter_ : unité d'attribution aux élèves, groupe d'élèves, équipe.

**Chapitre** :
Regroupement de scènes au sein d'une partie et unité d'attribution du travail
et de lecture des élèves.
_Éviter_ : simple filtre visuel, groupe imbriqué à profondeur variable, scène.

**Corbeille du projet** :
Lieu où se retrouvent une partie, un chapitre ou une scène supprimés, avec
leurs textes, et d'où l'adulte seul les restaure à leur place, avec leurs
élèves ; les choix qui y menaient y mènent de nouveau.
_Éviter_ : archive, exclusion du livre (une scène hors du livre reste dans
le projet).

**Chemins** :
Nom à l'écran de la vue qui montre, dans un chapitre, où mène chaque choix ;
« graphe » reste le mot de travail des documents.
_Éviter_ : plan, ordre de lecture.

**Histoire** :
Récit organisé en parties, chapitres et scènes, de type classique ou à choix.

**Enseignant responsable** :
Adulte qui pilote un projet de classe, accompagne les élèves et en assure
les validations et la préparation du livre.
_Éviter_ : élève disposant du profil d'organisation, responsable d'une soumission.

**Classe** :
Groupe d'élèves rattaché à un enseignant et repéré par un nom et une année
scolaire, pouvant participer à plusieurs histoires. Elle est « en cours »
tant que l'enseignant n'a pas terminé son année.
_Éviter_ : compte enseignant, histoire unique, espace école.

**Année terminée** :
État d'une classe dont l'enseignant a terminé l'année : son accès de classe
ne s'ouvre plus sur les postes, rien n'est supprimé, et l'enseignant peut la
rouvrir. À l'écran, « Terminer l'année », « Années passées », « Rouvrir la
classe ».
_Éviter_ : classe supprimée, archive, bascule automatique à une date.

**Profil élève** :
Identité d'un élève dans l'espace d'un enseignant, commune à ses inscriptions
successives et à ses contributions : un prénom, et un nom facultatif. Les
élèves ne voient que les prénoms, suivis de l'initiale du nom quand deux
élèves d'une classe portent le même.
_Éviter_ : inscription annuelle, code de connexion, profil de participation.

**Inscription dans une classe** :
Rattachement d'un profil élève à une classe pour une année scolaire.
_Éviter_ : nouveau profil élève, attribution d'un chapitre.

**Retrait de la classe** :
Fin de l'inscription d'un élève décidée par l'enseignant : l'élève perd ses
chapitres dans les projets de la classe, ses textes restent à son prénom et
son profil reste connu. À l'écran, « Retirer de la classe ».
_Éviter_ : suppression du profil, fin d'année, retrait d'une attribution.

**Rattachement du projet à une classe** :
Association d'un projet en mode classe à la classe qui y participe.
_Éviter_ : inscription d'un élève, attribution d'un chapitre, ouverture des accès.

**Préparation du récit** :
Informations et décisions retenues sur l'univers, les personnages et la trame,
servant de référence pour construire et rédiger l'histoire. En mode classe,
elle est consultée et saisie par l'enseignant, seul ou pendant un atelier
projeté avec la classe ; elle n'est pas une page de l'espace élève.
_Éviter_ : texte du livre, questionnaire nécessairement terminé avant l'écriture.

**Atelier collectif** :
Vue de la préparation destinée à guider une discussion de classe sur un écran
projeté, où l'enseignant consigne les décisions retenues.
_Éviter_ : nouvelle copie du récit, vote numérique, accès individuel élève.

**Plan du récit** :
Organisation des parties et chapitres de l'histoire, commune à la vue
de préparation et à la page des parties et chapitres.
_Éviter_ : seconde liste d'étapes à convertir, copie de la structure, chemin du lecteur.

**Résumé de chapitre** :
Texte facultatif décrivant l'intention et le déroulement prévu d'un chapitre,
servant surtout de contexte à l'assistance IA de l'adulte.
_Éviter_ : résumé de partie, consigne de scène, résumé automatiquement tiré du texte écrit.

**Consigne d'écriture** :
Instruction donnée par l'enseignant pour guider le travail de rédaction demandé.
_Éviter_ : texte du récit, choix proposé au lecteur.

**Fiche de rédaction** :
Feuille imprimable qui liste des scènes à écrire ou à reprendre, sous leur
référence, avec leur consigne, une image éventuelle, le texte déjà écrit et
la demande de reprise ; l'élève écrit sur son cahier. Une feuille par
chapitre ou par élève ; une scène sans consigne n'y figure pas.
_Éviter_ : PDF de travail du livre, scène validée, devoir obligatoirement à domicile.

**Périmètre d'accès** :
Ensemble des chapitres dont le contenu de travail est accessible à un
élève dans une histoire grâce à ses attributions.
_Éviter_ : ensemble des cartes visibles, rôle, équipe.

**Lecture ouverte de l'histoire** :
Réglage par lequel l'adulte permet aux élèves de lire toutes les scènes
d'une histoire, sans étendre leur périmètre d'accès au travail.
_Éviter_ : attribution, version partagée, accès à la préparation.

**Accès de classe** :
Accès à l'espace élève d'une classe sur un poste, préalable à l'identification
de l'élève qui l'utilise. Il s'ouvre avec les informations de la classe, son
identifiant et son mot de passe, proposées par l'application, que
l'enseignant relit et remplace depuis la classe.
_Éviter_ : identité commune aux élèves, accès enseignant.

**Affiche de la classe** :
Feuille imprimable qui donne l'adresse de l'entrée des élèves, l'identifiant
et le mot de passe de la classe, à afficher près des ordinateurs.
_Éviter_ : étiquette de l'élève, fiche de rédaction.

**Étiquette de l'élève** :
Support individuel imprimable, à découper, qui porte le prénom de l'élève et
son code personnel, et sur option les informations de la classe.
_Éviter_ : affiche de la classe, fiche de rédaction, carte d'identité.

**Code personnel élève** :
Code à quatre chiffres associé à un profil élève, utilisé pour s'identifier
après l'accès de classe et administré par l'enseignant.
_Éviter_ : accès de classe, identité du profil, inscription annuelle.

**Accès individuel élève** :
Accès associé au profil de l'élève identifié, avec ses droits et son travail.
_Éviter_ : propriété du texte, simple choix d'avatar.

**Attribution** :
Désignation d'un chapitre comme périmètre de travail pour un ou plusieurs élèves.
_Éviter_ : auteur du texte, prise en charge d'une scène.

**Profil de participation** :
Ensemble des droits d'un élève dans un chapitre attribué : « écriture et
propositions » ou « écriture et organisation ».
_Éviter_ : droits globaux de l'élève, statut de validation.

**Scène contenant du travail** :
Scène dont la copie porte un texte ou une image, pour laquelle un texte est
gardé à part, ou qui a déjà été remise ; un élève ne la supprime pas.
_Éviter_ : scène prise en charge, scène qui n'a qu'un titre ou une consigne.

**Suivi du travail** :
Consultation de l'avancement et du travail restant à effectuer, globalement
ou par élève, à partir des scènes du projet.
_Éviter_ : mesure automatique de contribution individuelle, validation du livre.

**Prise en charge d'une scène** :
Indication de l'élève chargé de préparer une scène ou d'en suivre les corrections,
y compris sur papier ; un même élève peut prendre en charge plusieurs scènes.
Après validation du travail élève, cette indication demeure un repère de suivi.
L'élève signalé peut la retirer lui-même tant que la scène s'écrit.
L'enseignant peut aussi s'attribuer une scène : elle est alors la sienne, et
un élève ne peut ni y écrire ni la reprendre.
_Éviter_ : réservation exclusive entre élèves, présence en ligne, propriété du
texte, validation.

**Répartition des scènes sans élève** :
Partage, demandé par l'enseignant à l'impression des fiches de rédaction, des
scènes que personne n'a prises entre les élèves de leur chapitre, à parts
égales ; confirmé, il crée des prises en charge ordinaires.
_Éviter_ : attribution du chapitre, réservation exclusive, partage d'office.

**Reprise d'une prise en charge** :
Remplacement volontaire de l'élève signalé sur une scène par un autre élève
qui en assure la préparation ou le suivi, sans transfert des droits d'accès.
_Éviter_ : attribution du chapitre, reprise d'une ancienne version du texte.

**Copie de récupération** :
Texte conservé séparément lorsqu'une saisie entre en conflit avec le texte
courant d'une scène, jusqu'à ce que l'adulte décide de ne plus le garder ou
de le mettre dans la scène. À l'écran, « texte gardé à part » ; celui qui
sort de la scène par un échange s'y nomme « Ancien texte de la scène » et
n'arrête aucun élève.
_Éviter_ : texte final, scène supplémentaire, fusion automatique, remise,
corbeille du projet.

**Soumission d'une scène** :
Remise explicite du texte d'une scène à l'enseignant pour relecture. À
l'écran, « remettre » et « remis le… ».
_Éviter_ : sauvegarde, validation, publication.

**Texte source** :
Texte conservé tel qu'il a été soumis à l'enseignant, avant les corrections
éditoriales de cette remise ; chaque nouvelle soumission fournit une nouvelle référence.
_Éviter_ : texte final, texte toujours modifiable, copie de récupération.

**Texte courant** :
Texte de la scène dans son état actuel de rédaction ou de correction.
_Éviter_ : texte source conservé, texte automatiquement validé.

**Retour de révision** :
Remarque de l'enseignant guidant la reprise d'une scène, conservée avec la
remise qu'elle concerne. À l'écran, « remarque », pour l'adulte comme pour
l'élève ; « retour » y désigne le geste de revenir en arrière.
_Éviter_ : consigne initiale, réponse de l'élève, correction directe du texte.

**Encouragement** :
Marque donnée par l'enseignant au texte d'une scène, dans l'une des trois
catégories effort, fine plume ou créativité, et comptée pour l'élève qui a
la prise en charge de cette scène.
_Éviter_ : « j'aime », note, validation du travail élève, retour de révision.

**Texte final** :
Texte retenu par l'adulte pour le livre, à distinguer des éventuels textes remis
par les élèves ; il ne qualifie pas l'état des images, des choix ou de la mise en page.
_Éviter_ : travail élève terminé, scène entièrement prête, livre déjà publié.

**État de la scène** :
Repère d'avancement d'une scène — « En cours », « À reprendre », « À valider »,
« Validé » ou « Prête » —, que l'enseignant peut choisir librement ; une scène
sans élève n'a que « En cours », « Validé » et « Prête ». « Texte vide » n'est
qu'un affichage du Suivi.
_Éviter_ : statut du livre, étape imposée dans un ordre fixe.

**Validation du travail élève** :
Approbation par l'enseignant du travail de rédaction demandé aux élèves pour
une scène, dont les finitions pour le livre peuvent encore rester à effectuer.
À l'écran, l'état « Validé » ; pour une scène sans élève, il dit que le texte
est terminé alors que la scène reste à finir.
_Éviter_ : validation complète de scène, scène prête à imprimer, publication.

**Réouverture du travail élève** :
Nouvelle demande de reprise décidée par l'enseignant pour une scène dont le
travail élève était validé, engageant un nouveau cycle de remise et de validation.
_Éviter_ : retouche éditoriale de l'enseignant, retrait autonome d'une soumission,
restauration d'une ancienne version.

**Scène prête pour le livre** :
Scène déclarée prête par l'adulte pour les éléments prévus dans le livre :
texte, éventuelles images, choix lorsqu'il y en a et présentation. À l'écran,
l'état « Prête », que l'adulte peut retirer.
_Éviter_ : travail élève validé, PDF complet déjà vérifié.

**Aperçu du livre** :
Présentation à l'écran du livre composé, portant les marques du PDF de travail
et depuis laquelle l'adulte modifie les scènes et règle la composition.
_Éviter_ : lecteur en ligne, version partagée, playtest.

**Page peu remplie** :
Page du récit dont une large part reste blanche sans que l'adulte l'ait
voulu — plus d'un quart, seuil proposé —, repérée dans l'aperçu du livre
pour l'aider à réduire les blancs.
_Éviter_ : problème de mise en page, page blanche, contrôle bloquant.

**PDF de travail** :
Version du livre destinée à la relecture pendant sa préparation, identifiable
comme telle et jamais utilisable comme livre définitif.
_Éviter_ : livre terminé, publication.

**Ordre imprimé** :
Ordre d'apparition des scènes dans le livre composé, distinct des chemins
suivis par le lecteur dans un récit à choix et correspondant à l'ordre de
lecture dans un récit classique.
_Éviter_ : destinations des choix, ordre de rédaction.

**Numéro imprimé** :
Numéro sous lequel une scène incluse figure dans le livre à choix composé,
auquel renvoient les choix imprimés ; il découle de l'ordre imprimé et peut
changer d'un export à l'autre.
_Éviter_ : référence de scène, numéro de page, identité de la scène.

**Numéro fixé** :
Numéro imprimé qu'une scène doit conserver, parce que l'adulte l'a fixé ou
qu'une liaison cachée y conduit.
_Éviter_ : référence de scène, numéro de page.

**Scène d'ouverture de partie** :
Scène désignée pour ouvrir une partie dans le livre composé, au-dessus de
laquelle s'imprime le titre de la partie.
_Éviter_ : scène de départ du livre, seule entrée narrative de la partie.

**Groupe de mélange** :
Une ou plusieurs parties dont les scènes sont mélangées ensemble pour proposer
l'ordre imprimé initial d'un livre à choix ; par défaut, chaque partie forme
son propre groupe.
_Éviter_ : partie, chapitre, groupe d'élèves.

**Agencement** :
Ordre des passages proposé à l'adulte pendant la mise en page, calculé pour
réduire les blancs en écartant les passages liés ; il n'est appliqué que
s'il l'accepte, ne se recalcule pas à chaque composition et se relance à la
demande. À l'écran, la commande s'appelle « Réordonner les passages ».
_Éviter_ : mélange, composition, optimisation automatique.

**Temps du livre** :
L'un des trois moments de la préparation du livre — relire, vérifier les
chemins, mettre en page — qui ne proposent que leurs propres commandes et ne
montrent que ce qui se traite chez eux. Ils partagent le même aperçu du
livre. « Relire » traite aussi les défauts d'image ; « Mettre en page » ne
traite aucun défaut. Les deux premiers sont ouverts
dès le début ; « Mettre en page » s'ouvre quand ils sont terminés, et une
étape ouverte ne se referme pas.
_Éviter_ : outil séparé, onglet.

**Étape d'arrivée** :
« Imprimer et partager », qui suit les temps du livre et réunit le PDF
définitif, les PDF définitifs conservés et le partage ; elle s'ouvre lorsque
l'adulte a déclaré que la mise en page lui convient et n'utilise pas l'aperçu.
_Éviter_ : quatrième temps, onglet Exports, publication.

**Tâche** :
Partie de l'étape « Relire » ou « Vérifier les chemins », présentée à son
tour et dans l'ordre : l'écran montre la tâche en cours, les autres tiennent
en une ligne ; une tâche où il n'y a rien à faire reste affichée, cochée.
« Mettre en page » n'a pas de tâches, mais deux volets.
_Éviter_ : étape, problème, contrôle.

**Scène à finir** :
Scène du livre que l'adulte n'a pas encore déclarée prête. Ses défauts
d'écriture — texte vide, ni choix ni fin, choix sans destination — ne sont
pas des problèmes tant qu'elle n'est pas prête.
_Éviter_ : scène fautive, scène en retard, problème bloquant.

**Doute sur l'ordre** :
Question posée par les réglages de « Mettre en page », à « Ordre des
passages », lorsqu'une scène ou
un réglage de mise en page a fait changer de page au moins un passage :
garder l'ordre ou réordonner à nouveau. Tant qu'elle est sans réponse, la mise en page ne peut pas être
déclarée convenable.
_Éviter_ : relance automatique, erreur de mise en page.

**Avertissement accepté** :
Avertissement des contrôles auquel l'adulte a répondu « C'est voulu », ou
« Garder ainsi » pour une image peu définie ; il
ne compte plus parmi ce qui reste à faire tant que ce qui a été jugé n'a pas
changé. Un problème bloquant ne s'accepte pas.
_Éviter_ : problème ignoré, contournement, validation de tâche.

**Intérieur du livre** :
Ensemble des pages du livre situées à l'intérieur de sa couverture, comprenant
le récit et les éventuelles pages de présentation ou de fin.
_Éviter_ : seul texte des scènes, couverture complète.

**Couverture** :
Enveloppe extérieure du livre imprimé, comprenant sa face avant, son dos
de reliure et sa face arrière.
_Éviter_ : page de titre intérieure, première page du PDF intérieur.

**Page de titre** :
Page intérieure présentant le titre du livre et les autres informations
de présentation choisies par l'adulte.
_Éviter_ : couverture extérieure, scène du récit.

**Page de présentation** :
Page de l'intérieur du livre placée hors du récit — titre, auteurs, « Comment
lire ce livre », feuille d'aventure, fin — composée d'après un modèle ou
remplacée par une image de l'adulte.
_Éviter_ : page de garde, couverture, page libre, scène.

**Numéro de page** :
Rang d'une page dans le PDF définitif, page de titre comprise ; son
impression sur les pages du récit est un réglage du livre.
_Éviter_ : numéro imprimé, numéro de passage, référence de scène.

**Dé imprimé** :
Face de dé imprimée en bas d'une page de droite du récit, que le lecteur
obtient en ouvrant le livre au hasard à la place d'un lancer.
_Éviter_ : dé du lecteur en ligne, numéro de page, résultat interprété.

**Ajustement de composition** :
Consigne de présentation fixée par l'adulte pour un passage ou une illustration
du livre, en complément de la composition automatique.
_Éviter_ : correction du texte, modification des destinations des choix.

**PDF définitif** :
Version du livre exportée pour l'impression après sa préparation et les
vérifications requises pour cet usage.
_Éviter_ : contenu désormais immuable, publication automatique.

**Scène à reprendre** :
Scène pour laquelle l'enseignant a demandé une révision aux élèves.
_Éviter_ : scène à corriger par l'enseignant, retrait volontaire de soumission.

**Playtest** :
Lecture d'essai du récit en cours dans le périmètre de la personne qui teste,
en suivant ses choix et liaisons cachées lorsqu'il en comporte.
_Éviter_ : validation des textes, contrôle complet du livre, lecture d'une version partagée.

**Sortie de périmètre** :
Interruption d'un playtest lorsqu'un chemin mène hors des chapitres accessibles
à l'élève, sans révéler la destination.
_Éviter_ : fin de l'histoire, destination absente.

**Version partagée** :
Instantané d'un récit terminé, choisi par l'adulte pour la lecture plaisir extérieure à l'espace
de travail du projet, distinct du contenu courant et remplacé seulement par une mise à jour explicite.
_Éviter_ : brouillon toujours synchronisé, PDF définitif, inscription automatique à une bibliothèque.

**Lien de lecture** :
Adresse stable donnant accès sans compte à la version partagée d'une histoire,
transmissible, que l'adulte peut retirer ou remplacer.
_Éviter_ : accès privé, accès de classe, lien propre à chaque mise à jour.

**Lecture par les classes** :
Mise à disposition de la version partagée d'une histoire aux élèves identifiés
des classes de l'enseignant, sans lien à distribuer.
_Éviter_ : lecture ouverte de l'histoire, attribution, bibliothèque publique.

**Lecteur en ligne** :
Espace de consultation d'une version partagée, permettant de suivre le récit
et ses choix éventuels sans accéder aux outils de travail du projet.
_Éviter_ : éditeur, playtest d'un travail en cours, bibliothèque de livres, aperçu de mise en page imprimée.

**Mode personnel** :
Organisation dans laquelle un auteur adulte gère son projet.

**Mode classe** :
Organisation dans laquelle l'enseignant attribue le travail, accompagne et valide,
et les élèves rédigent dans leur périmètre.

**Récit classique** :
Récit dont les scènes se lisent dans l'ordre des parties, puis des
chapitres, puis des scènes, sans renvois de choix.

**Récit à choix** :
Récit dont les scènes sont reliées par des options proposées au lecteur,
avec des convergences et des fins possibles.
