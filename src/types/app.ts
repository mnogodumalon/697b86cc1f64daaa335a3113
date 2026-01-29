// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Lagerorte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    bezeichnung?: string;
    beschreibung?: string;
    lagerort_typ?: 'hauptlager' | 'nebenlager' | 'firmenfahrzeug' | 'baustelle' | 'werkstatt' | 'sonstiges';
  };
}

export interface Mitarbeiter {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    personalnummer?: string;
    email?: string;
    telefon?: string;
    abteilung?: 'bauleitung' | 'lager' | 'verwaltung' | 'elektroinstallation' | 'wartung' | 'kundendienst';
  };
}

export interface Werkzeuge {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    werkzeugname?: string;
    hersteller?: string;
    modell?: string;
    seriennummer?: string;
    anschaffungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    anschaffungspreis?: number;
    aktueller_lagerort?: string; // applookup -> URL zu 'Lagerorte' Record
    zustand?: 'gut' | 'befriedigend' | 'ausreichend' | 'defekt' | 'neu' | 'sehr_gut';
    wartungsintervall_monate?: number;
    naechste_wartung?: string; // Format: YYYY-MM-DD oder ISO String
    notizen?: string;
  };
}

export interface Werkzeugausgabe {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    werkzeug?: string; // applookup -> URL zu 'Werkzeuge' Record
    mitarbeiter?: string; // applookup -> URL zu 'Mitarbeiter' Record
    ausgabedatum?: string; // Format: YYYY-MM-DD oder ISO String
    geplantes_rueckgabedatum?: string; // Format: YYYY-MM-DD oder ISO String
    verwendungszweck?: string;
    ausgabe_notizen?: string;
  };
}

export interface Werkzeugrueckgabe {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    werkzeugausgabe?: string; // applookup -> URL zu 'Werkzeugausgabe' Record
    rueckgabedatum?: string; // Format: YYYY-MM-DD oder ISO String
    zustand_bei_rueckgabe?: 'wie_ausgegeben' | 'leichte_gebrauchsspuren' | 'starke_gebrauchsspuren' | 'beschaedigt' | 'defekt';
    beschaedigungen?: string;
    rueckgabe_notizen?: string;
  };
}

export const APP_IDS = {
  LAGERORTE: '697b8682ba3f894a922a88c8',
  MITARBEITER: '697b868b271cdba1f355487c',
  WERKZEUGE: '697b868cc0013ffdb5f1e82d',
  WERKZEUGAUSGABE: '697b868d6b34303ccedce8ad',
  WERKZEUGRUECKGABE: '697b868ded3c30177996c1c9',
} as const;

// Helper Types for creating new records
export type CreateLagerorte = Lagerorte['fields'];
export type CreateMitarbeiter = Mitarbeiter['fields'];
export type CreateWerkzeuge = Werkzeuge['fields'];
export type CreateWerkzeugausgabe = Werkzeugausgabe['fields'];
export type CreateWerkzeugrueckgabe = Werkzeugrueckgabe['fields'];