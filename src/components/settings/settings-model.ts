export const currencies = ["CDF", "USD"] as const;
export const roles = [
  "Administrateur",
  "Trésorier",
  "Secrétaire",
  "Membre",
] as const;
export const permissionLabels = [
  "Consulter les finances",
  "Gérer les cotisations",
  "Gérer les dépenses",
  "Gérer les membres",
  "Clôturer un exercice",
  "Gérer les paramètres",
];

export type SettingsData = ReturnType<typeof createSettings>;
export function createSettings() {
  return {
    association: {
      name: "Les Horizons",
      description: "Association d’entraide et de solidarité à Lubumbashi.",
      email: "contact@les-horizons.example",
      phone: "+243 000 000 000",
      address: "Lubumbashi, Haut-Katanga, RDC",
      currency: "CDF",
      logo: "",
    },
    contributions: {
      amount: "25000",
      deadline: "10",
      partial: true,
      arrears: true,
      carryArrears: true,
      exemption: true,
      effectiveDate: "2026-11-01",
      history: [
        { amount: "25000", date: "2026-01-01", author: "Admin Ustawi" },
        { amount: "20000", date: "2025-10-01", author: "Admin Ustawi" },
      ],
      exemptions: [
        {
          name: "Grâce Kabeya",
          reason: "Exemption temporaire",
          until: "2026-12-31",
        },
      ],
    },
    financial: {
      start: "2026-01-01",
      end: "2026-12-31",
      opening: "150000",
      lock: true,
      carry: true,
      status: "Ouvert",
      periods: [
        {
          name: "Exercice 2025",
          period: "01/10/2025 → 31/12/2025",
          balance: "150 000",
          status: "Clôturé",
        },
      ],
    },
    expenses: {
      ceiling: "100000",
      receipt: true,
      validation: true,
      approver: "Trésorier",
      categories: [
        { name: "Solidarité", limit: "150000" },
        { name: "Fonctionnement", limit: "75000" },
        { name: "Événements", limit: "200000" },
      ],
    },
    members: {
      approval: true,
      automatic: false,
      mandatory: true,
      inactiveExempt: true,
      fee: "10000",
      rules:
        "Adhésion après validation du comité et paiement des frais d’inscription.",
      statuses: ["Actif", "Inactif", "Suspendu", "Exempté"],
    },
    users: [
      {
        name: "Admin Ustawi",
        email: "admin@Ustawi.example",
        role: "Administrateur",
        active: true,
      },
      {
        name: "Sarah Mbuyi",
        email: "sarah@les-horizons.example",
        role: "Trésorier",
        active: true,
      },
      {
        name: "Jean Ilunga",
        email: "jean@les-horizons.example",
        role: "Secrétaire",
        active: true,
      },
      {
        name: "Grâce Kabeya",
        email: "grace@les-horizons.example",
        role: "Membre",
        active: false,
      },
    ],
    permissions: {
      Administrateur: [true, true, true, true, true, true],
      Trésorier: [true, true, true, false, true, false],
      Secrétaire: [true, false, false, true, false, false],
      Membre: [true, false, false, false, false, false],
    } as Record<string, boolean[]>,
    notifications: {
      reminders: true,
      unpaid: true,
      excessive: true,
      payment: true,
      email: true,
      inApp: true,
      days: "3",
      time: "09:00",
      threshold: "100000",
      frequency: "Hebdomadaire",
    },
    appearance: {
      theme: "dark",
      color: "Émeraude",
      language: "Français",
      dates: "DD/MM/YYYY",
      numbers: "1 234,56",
      decimals: "2",
    },
  };
}

export const initialEvents = [
  {
    user: "Admin Ustawi",
    action: "Paramètres",
    date: "17/10/2026 · 09:12",
    details: "Montant mensuel défini à 25 000 CDF.",
  },
  {
    user: "Sarah Mbuyi",
    action: "Dépense",
    date: "16/10/2026 · 14:30",
    details: "Validation d’une dépense de solidarité de 50 000 CDF.",
  },
  {
    user: "Jean Ilunga",
    action: "Membre",
    date: "15/10/2026 · 11:05",
    details: "Activation du compte de Grâce Kabeya.",
  },
  {
    user: "Sarah Mbuyi",
    action: "Cotisation",
    date: "14/10/2026 · 08:45",
    details: "Paiement de 25 000 CDF enregistré pour Jean Ilunga.",
  },
  {
    user: "Admin Ustawi",
    action: "Exercice",
    date: "01/01/2026 · 10:00",
    details: "Ouverture de l’exercice 2026 avec report de 150 000 CDF.",
  },
];
