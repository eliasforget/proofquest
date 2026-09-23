# Design system v0

## Couleurs fonctionnelles

Les valeurs ci-dessous sont une proposition, pas une dépendance de marque définitive.

```css
--bg: #07070b;
--panel: rgba(18, 18, 28, .72);
--text: #f5f7ff;
--muted: #9297aa;
--violet: #8f7cff;
--cyan: #66e6ff;
--green: #7af0b5;
--danger: #ff6b81;
--line: rgba(255,255,255,.09);
```

## Rayons

- cartes majeures : 24 px ;
- cartes secondaires : 16 px ;
- pills : 999 px.

## Typographie

Prototype : pile système uniquement pour rester autonome. Produit final : sélectionner une police web après validation licence/performance.

## Composants

- `OrbButton`
- `GlassPanel`
- `MetricBar`
- `SkillNode`
- `EvidenceChip`
- `QuestCard`
- `ScanProgress`

## Accessibilité

Les halos ne doivent jamais être l'unique indicateur. Conserver texte, icônes/labels, contraste et focus visibles.
