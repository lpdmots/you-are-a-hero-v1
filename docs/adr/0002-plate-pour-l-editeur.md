# Plate pour l'éditeur de scène

Décision du 2 octobre 2026 : l'éditeur de scène est construit avec Plate, qui
repose sur Slate. Le prototype jetable a tenu les quatorze points de la liste,
dont les six qui pouvaient le condamner : paragraphe de choix, renvoi
insécable, suppression, presse-papiers, blocs protégés et action de jeu, sous
Chromium et WebKit. Tiptap, l'alternative, n'a pas été essayé : le choix
repose sur le fait que Plate suffit, non sur une comparaison.

Ce choix a un prix accepté. Plate ne fournit aucune règle du récit ; elles
s'écrivent contre Slate, et présenter la phrase automatique et les blocs
protégés comme des blocs fermés demande six contournements sensibles aux
montées de version. Les versions seront figées et les scénarios de test du
prototype repris comme filet, non son code.

La décision serait rouverte si l'usage sur tablette, avec clavier virtuel, ou
avec un lecteur d'écran échouait : rien de cela n'a été vérifié sur appareil.
Le porteur met cet essai de côté le 3 octobre 2026 : il ne peut pas le faire
et la tablette n'est pas le support de prédilection. Verdicts, preuves et réserves sont dans
[l'architecture](../architecture.md#résultats-du-prototype-de-léditeur-2-octobre-2026).
