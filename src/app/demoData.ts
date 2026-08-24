import { Especialidad } from "./brand";

export interface AnimalFicha {
  id: string;
  nombre: string;
  especie: string;
  raza: string;
  sexo: "macho" | "hembra";
  edad: number;
  fechaNacimiento: string;
  color: string;
  peso: string;
  microchip: string;
  notasProfesional: string;
  notasTutor: string;
}

export interface ProfesionalEquipo {
  id: number | string;
  nombre: string;
  especialidad: string;
}

export interface FamiliaDemo {
  id: string;
  nombre: string;
  tutor: string;
  email: string;
  direccion: string;
  numeroSocio?: string;
  animales: AnimalFicha[];
  equipo?: ProfesionalEquipo[];
}

export const equipoDemo: ProfesionalEquipo[] = [
  { id: "p-edu", nombre: "Laura Vidal", especialidad: "Educación canina" },
  { id: "p-nut", nombre: "Noelia Serra", especialidad: "Nutrición" },
  { id: "p-ter", nombre: "Clara Puig", especialidad: "Terapia familiar" },
];

export const familiasDemo: FamiliaDemo[] = [
  {
    id: "f1",
    nombre: "Familia García López",
    tutor: "María García López",
    email: "maria@ejemplo.com",
    direccion: "Carrer de la Pau 12, 08001 Barcelona",
    numeroSocio: "TA-2026-00482",
    equipo: equipoDemo,
    animales: [
      {
        id: "a1",
        nombre: "Luna",
        especie: "Gato",
        raza: "Europea común",
        sexo: "hembra",
        edad: 4,
        fechaNacimiento: "2022-03-15",
        color: "Atigrada gris",
        peso: "4,2 kg",
        microchip: "941000024871562",
        notasProfesional: "Alergia leve a ciertos piensos con cereales. Dieta hipoalergénica recomendada.",
        notasTutor: "Prefiere comida húmeda por la mañana. Evita el contacto con otros gatos en el patio.",
      },
      {
        id: "a2",
        nombre: "Rocky",
        especie: "Perro",
        raza: "Labrador Retriever",
        sexo: "macho",
        edad: 2,
        fechaNacimiento: "2024-05-08",
        color: "Dorado",
        peso: "28,5 kg",
        microchip: "941000031245789",
        notasProfesional: "En seguimiento por episodio de gastroenteritis julio 2026. Evolución favorable.",
        notasTutor: "Muy activo; necesita paseos largos. Se pone nervioso con truenos.",
      },
    ],
  },
  {
    id: "f2",
    nombre: "Familia Ruiz Soto",
    tutor: "Carlos Ruiz Soto",
    email: "carlos@ejemplo.com",
    direccion: "Av. Diagonal 450, 08006 Barcelona",
    numeroSocio: "TA-2026-00501",
    equipo: equipoDemo,
    animales: [
      {
        id: "a3",
        nombre: "Nala",
        especie: "Perro",
        raza: "Mestiza",
        sexo: "hembra",
        edad: 3,
        fechaNacimiento: "2023-04-12",
        color: "Canela",
        peso: "18 kg",
        microchip: "941000044112233",
        notasProfesional: "Trabajo de socialización en paseos urbanos.",
        notasTutor: "Muy sociable. Tira un poco de la correa al ver otros perros.",
      },
    ],
  },
];

export interface CitaDemo {
  id: string;
  fecha: string;
  hora: string;
  tipo: string;
  profesional: Especialidad | string;
  animal: string;
  familia: string;
  tutor: string;
  estado: "confirmada" | "pendiente" | "completada" | "cancelada" | "rechazada";
  notas?: string;
  soloProfesional?: boolean;
}

export const citasDemoIniciales: CitaDemo[] = [
  {
    id: "1",
    fecha: "2026-08-22",
    hora: "11:00",
    tipo: "Educación canina",
    profesional: "Educación canina",
    animal: "Rocky",
    familia: "Familia García López",
    tutor: "María García López",
    estado: "confirmada",
  },
  {
    id: "7",
    fecha: "2026-08-18",
    hora: "10:00",
    tipo: "Educación canina",
    profesional: "Educación canina",
    animal: "Rocky",
    familia: "Familia García López",
    tutor: "María García López",
    estado: "pendiente",
    notas: "Solicitud del tutor: trabajo con ruidos fuertes.",
  },
  {
    id: "2",
    fecha: "2026-09-03",
    hora: "16:30",
    tipo: "Nutrición",
    profesional: "Nutrición",
    animal: "Luna",
    familia: "Familia García López",
    tutor: "María García López",
    estado: "pendiente",
    notas: "Seguimiento dieta hipoalergénica.",
  },
  {
    id: "5",
    fecha: "2026-08-28",
    hora: "18:00",
    tipo: "Grupo de desarrollo",
    profesional: "Educación canina",
    animal: "Rocky",
    familia: "Familia García López",
    tutor: "María García López",
    estado: "confirmada",
    soloProfesional: true,
    notas: "Sesión 3 del bono de grupos de desarrollo.",
  },
  {
    id: "6",
    fecha: "2026-09-05",
    hora: "17:30",
    tipo: "Dog café",
    profesional: "Terapia familiar",
    animal: "Familia",
    familia: "Familia García López",
    tutor: "María García López",
    estado: "confirmada",
    soloProfesional: true,
    notas: "Sesión de terapia grupal Dog café.",
  },
  {
    id: "8",
    fecha: "2026-08-25",
    hora: "12:00",
    tipo: "Educación canina",
    profesional: "Educación canina",
    animal: "Nala",
    familia: "Familia Ruiz Soto",
    tutor: "Carlos Ruiz Soto",
    estado: "confirmada",
  },
  {
    id: "3",
    fecha: "2026-07-10",
    hora: "09:00",
    tipo: "Nutrición",
    profesional: "Nutrición",
    animal: "Rocky",
    familia: "Familia García López",
    tutor: "María García López",
    estado: "completada",
    notas: "Ajuste de ración y transición a dieta blanda durante 5 días.",
  },
  {
    id: "4",
    fecha: "2026-06-05",
    hora: "17:00",
    tipo: "Educación canina",
    profesional: "Educación canina",
    animal: "Luna",
    familia: "Familia García López",
    tutor: "María García López",
    estado: "completada",
    notas: "Trabajo de habituación al transporte y refuerzo positivo.",
  },
];
