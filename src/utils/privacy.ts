/**
 * privacyModetoolfunctioncount
 */

// cacheGeneratedprivacyEmail，ensuresameoneEmailevery timedisplaymutualsame
const privacyEmailCache = new Map<string, string>();

/**
 * willEmailAddressconvert toprivacyModedisplay
 * @param email originalEmail
 * @returns privacyEmail
 */
export function maskEmail(email: string): string {
  if (!email) return email;
  
  // checkcache
  if (privacyEmailCache.has(email)) {
    return privacyEmailCache.get(email)!;
  }
  
  // 基于Emailgeneratefixedrandomstring（use简singlehashensureconsistentproperty）
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash = hash & hash;
  }
  
  // usehashmakeas种childgeneratefixedrandomstring
  const seed = Math.abs(hash);
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let randomPart = '';
  let tempSeed = seed;
  for (let i = 0; i < 12; i++) {
    randomPart += chars.charAt(tempSeed % chars.length);
    tempSeed = Math.floor(tempSeed / 26) + i;
  }
  
  const maskedEmail = `${randomPart}@fuckwindsurf.com`;
  privacyEmailCache.set(email, maskedEmail);
  
  return maskedEmail;
}

/**
 * ClearprivacyEmailcache
 */
export function clearPrivacyCache(): void {
  privacyEmailCache.clear();
}
