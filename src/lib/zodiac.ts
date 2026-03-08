/**
 * Zodiac sign utility based on birth date
 */

interface ZodiacInfo {
  sign: string;
  emoji: string;
  label: string;
}

const ZODIAC_SIGNS: { month: number; day: number; sign: ZodiacInfo }[] = [
  { month: 1, day: 20, sign: { sign: 'capricorn', emoji: '♑', label: 'Capricorne' } },
  { month: 2, day: 19, sign: { sign: 'aquarius', emoji: '♒', label: 'Verseau' } },
  { month: 3, day: 20, sign: { sign: 'pisces', emoji: '♓', label: 'Poissons' } },
  { month: 4, day: 20, sign: { sign: 'aries', emoji: '♈', label: 'Bélier' } },
  { month: 5, day: 21, sign: { sign: 'taurus', emoji: '♉', label: 'Taureau' } },
  { month: 6, day: 21, sign: { sign: 'gemini', emoji: '♊', label: 'Gémeaux' } },
  { month: 7, day: 23, sign: { sign: 'cancer', emoji: '♋', label: 'Cancer' } },
  { month: 8, day: 23, sign: { sign: 'leo', emoji: '♌', label: 'Lion' } },
  { month: 9, day: 23, sign: { sign: 'virgo', emoji: '♍', label: 'Vierge' } },
  { month: 10, day: 23, sign: { sign: 'libra', emoji: '♎', label: 'Balance' } },
  { month: 11, day: 22, sign: { sign: 'scorpio', emoji: '♏', label: 'Scorpion' } },
  { month: 12, day: 22, sign: { sign: 'sagittarius', emoji: '♐', label: 'Sagittaire' } },
  { month: 12, day: 31, sign: { sign: 'capricorn', emoji: '♑', label: 'Capricorne' } },
];

export function getZodiacSign(birthDate: string | Date): ZodiacInfo | null {
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(date.getTime())) return null;

  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const z of ZODIAC_SIGNS) {
    if (month < z.month || (month === z.month && day <= z.day)) {
      return z.sign;
    }
  }
  return ZODIAC_SIGNS[ZODIAC_SIGNS.length - 1].sign;
}

export function isBirthdayToday(birthDate: string | Date): boolean {
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(date.getTime())) return false;
  
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export function formatBirthday(birthDate: string | Date): string {
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}
