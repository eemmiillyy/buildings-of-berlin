export const BERLIN_NEIGHBORHOODS = [
    'Charlottenburg-Wilmersdorf',
    'Friedrichshain-Kreuzberg',
    'Lichtenberg',
    'Marzahn-Hellersdorf',
    'Mitte',
    'Neukölln',
    'Pankow',
    'Reinickendorf',    
    'Spandau',
    'Steglitz-Zehlendorf',
    'Tempelhof-Schöneberg',
    'Treptow-Köpenick',
] as const;

export const ARCHITECTURAL_ERAS = [
    'Art Nouveau',
    'Art Deco',
    'Streamline Moderne',
    'Mid Century Modern',
    'Googie/Populuxe',
    'Metabolism',
    'High Tech',
    'Modernism',
    'Postmodernism',
    'Baroque',
    'Contemporary',
    'Brutalism',
    'Bauhaus'
] as const;

export type BerlinNeighborhood = typeof BERLIN_NEIGHBORHOODS[number];
export type ArchitecturalEra = typeof ARCHITECTURAL_ERAS[number]; 