export type TeamConfig = {
  name: string;
  parentName?: string;
  members: string[];
};

export const teams: TeamConfig[] = [
  {
    name: "Financeiro",
    members: [
      "U073LJ2QH7B",
    ],
  },
  {
    name: "Controladoria",
    parentName: "Financeiro",
    members: [
      "U07GX3SQ79Q",
      "U0AKT9K3163",
      "U07DT6F2D63",
      "U0BARN63VPH",
      "U0900GE3CRZ",
    ],
  },
  {
    name: "Tesouraria",
    parentName: "Financeiro",
    members: [
      "U079TGGHZ63",
      "U0BB76RA18S",
      "U07QQ71QGKH",
      "U08HH400CMR",
    ],
  },
  {
    name: "Contas a Pagar",
    parentName: "Financeiro",
    members: [
      "U079TGGHZ63",
      "U03EWATANQ6",
      "U081H3HHDQS",
      "U0AQ6SU36GY",
    ],
  },
  {
    name: "FP&A",
    parentName: "Financeiro",
    members: [
      "U079TGGHZ63",
      "U03EWATANQ6",
    ],
  },
  {
    name: "Compras",
    parentName: "Financeiro",
    members: [
      "U079TGGHZ63",
      "U03EWATANQ6",
      "U07ELCZT6G1",
      "U06QVMKNDA9",
    ],
  },
];