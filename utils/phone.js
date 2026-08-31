import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';

export const DEFAULT_PHONE_COUNTRY = 'US';

export function getPhoneCountries() {
  return getCountries().map((country) => ({
    code: country,
    callingCode: getCountryCallingCode(country),
  }));
}

export function normalizePhoneCountry(country) {
  return getCountries().includes(country) ? country : DEFAULT_PHONE_COUNTRY;
}

export function formatPhoneInput(value = '', country = DEFAULT_PHONE_COUNTRY) {
  return new AsYouType(normalizePhoneCountry(country)).input(value);
}

export function validateAndFormatPhone(value = '', country = DEFAULT_PHONE_COUNTRY) {
  const normalizedCountry = normalizePhoneCountry(country);
  const phone = parsePhoneNumberFromString(value, normalizedCountry);

  if (!phone || !phone.isValid()) {
    return {
      valid: false,
      country: normalizedCountry,
      formatted: value,
      e164: '',
    };
  }

  return {
    valid: true,
    country: phone.country || normalizedCountry,
    formatted: phone.formatInternational(),
    e164: phone.number,
  };
}
