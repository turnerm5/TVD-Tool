/*
 * © 2025 Hoffman Construction
 *
 * This software is the property of Hoffman Construction.
 * All rights reserved.
 *
 * Unauthorized duplication or distribution of this software,
 * in whole or in part, is strictly prohibited.
 *
 * Author: Marshall Turner
 */

const sampleData = {
    "phase2": {
        "totalProjectBudget": 40000000
    },
    "indirectCosts": [
        { "Category": "GCs and Insurance", "Subcategory": "Precon and Fee", "Percentage": 0.0686 },
        { "Category": "Escalation & Contingency", "Subcategory": "Design Contingency", "Percentage": 0.0538 },
        { "Category": "Escalation & Contingency", "Subcategory": "Construction Contingency", "Percentage": 0.0538 },
        { "Category": "GCs and Insurance", "Subcategory": "Bonds and Insurance", "Percentage": 0.0437 },
        { "Category": "Permits", "Subcategory": "Building Permit", "Percentage": 0.0034 }
    ],
    "initialTargetValues": [
        { "name": "A Substructure", "target_value": 33.50 },
        { "name": "B10 Superstructure", "target_value": 98 },
        { "name": "B20 Enclosure", "target_value": 100 },
        { "name": "B30 Roofing", "target_value": 15 },
        { "name": "C Interiors", "target_value": 115 },
        { "name": "D Services", "target_value": 265 },
        { "name": "E Equipment and Furnishings", "target_value": 50.00 },
        { "name": "F Special Construction", "target_value": 20 },
        { "name": "G Building Sitework", "target_value": 42 }
    ],
    "interiorTargetValues": [
        {
            "name": "Classrooms",
            "C Interiors": 63,
            "D Services": 200,
            "E Equipment and Furnishings": 25
        },
        {
            "name": "Curricular Space",
            "C Interiors": 62,
            "D Services": 190,
            "E Equipment and Furnishings": 30
        },
        {
            "name": "Offices",
            "C Interiors": 70,
            "D Services": 210,
            "E Equipment and Furnishings": 20
        },
        {
            "name": "Project",
            "C Interiors": 65,
            "D Services": 200,
            "E Equipment and Furnishings": 39
        },
        {
            "name": "Research",
            "C Interiors": 80,
            "D Services": 370,
            "E Equipment and Furnishings": 51
        },
        {
            "name": "Student Space",
            "C Interiors": 55,
            "D Services": 180,
            "E Equipment and Furnishings": 15
        }
    ],
    "schemes": [
        {
            "name": "Predesign",
            "description": "Northside core built right up to Eastlick. The three story massing version can connect with a ramped bridge to 3rd Level of Abelson.",
            "image": "img/schemes/predesign.jpg",
            "grossSF": 58000,
            "floors": 3,
            "floorData": [
                { "floor": 1, "sf": 19334, "shelled": false, "phase": 1 },
                { "floor": 2, "sf": 19333, "shelled": true, "phase": 1 },
                { "floor": 3, "sf": 19333, "shelled": true, "phase": 1 }
            ],
            "phases": 1,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 20000 },
                { "name": "B10 Superstructure", "square_footage": 58000 },
                { "name": "B20 Enclosure", "square_footage": 40000 },
                { "name": "B30 Roofing", "square_footage": 20000 },
                { "name": "C Interiors", "square_footage": 58000 },
                { "name": "D Services", "square_footage": 58000 },
                { "name": "E Equipment and Furnishings", "square_footage": 58000 },
                { "name": "F Special Construction", "square_footage": 10000 },
                { "name": "G Building Sitework", "square_footage": 32495 }
            ]
        },
        {
            "name": "Student Porch",
            "description": "A student-focused entry and gathering space along College, teaching labs abutting Eastlick.",
            "image": "img/schemes/studentPorch.jpg",
            "grossSF": 58000,
            "floors": 3,
            "phases": 1,
            "floorData": [
                { "floor": 1, "sf": 25000, "shelled": false, "phase": 1 },
                { "floor": 2, "sf": 20000, "shelled": false, "phase": 1 },
                { "floor": 3, "sf": 13000, "shelled": false, "phase": 1 }
            ],
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 25000 },
                { "name": "B10 Superstructure", "square_footage": 58000 },
                { "name": "B20 Enclosure", "square_footage": 30000 },
                { "name": "B30 Roofing", "square_footage": 25000 },
                { "name": "C Interiors", "square_footage": 58000 },
                { "name": "D Services", "square_footage": 58000 },
                { "name": "E Equipment and Furnishings", "square_footage": 58000 },
                { "name": "F Special Construction", "square_footage": 10000 },
                { "name": "G Building Sitework", "square_footage": 22800 }
            ]
        },
        {
            "name": "Marquee Mix",
            "description": "Direct frontage connection to College. Lecture hall on the ground floor, with teaching labs on the upper floors.",
            "image": "img/schemes/marqueeMix.jpg",
            "grossSF": 66000,
            "floors": 4,
            "phases": 1,
            "floorData": [
                { "floor": 1, "sf": 16500, "shelled": false, "phase": 1 },
                { "floor": 2, "sf": 16500, "shelled": false, "phase": 1 },
                { "floor": 3, "sf": 16500, "shelled": false, "phase": 1 },
                { "floor": 4, "sf": 16500, "shelled": true, "phase": 1 }
            ],
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 17000 },
                { "name": "B10 Superstructure", "square_footage": 66000 },
                { "name": "B20 Enclosure", "square_footage": 40000 },
                { "name": "B30 Roofing", "square_footage": 16500 },
                { "name": "C Interiors", "square_footage": 66000 },
                { "name": "D Services", "square_footage": 66000 },
                { "name": "E Equipment and Furnishings", "square_footage": 66000 },
                { "name": "F Special Construction", "square_footage": 10000 },
                { "name": "G Building Sitework", "square_footage": 35000 }
            ]
        },
        {
            "name": "Base + Donor",
            "description": "Breaks up the building into two phases, with a base program of teaching labs and a donor program of the lecture hall.",
            "image": "img/schemes/baseAndDonor.jpg",
            "grossSF": 68000,
            "floors": 3,
            "phases": 2,
            "phaseNames": ["Base", "Donor"],
            "floorData": [
                { "floor": 1, "sf": 13333, "shelled": false, "phase": 1 }, { "floor": 1, "sf": 9333, "shelled": false, "phase": 2 },
                { "floor": 2, "sf": 13333, "shelled": false, "phase": 1 }, { "floor": 2, "sf": 9333, "shelled": false, "phase": 2 },
                { "floor": 3, "sf": 13333, "shelled": false, "phase": 1 }, { "floor": 3, "sf": 9333, "shelled": false, "phase": 2 }
            ],
            "costOfWork": [
                { "name": "A Substructure", "square_footage": [13333, 9333] },
                { "name": "B10 Superstructure", "square_footage": [40000, 28000] },
                { "name": "B20 Enclosure", "square_footage": [30000, 20000] },
                { "name": "B30 Roofing", "square_footage": [13333, 9333] },
                { "name": "C Interiors", "square_footage": [40000, 28000] },
                { "name": "D Services", "square_footage": [40000, 28000] },
                { "name": "E Equipment and Furnishings", "square_footage": [40000, 28000] },
                { "name": "F Special Construction", "square_footage": [10000, 5000] },
                { "name": "G Building Sitework", "square_footage": [22800, 5000] }
            ]
        }
    ],
   "lockSets": [
        {
            "name": "Structure & Interiors",
            "unlocked": ["B10 Superstructure", "C Interiors"]
        },
        {
            "name": "Enclosure & Services",
            "unlocked": ["B20 Enclosure", "D Services"]
        }
   ],
   "benchmarks": [
        {
            "id": "A",
            "name": "BSU Materials Science",
            "image": "img/benchmarks/bsu-mat/bsu-mat.jpg",
            "overall_sf_cost": 720.64,
            "grossSF": 89800,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 13.79,
                    "systemDetail": "25-inch thick monolithic concrete foundation for vibration isolation of sensitive materials science instrumentation; includes an underground stormwater retention system."
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 80.90,
                    "systemDetail": "Exposed structural system of concrete, steel, and wood, designed to serve as a teaching tool for materials science."
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 114.44,
                    "systemDetail": "Facade of brick and metal panels with ceramic fritted glass on south-facing windows; exterior materials wrap into the interior.",
                    "image": "img/benchmarks/bsu-mat/enclosure.jpg"
                },
                { 
                    "name": "B30 Roofing", 
                    "cost": 13.16 
                },
                { 
                    "name": "C Interiors", 
                    "cost": 90.81,
                    "systemDetail": "Over 40 materials science labs, including core facilities for electron microscopy and surface science; features polished concrete and end-grain wood floors.",
                    "image": "img/benchmarks/bsu-mat/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 324.53,
                    "systemDetail": "High-precision Variable Air Volume (VAV) system with HEPA filtration and low-velocity laminar airflow for vibration and particulate control.",
                    "pros": "Provides exceptional environmental stability (temperature, vibration, particulates) for sensitive research; highly responsive.",
                    "cons": "High energy consumption due to tight controls and filtration; complex to design, install, and commission.",
                    "image": "img/benchmarks/bsu-mat/services.jpg"
                },
                { 
                    "name": "E Equipment and Furnishings", 
                    "cost": 63.26 
                },
                { 
                    "name": "F Special Construction",
                    "cost": 4.46 
                },
                { 
                    "name": "G Building Sitework", 
                    "cost": 39.37,
                    "image": "img/benchmarks/bsu-mat/sitework.jpg"
                }
            ]
        },
        {
            "id": "B",
            "name": "OSU Johnson Hall",
            "image": "img/benchmarks/osu-johnson-hall/osu-johnson-hall.jpg",
            "overall_sf_cost": 872.21,
            "grossSF": 61886,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 21.75,
                    "systemDetail": "Detail needed."
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 73.54,
                    "systemDetail": "Five 52-foot, freestanding concrete shear walls. Structural steel frame with composite metal decks; features a full-story steel transfer truss to create a column-free auditorium."
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 139.13,
                    "systemDetail": "Extensive exterior glazing and interior glass walls to promote 'science on display'; cladding supported by a cold-formed steel backup system.",
                    "image": "img/benchmarks/osu-johnson-hall/enclosure.jpg"
                },
                { 
                    "name": "B30 Roofing", 
                    "cost": 18.31 
                },
                { 
                    "name": "C Interiors", 
                    "cost": 109.52,
                    "systemDetail": "Highly complex labs with 32 different specialty gas piping systems; features a 'Unit Ops' teaching lab and a biomedical prototyping facility.",
                    "image": "img/benchmarks/osu-johnson-hall/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 398.47,
                    "systemDetail": "Hybrid system using radiant floors/ceilings and chilled beams, with a dedicated VAV exhaust system (Phoenix) and heat recovery for lab safety.",
                    "pros": "Extremely energy-efficient due to radiant systems and heat recovery; provides superior, quiet occupant comfort.",
                    "cons": "Complex control integration between systems; radiant systems have slow thermal response times; potential condensation risk."
                },
                { 
                    "name": "E Equipment and Furnishings", 
                    "cost": 60.74,
                    "image": "img/benchmarks/osu-johnson-hall/equipment.jpg"
                },
                { 
                    "name": "F Special Construction", 
                    "cost": 2.36 
                },
                { 
                    "name": "G Building Sitework", 
                    "cost": 51.74,
                    "image": "img/benchmarks/osu-johnson-hall/sitework.jpg"
                }
            ]
        },
        {
            "id": "C",
            "name": "UI Integrated Research Building",
            "image": "img/benchmarks/ui-iric/ui-iric.jpg",
            "overall_sf_cost": 915.34,
            "grossSF": 78267,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 32.00,
                    "systemDetail": "Includes a 3,500 cubic foot rainwater catchment system for irrigation; specific structural foundation details are not available."
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 90.40,
                    "systemDetail": "Structural system accommodates a three-story central atrium; specific framing material and type are not available.",
                    "image": "img/benchmarks/ui-iric/superstructure.jpg"
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 132.59,
                    "systemDetail": "Perforated aluminum screen panel system over glazed curtainwall for solar shading; features a tiered, walkable green roof.",
                    "image": "img/benchmarks/ui-iric/enclosure.jpg"
                },
                { 
                    "name": "B30 Roofing", 
                    "cost": 24.33 
                },
                { 
                    "name": "C Interiors", 
                    "cost": 132.79,
                    "systemDetail": "Raised access flooring system with cementitious panels and modular workbenches to provide maximum lab flexibility for rotating research teams.",
                    "image": "img/benchmarks/ui-iric/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 391.43,
                    "systemDetail": "Mixed system with Variable Air Volume (VAV) controllers for labs, fan coil units for general spaces, and chilled beams for supplemental cooling.",
                    "pros": "Flexible design accommodates different research needs; uses proven VAV technology for lab safety; biomass boiler provides sustainable energy.",
                    "cons": "VAV portion has high energy use and potential for noise; multiple system types increase maintenance complexity.",
                    "image": "img/benchmarks/ui-iric/services.jpg"
                },
                { "name": "E Equipment and Furnishings", "cost": 55.75 },
                { "name": "F Special Construction", "cost": 0.39 },
                { 
                    "name": "G Building Sitework", 
                    "cost": 55.69,
                    "image": "img/benchmarks/ui-iric/sitework.jpg"
                }
            ]
        },
        {
            "id": "D",
            "name": "BSU Science and Research Building",
            "image": "img/benchmarks/bsu-srb/bsu-srb.jpg",
            "overall_sf_cost": 811.00,
            "grossSF": 101000,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 18.43
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 106.93
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 132.00
                },
                { 
                    "name": "B30 Roofing", 
                    "cost": 15.96 
                },
                { 
                    "name": "C Interiors", 
                    "cost": 89.15
                },
                { 
                    "name": "D Services", 
                    "cost": 454.96
                },
                { 
                    "name": "E Equipment and Furnishings", 
                    "cost": 43.39
                },
                { 
                    "name": "F Special Construction", 
                    "cost": 4.16
                },
                { 
                    "name": "G Building Sitework", 
                    "cost": 43.91
                }
            ]
        },
        {
            "id": "E",
            "name": "WSUV Life Sciences Building",
            "image": "img/benchmarks/wsuv-lsb/wsuv-lsb.jpg",
            "overall_sf_cost": 729.00,
            "grossSF": 55000,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 49.28
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 67.20
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 42.56
                },
                { 
                    "name": "B30 Roofing", 
                    "cost": 40.32 
                },
                { 
                    "name": "C Interiors", 
                    "cost": 20.16
                },
                { 
                    "name": "D Services", 
                    "cost": 347.20
                },
                { 
                    "name": "E Equipment and Furnishings", 
                    "cost": 39.20 
                },
                { 
                    "name": "F Special Construction", 
                    "cost": 24.13 
                },
                { 
                    "name": "G Building Sitework", 
                    "cost": 54.88
                }
            ]
        },
        {
            "id": "F",
            "name": "WSU Tri-Cities",
            "image": "img/benchmarks/wsu-tricities/wsu-tricities.jpg",
            "overall_sf_cost": 609.56,
            "grossSF": 38391,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 5.45,
                    "systemDetail": "Conventional spread footings."
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 119.36,
                    "systemDetail": "Conventional structural steel frame."
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 80.12,
                    "systemDetail": "Simple, durable, and environmentally friendly finishes hold up under high traffic and aesthetically connect to the palette of the local desert ecosystem.",
                    "image": "img/benchmarks/wsu-tricities/enclosure.jpg"
                },
                { 
                    "name": "B30 Roofing", 
                    "cost": 16.08 },
                { 
                    "name": "C Interiors", 
                    "cost": 70.65,
                    "systemDetail": "Central feature is a grand staircase with integrated seating within an open atrium; contains a suite of teaching labs for core science disciplines.",
                    "image": "img/benchmarks/wsu-tricities/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 266.53,
                    "systemDetail": "Conventional Variable Air Volume (VAV) system with full hydronics (boilers and chiller) and heat recovery.",
                    "pros": "Robust and reliable system using proven VAV technology for lab safety; heat recovery improves efficiency.",
                    "cons": "Higher energy consumption compared to radiant or chilled beam systems; requires significant space for ductwork."
                },
                { "name": "E Equipment and Furnishings", "cost": 29.44 },
                { "name": "F Special Construction", "cost": 0.07 },
                { "name": "G Building Sitework", "cost": 21.86 }
            ]
        }
    ]
};