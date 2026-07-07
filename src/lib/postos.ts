export const POSTOS = [
  "Coronel",
  "Tenente-Coronel",
  "Major",
  "Capitão",
  "1º Tenente",
  "2º Tenente",
  "Aspirante-a-Oficial",
  "Subtenente",
  "1º Sargento",
  "2º Sargento",
  "3º Sargento",
  "Cabo",
  "Soldado",
] as const;

export const OFICIAIS = POSTOS.slice(0, 7);
export const PRACAS = POSTOS.slice(7);

export const postoRank = (p?: string) => {
  const i = POSTOS.indexOf((p as any) || "");
  return i === -1 ? POSTOS.length : i;
};
