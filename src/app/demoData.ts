import { Especialidad } from "./brand";

export interface FamiliaDemo {
  id: string;
  nombre: string;
  tutor: string;
  email: string;
  direccion: string;
  animales: { id: string; nombre: string; especie: string }[];
}

export const familiasDemo: FamiliaDemo[] = [
  {
    id: "f1",
    nombre: "Familia García López",
    tutor: "María García López",
    email: "maria@ejemplo.com",
    direccion: "Carrer de la Pau 12, 08001 Barcelona",
    animales: [
      { id: "a1", nombre: "Luna", especie: "Gato" },
      { id: "a2", nombre: "Rocky", especie: "Perro" },
    ],
  },
  {
    id: "f2",
    nombre: "Familia Ruiz Soto",
    tutor: "Carlos Ruiz Soto",
    email: "carlos@ejemplo.com",
    direccion: "Av. Diagonal 450, 08006 Barcelona",
    animales: [
      { id: "a3", nombre: "Nala", especie: "Perro" },
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
