export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Andrei Popescu',
    role: 'Founder',
    company: 'NextHome',
    quote: 'Colaborarea a fost impecabila. Noul site ne-a crescut rata de conversie in primele 30 de zile.',
    rating: 5,
  },
  {
    name: 'Mara Ionescu',
    role: 'Marketing Lead',
    company: 'Urban Balance',
    quote: 'Echipa livreaza rapid si curat. Designul e premium, iar performanta tehnica e exact ce aveam nevoie.',
    rating: 5,
  },
  {
    name: 'Vlad Stan',
    role: 'CEO',
    company: 'Clinica Axis',
    quote: 'Am trecut de la un site lent la o platforma care inspira incredere si ne aduce lead-uri constante.',
    rating: 5,
  },
  {
    name: 'Ioana Marin',
    role: 'Operations Manager',
    company: 'Nordic Fit',
    quote: 'Timeline-ul a fost respectat la zi, iar comunicarea pe parcurs a fost foarte clara. Rezultatul arata excelent pe mobil.',
    rating: 5,
  },
  {
    name: 'Alex Dumitru',
    role: 'Product Owner',
    company: 'FinBoard',
    quote: 'Am obtinut un site mai rapid si mai usor de administrat. Fluxul de lead-uri din formular a crescut vizibil.',
    rating: 5,
  },
  {
    name: 'Raluca Ene',
    role: 'Co-Founder',
    company: 'Bloom Agency',
    quote: 'Ne-a placut atentia la detalii si felul in care designul se potriveste cu brandul nostru. Recomandam cu incredere.',
    rating: 5,
  },
  {
    name: 'Cristian Ilie',
    role: 'Head of Sales',
    company: 'SteelPoint',
    quote: 'Am cerut ceva scalabil pentru mai multe campanii, iar implementarea a fost gandita foarte pragmatic si eficient.',
    rating: 5,
  },
  {
    name: 'Bianca Pavel',
    role: 'Brand Strategist',
    company: 'Lumen Studio',
    quote: 'De la UX pana la micro-interactiuni, totul are sens. Clientii nostri au observat imediat diferenta de calitate.',
    rating: 5,
  },
];
