---
layout: default
---

# GRADUER

<div class="rule-ink w-24 my-3" />

<div>

Lorsqu'une lettre est lue (comme « a » en position 0 dans azur), la passe avant commence. Chaque opération ci-dessous fait deux choses à la fois : elle calcule son résultat, qui alimente l'opération suivante, et elle note en marge sa dérivée locale, qui dormira dans le graphe jusqu'à la passe arrière.

lookup du vecteur de « a » dans le vocabulaire (les 43 caractères + BOS = 44 tokens)
addition au vecteur de « 0 » dans les positions
multiplication aux vecteurs des 43 caractères + BOS du vocabulaire dans la projection
additions de tous les nombres de chacun de ces vecteurs, pour obtenir 1 résultat scalaire par projection
softmax sur la liste des 44 scores
pickup du résultat (pourcentage) correspondant au VRAI token suivant (les autres ne sont pas lus — mais ils restent dans le graphe)
logarithme sur ce pourcentage pour mettre à l'échelle des valeurs : plus il est grand, plus le logarithme s'approche de zéro ; plus il est bas, plus cette surprise est sanctionnée fort. Ce modificateur est négatif, mais on veut sa valeur absolue pour obtenir une « erreur » positive : c'est la fin de la « passe avant »

La passe arrière commence : backward(erreur)

l'erreur, sommet du graphe, reçoit le blâme initial : 1
l'autograd remonte le lignage à l'envers, nœud par nœud, en appliquant la règle locale notée à l'aller : une addition recopie le blâme tel quel à ses parents ; une multiplication le croise (chaque parent reçoit blâme × valeur de l'autre) ; log et exp le transforment selon leur pente ; et si un nœud est emprunté par plusieurs chemins, les blâmes s'additionnent
la traversée du logarithme puis du softmax produit un blâme par score, d'une netteté remarquable : chaque concurrent reçoit « baisse ton score, à hauteur de ta probabilité » ; le vrai token reçoit « monte le tien » (sa probabilité − 1, donc négatif)
traversée des projections : chaque case de chaque ligne reçoit blâme × ce qu'elle a vu (la case correspondante du vecteur d'entrée). Les 44 lignes sont blâmées à chaque passage, même celles des candidats absurdes : c'est ainsi que le modèle apprend aussi à ne PAS dire n'importe quoi
traversée de l'addition embedding + position : le blâme arrivé sur le vecteur fusionné est recopié à l'identique aux deux vecteurs d'origine
dépôt final : chaque case-paramètre impliquée porte maintenant son gradient, sa contribution exacte à l'erreur. Les nœuds intermédiaires, eux, partiront avec le graphe

Le step (l'autograd a fini son travail) :

l'optimiseur déplace chaque case en sens inverse de son gradient, d'un tout petit pas : case ← case − 0.01 × gradient (c'est l'idée ; le vrai optimiseur, Adam, en est une variante améliorée qui adapte ce pas case par case)
les gradients sont remis à zéro, le graphe est jeté : seules les matrices, déplacées d'un cheveu, se souviennent qu'« a » est passé
la lettre suivante prend la main : « z », qui vient de servir de correction à cette question, devient l'énoncé de la suivante (« z » en position 1)

</div>
<p class="opacity-70 -mt-1">Pour apprendre, il faut mesurer et trancher. <br/>
Paramètres: vecteurs des nombres aléatoires rangés en matrices : vocabulaire, positions, projections.<br/>
1 token = 1 vecteur. 1 nombre = un axe de description, dont le sens émergera au fil de l'entraînement.<br/>
Entraîner = mesurer l'erreur de prédiction, répartir les responsabilités case par case (Autograd)</p>
<div class="grid grid-cols-2 gap-6 mt-5">

<ComicPanel>
    <div style="font-family:'Anton',sans-serif; text-transform:uppercase; color: var(--crimson); font-size:1.3rem">Mesurer</div>
    <div class="text-sm mt-1 mb-0">
        <p>Les maths permettent d'apprendre quelle probabilité donner à chaque token suivant, sachant ce qui vient d'être lu:</p>
        <ul>
            <li>les "paramètres" sont des nombres rangés en matrices : tokens (ex. ligne du token lu : [-0.42, 0.15, 0.70]), positions (ex. [0.12, -0.22, 0.40]), projections (une ligne par candidat)</li>
            <li>lookup du token lu → son vecteur ; lookup de sa position → son vecteur ; les deux sont additionnés case par case → [-0.30, -0.07, 1.10]</li>
            <li>pour chaque candidat à la suite (tout le vocabulaire, dont le token lui-même) : sa ligne de projection est multipliée case par case avec ce vecteur, puis tout est sommé → un score par candidat (ex. avec 3 candidats : 0.031, 0.263, -0.194)</li>
            <li>les scores sont convertis en probabilités (total 100%) : [33%, 41%, 26%] — presque au hasard : normal, les paramètres sont aléatoires au début</li>
            <li>passe avant : l'autograd a mémorisé chacune de ces opérations dans un graphe</li>
            <li>le vrai token suivant était le candidat 2 ; sa probabilité (41%) est convertie en un score d'erreur (0.89), dont l'autograd connaît le lignage exact</li>
            <li>passe arrière : l'autograd assigne à chaque case de paramètre impliquée sa contribution à cette erreur (ex. 3e case du token lu : -0.219 ; 3e case de la position : -0.219 aussi — l'addition partage le blâme à l'identique ; 3e case de la ligne de projection du candidat 2 : -0.647)</li>
            <li>le modèle ajuste chaque case d'un tout petit pas, en sens inverse de sa contribution : paramètre − 0.01 × contribution (ex. 0.70 → 0.7022 ; 0.40 → 0.4022 ; 0.30 → 0.3065). Le score du vrai token montera la prochaine fois</li>
        </ul>
    </div>
</ComicPanel>

<ComicPanel>
<div style="font-family:'Anton',sans-serif; text-transform:uppercase; color: var(--teal); font-size:1.3rem">Trancher</div>
<p class="text-sm mt-1 mb-0">Chaque opération <strong>entraîne</strong> la suivante. Le « rapport » de chaque rouage se <strong>multiplie</strong> le long de la chaîne — du dernier engrenage jusqu'au tout premier.</p>
</ComicPanel>

</div>

<div class="panel mt-6" style="border-color: var(--teal); box-shadow: 6px 6px 0 var(--teal)">
Le geste d'autograd : partir de <strong>l'erreur</strong>, <strong>remonter tout le calcul à rebours</strong>, et rendre à chaque réglage sa <Sfx text="part de responsabilité!" color="crimson" size="1.2rem" />
</div>
