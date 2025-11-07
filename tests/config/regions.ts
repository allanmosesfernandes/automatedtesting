/**
 * Region Configuration for Multi-Region Testing
 *
 * This file defines all supported regions and their specific configurations
 * including domain, locale, currency, and UI translations.
 */

export interface RegionConfig {
  code: string;
  name: string;
  domain: string;
  locale: string;
  currency: string;
  siteCode: number;
  translations: {
    greeting: string;
    signIn: string;
    signOut: string;
    signUp: string;
    register: string;
    login: string;
    account: string;
    forgotPassword: string;
    returnToSignIn: string;
  };
  errorMessages: {
    invalidCredentials: string;
    invalidEmail: string;
    requiredField: string;
    existingAccount: string;
    enterPassword: string; // "Enter your password" message
    enterEmailAddress: string; // "Enter your email address" message
    noAccountFound: string; // "There is no account associated with this email address" message
  };
}

export const REGIONS: Record<string, RegionConfig> = {
  US: {
    code: 'US',
    name: 'United States',
    domain: 'printerpix.com',
    locale: 'en-US',
    currency: 'USD',
    siteCode: 6,
    translations: {
      greeting: 'Hi',
      signIn: 'Sign in',
      signOut: 'Sign out',
      signUp: 'Sign Up',
      register: 'Register',
      login: 'Login',
      account: 'Account',
      forgotPassword: 'Forgot Password',
      returnToSignIn: 'Return to Sign In',
    },
    errorMessages: {
      invalidCredentials: 'Username or password incorrect',
      invalidEmail: 'Please enter a valid email address.',
      requiredField: 'This is required field.',
      existingAccount: 'An account with this email already exists',
      enterPassword: 'Enter your password',
      enterEmailAddress: 'Enter your email address',
      noAccountFound: 'There is no account associated with this email address',
    },
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    domain: 'printerpix.co.uk',
    locale: 'en-GB',
    currency: 'GBP',
    siteCode: 4,
    translations: {
      greeting: 'Hi',
      signIn: 'Sign in',
      signOut: 'Sign out',
      signUp: 'Sign Up',
      register: 'Register',
      login: 'Login',
      account: 'Account',
      forgotPassword: 'Forgot Password',
      returnToSignIn: 'Return to Sign In',
    },
    errorMessages: {
      invalidCredentials: 'Username or password incorrect',
      invalidEmail: 'Please enter a valid email address.',
      requiredField: 'This is required field.',
      existingAccount: 'An account with this email already exists',
      enterPassword: 'Enter your password',
      enterEmailAddress: 'Enter your email address',
      noAccountFound: 'There is no account associated with this email address',
    },
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    domain: 'printerpix.de',
    locale: 'de-DE',
    currency: 'EUR',
    siteCode: 16,
    translations: {
      greeting: 'Hallo',
      signIn: 'Mein Konto',
      signOut: 'Abmelden',
      signUp: 'Anmelden',
      register: 'Anmelden',
      login: 'Mein Konto',
      account: 'Konto',
      forgotPassword: 'Passwort vergessen',
      returnToSignIn: 'Zur Anmeldung zurückkehren',
    },
    errorMessages: {
      invalidCredentials: 'Benutzername oder Passwort ist falsch',
      invalidEmail: 'Ungültige E-Mail',
      requiredField: 'Dieses Feld ist erforderlich.',
      existingAccount: 'Obwohl Sie angegeben haben, ein neuer Kunde zu sein, wurde Ihre E-Mail-Adresse bereits verwendet.',
      enterPassword: 'Geben Sie Ihr Passwort ein',
      enterEmailAddress: 'E-Mail eingeben',
      noAccountFound: 'Es ist kein Konto mit dieser E-Mail-Adresse verknüpft',
    },
  },
  FR: {
    code: 'FR',
    name: 'France',
    domain: 'printerpix.fr',
    locale: 'fr-FR',
    currency: 'EUR',
    siteCode: 10,
    translations: {
      greeting: 'Salut',
      signIn: 'Se connecter',
      signOut: 'Déconnectez',
      signUp: "S'inscrire",
      register: "S'inscrire",
      login: 'Se connecter',
      account: 'Mon compte',
      forgotPassword: 'Mot de passe oublié',
      returnToSignIn: 'Retour à la connexion',
    },
    errorMessages: {
      invalidCredentials: 'Nom d\'utilisateur ou mot de passe incorrect',
      invalidEmail: 'S\'il vous plaît, mettez une adresse email valide.',
      requiredField: 'C\'est un champ obligatoire.',
      existingAccount: 'Bien que vous ayez indiqué que vous êtes un nouveau client, votre adresse email a déjà été utilisée.',
      enterPassword: 'Ce champ est obligatoire',
      enterEmailAddress: 'Entrez votre adresse email',
      noAccountFound: 'Il n\'y a pas de compte associé à cette adresse e-mail',
    },
  },
  IT: {
    code: 'IT',
    name: 'Italy',
    domain: 'printerpix.it',
    locale: 'it-IT',
    currency: 'EUR',
    siteCode: 13,
    translations: {
      greeting: 'Ciao',
      signIn: 'Accedi',
      signOut: 'Esci',
      signUp: 'Registrati',
      register: 'Registrati',
      login: 'Accedi',
      account: 'Il mio account',
      forgotPassword: 'Password dimenticata',
      returnToSignIn: 'Torna al login',
    },
    errorMessages: {
      invalidCredentials: 'Nome utente o password errati',
      invalidEmail: 'Inserisci un indirizzo email valido.',
      requiredField: 'Questo campo è obbligatorio.',
      existingAccount: 'Esiste già un account con questa email',
      enterPassword: 'Inserisci la tua Password',
      enterEmailAddress: 'Inserisci il tuo indirizzo email',
      noAccountFound: 'Non esiste un account associato a questo indirizzo email',
    },
  },
  ES: {
    code: 'ES',
    name: 'Spain',
    domain: 'printerpix.es',
    locale: 'es-ES',
    currency: 'EUR',
    siteCode: 12,
    translations: {
      greeting: 'Hola',
      signIn: 'Iniciar Sesión',
      signOut: 'Cerrar',
      signUp: 'Registrarse',
      register: 'Registrarse',
      login: 'Iniciar Sesión',
      account: 'Mi cuenta',
      forgotPassword: 'Olvidé mi contraseña',
      returnToSignIn: 'Volver al inicio de sesión',
    },
    errorMessages: {
      invalidCredentials: 'Usuario o contraseña incorrectos',
      invalidEmail: 'Por favor, ingresa una dirección de correo electrónico válida.',
      requiredField: 'Este campo es obligatorio.',
      existingAccount: 'Ya existe una cuenta con este correo electrónico',
      enterPassword: 'Ingresa tu contraseña',
      enterEmailAddress: 'Ingresa tu dirección de correo electrónico',
      noAccountFound: 'No hay ninguna cuenta asociada con esta dirección de correo electrónico',
    },
  },
  NL: {
    code: 'NL',
    name: 'Netherlands',
    domain: 'printerpix.nl',
    locale: 'nl-NL',
    currency: 'EUR',
    siteCode: 14,
    translations: {
      greeting: 'Hi',
      signIn: 'Inloggen',
      signOut: 'Uitloggen',
      signUp: 'Registreren',
      register: 'Registreren',
      login: 'Inloggen',
      account: 'Mijn account',
      forgotPassword: 'Wachtwoord vergeten',
      returnToSignIn: 'Terug naar inloggen',
    },
    errorMessages: {
      invalidCredentials: 'Gebruikersnaam of wachtwoord onjuist',
      invalidEmail: 'Voer een geldig e-mailadres in.',
      requiredField: 'Dit is een verplicht veld.',
      existingAccount: 'Er bestaat al een account met dit e-mailadres',
      enterPassword: 'Vul je wachtwoord in',
      enterEmailAddress: 'Voer je e-mailadres in',
      noAccountFound: 'Er is geen account gekoppeld aan dit e-mailadres',
    },
  },
};

/**
 * Get region configuration by code
 */
export function getRegion(code: string): RegionConfig {
  const region = REGIONS[code.toUpperCase()];
  if (!region) {
    throw new Error(`Unknown region code: ${code}. Available regions: ${Object.keys(REGIONS).join(', ')}`);
  }
  return region;
}

/**
 * Get all available region codes
 */
export function getAllRegionCodes(): string[] {
  return Object.keys(REGIONS);
}

/**
 * Check if a region code is valid
 */
export function isValidRegion(code: string): boolean {
  return code.toUpperCase() in REGIONS;
}
