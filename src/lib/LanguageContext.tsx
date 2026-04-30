import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'IT' | 'EN';

type Dictionary = {
  [key: string]: {
    [key in Language]: string;
  };
};

// Dizionario basale
const dictionary: Dictionary = {
  salutation: { IT: "BENTORNATO", EN: "WELCOME BACK" },
  resident: { IT: "Condomino", EN: "Resident" },
  condominium_balance: { IT: "SALDO CONDOMINIALE", EN: "CONDOMINIUM BALANCE" },
  in_order: { IT: "In regola", EN: "In order" },
  pending: { IT: "In sospeso", EN: "Pending" },
  next_deadline: { IT: "PROSSIMA SCADENZA", EN: "NEXT DEADLINE" },
  pay: { IT: "Paga", EN: "Pay" },
  no_deadlines: { IT: "Nessuna spesa imminente", EN: "No upcoming fees" },
  administrative: { IT: "AMMINISTRATIVA", EN: "ADMINISTRATIVE" },
  balance: { IT: "Bilancio", EN: "Balance" },
  regulations: { IT: "Regolamento", EN: "Regulations" },
  minutes: { IT: "Verbali", EN: "Minutes" },
  bills: { IT: "Bollette", EN: "Bills" },
  property: { IT: "PROPRIETÀ", EN: "PROPERTY" },
  published: { IT: "pubblicati", EN: "published" },
  month_fee: { IT: "/mese", EN: "/month" },
  ordinary: { IT: "Ordinaria", EN: "Ordinary" },
  extraordinary: { IT: "Straordinaria", EN: "Extraordinary" },
  home: { IT: "Home", EN: "Home" },
  neighborhood: { IT: "Vicinato", EN: "Community" },
  services: { IT: "Servizi", EN: "Services" },
  contact_admin: { IT: "COMUNICA CON AMMINISTRATORE", EN: "CONTACT ADMIN" },
  my_residences: { IT: "Le mie case", EN: "My residences" },
  change_house: { IT: "Cambia casa", EN: "Change house" },
  auto_switch: { IT: "Cambio automatico (GPS)", EN: "Auto-switch (GPS)" },
  settings: { IT: "Impostazioni", EN: "Settings" },
  language: { IT: "Lingua", EN: "Language" },
  add_residence: { IT: "Aggiungi casa", EN: "Add home" },
  enter_address: { IT: "Inserisci indirizzo", EN: "Enter address" },
  enter_interior: { IT: "Interno (es. 3A)", EN: "Interior (e.g. 3A)" },
  confirm: { IT: "Conferma", EN: "Confirm" },
  cancel: { IT: "Annulla", EN: "Cancel" }
};

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: keyof typeof dictionary | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('treedoo_lang') as Language) || 'IT';
  });

  useEffect(() => {
    localStorage.setItem('treedoo_lang', lang);
  }, [lang]);

  const toggleLang = () => setLang(prev => prev === 'IT' ? 'EN' : 'IT');

  const t = (key: string) => {
    if (dictionary[key]) {
      return dictionary[key][lang];
    }
    return key; // Fallback alla chiave stessa se manca
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
