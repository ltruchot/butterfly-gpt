// Formatage numérique standard des démos : 3 décimales fixes.
// (Les démos qui ont un besoin différent — attention en 2 décimales,
// parameters en notation exponentielle — gardent leur variante locale.)
export const fmt = (n: number): string => n.toFixed(3);
