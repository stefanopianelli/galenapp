export const PHARMA_CONTROLS = {
    'Cartine e cialdini': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto e della tenuta del contenitore",
        'Verifica del numero di dosi allestite',
        'Uniformità di massa (NBP)',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Polveri composte e piante per tisane': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto e della tenuta del contenitore",
        'Verifica del numero di dosi allestite',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Capsule': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto e della tenuta delle capsule",
        'Verifica del numero di capsule allestite',
        'Uniformità di massa (NBP)',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Preparazioni semisolide per applicazione cutanea e paste': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Verifica del pH (se richiesto)',
        'Controllo della quantità da dispensare',
        'Controllo della tenuta del confezionamento',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Preparazioni semisolide orali vet (a peso)': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Verifica del pH (se richiesto)',
        'Controllo della quantità da dispensare',
        'Controllo della tenuta del confezionamento',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Preparazioni semisolide orali vet (a unità)': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Verifica del pH (se richiesto)',
        'Controllo della quantità da dispensare',
        'Controllo della tenuta del confezionamento',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Suppositori e ovuli': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto e delle caratteristiche organolettiche",
        'Verifica della consistenza',
        'Uniformità di massa',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Colliri sterili (soluzioni)': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Controllo della quantità da dispensare',
        'Controllo della tenuta del confezionamento',
        "Verifica della corretta compilazione dell'etichetta",
        'Verifica della sterilità'
    ],
    'Prep. oftalmiche sterili semisolide': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Controllo della quantità da dispensare',
        'Controllo della tenuta del confezionamento',
        "Verifica della corretta compilazione dell'etichetta",
        'Verifica della sterilità'
    ],
    'Preparazioni liquide (soluzioni)': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Verifica del pH (se richiesto)',
        'Controllo della quantità da dispensare',
        'Controllo della tenuta del confezionamento',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Estratti liquidi e tinture': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Verifica del pH (se richiesto)',
        'Controllo della quantità da dispensare',
        'Controllo della tenuta del confezionamento',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Emulsioni, sospensioni e miscele di olii': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Verifica separazione fase/ricostituibilità (Emulsioni)',
        'Verifica precipitato/ridispersibilità (Sospensioni)',
        'Verifica del pH (se richiesto)',
        'Controllo della quantità da dispensare',
        'Controllo della tenuta del confezionamento',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Compresse e gomme da masticare medicate': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Verifica del numero di compresse allestite',
        'Uniformità di massa (NBP)',
        'Verifica della durezza',
        'Controllo del confezionamento e tenuta',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Pillole, pastiglie e granulati (a unità)': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Verifica del numero di unità allestite',
        'Uniformità di massa (NBP)',
        'Verifica della durezza',
        'Controllo del confezionamento e tenuta',
        "Verifica della corretta compilazione dell'etichetta"
    ],
    'Pillole, pastiglie e granulati (a peso)': [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Verifica del numero di unità allestite',
        'Uniformità di massa (NBP)',
        'Verifica della durezza',
        'Controllo del confezionamento e tenuta',
        "Verifica della corretta compilazione dell'etichetta"
    ]
};

export const getDefaultControls = (form) => {
    return PHARMA_CONTROLS[form] || [
        'Verifica della correttezza delle procedure eseguite',
        "Controllo dell'aspetto",
        'Controllo della quantità/numero dosi',
        "Verifica della corretta compilazione dell'etichetta"
    ];
};