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
    "phase1": {
        "totalProjectBudget": 20000000,
        "costOfWork": [
            { "Category": "Special Construction & Demo", "Subcategory": "Demolition", "Total": 5338387 },
            { "Category": "Special Construction & Demo", "Subcategory": "Abelson / Eastlick Enclosure", "Total": 1000000 },
            { "Category": "Sitework", "Subcategory": "Site Preparation", "Total": 0 },
            { "Category": "Sitework", "Subcategory": "Site Improvements", "Total": 0 },
            { "Category": "Sitework", "Subcategory": "Civil & Mechanical Utilities", "Total": 0 },
            { "Category": "Sitework", "Subcategory": "Site Electrical Utilities", "Total": 0 },
            { "Category": "Sitework", "Subcategory": "Site Lighting", "Total": 0 },
            { "Category": "Escalation & Contingency", "Subcategory": "Construction Contingency", "Total": 500000 },
            { "Category": "Escalation & Contingency", "Subcategory": "Escalation", "Total": 524000 },
            { "Category": "Escalation & Contingency", "Subcategory": "Escalation Phase 2", "Total": 0 },
            { "Category": "Design", "Subcategory": "Design Fees", "Total": 4300000 },
            { "Category": "Design", "Subcategory": "MEP Design", "Total": 2000000 },
            { "Category": "GCs and Insurance", "Subcategory": "Preconstruction", "Total": 600000 },
            { "Category": "GCs and Insurance", "Subcategory": "Subcontractor Default Insurance", "Total": 0 },
            { "Category": "GCs and Insurance", "Subcategory": "Hoffman Bond", "Total": 0 },
            { "Category": "GCs and Insurance", "Subcategory": "Builder's Risk Insurance", "Total": 0 },
            { "Category": "GCs and Insurance", "Subcategory": "General Requirements (SGC, OH, FEE)", "Total": 2076000 }
        ]
    },
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
    "schemes": [
        {
            "name": "Predesign",
            "description": "Northside core built right up to Eastlick. The three story massing version can connect with a ramped bridge to 3rd Level of Abelson.",
            "image": "img/schemes/predesign.jpg",
            "grossSF": 58000,
            "floors": 3,
            "shelledFloors": 2,
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
            "name": "Big Quadrants",
            "description": "Largest possible footprint, least amount of envelope.",
            "image": "img/schemes/allYouCanEat.jpg",
            "grossSF": 50000,
            "floors": 2,
            "shelledFloors": 0,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 25000 },
                { "name": "B10 Superstructure", "square_footage": 50000 },
                { "name": "B20 Enclosure", "square_footage": 30000 },
                { "name": "B30 Roofing", "square_footage": 25000 },
                { "name": "C Interiors", "square_footage": 50000 },
                { "name": "D Services", "square_footage": 50000 },
                { "name": "E Equipment and Furnishings", "square_footage": 50000 },
                { "name": "F Special Construction", "square_footage": 10000 },
                { "name": "G Building Sitework", "square_footage": 22800 }
            ]
        },
        {
            "name": "The Sciences Court",
            "description": "Creates and inviting courtyard between Abelson and Eastlick by extending a plaza north of ISB and creating a pedestrian connection to college over existing Abelson loading dock.",
            "image": "img/schemes/sciencesCourt.jpg",
            "grossSF": 50000,
            "floors": 3,
            "shelledFloors": 0,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 16000 },
                { "name": "B10 Superstructure", "square_footage": 50000 },
                { "name": "B20 Enclosure", "square_footage": 30000 },
                { "name": "B30 Roofing", "square_footage": 16000 },
                { "name": "C Interiors", "square_footage": 40000 },
                { "name": "D Services", "square_footage": 50000 },
                { "name": "E Equipment and Furnishings", "square_footage": 40000 },
                { "name": "F Special Construction", "square_footage": 10000 },
                { "name": "G Building Sitework", "square_footage": 54000 }
            ]
        },
        {
            "name": "SxSW",
            "description": "Massing is broken down by facade modulation that extends gathering areas to the south and west. Largest skin area.",
            "image": "img/schemes/sxsw.jpg",
            "grossSF": 50000,
            "floors": 3,
            "shelledFloors": 0,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 16500 },
                { "name": "B10 Superstructure", "square_footage": 50000 },
                { "name": "B20 Enclosure", "square_footage": 50000 },
                { "name": "B30 Roofing", "square_footage": 16500 },
                { "name": "C Interiors", "square_footage": 50000 },
                { "name": "D Services", "square_footage": 50000 },
                { "name": "E Equipment and Furnishings", "square_footage": 50000 },
                { "name": "F Special Construction", "square_footage": 30000 },
                { "name": "G Building Sitework", "square_footage": 42800 }
            ]
        },
        {
            "name": "Marquee",
            "description": "Connected to both Abelson and Eastlick. 4-story massing can connect to the 4th level of Abelson. N-S corridor aligns with central spine of Eastlick.",
            "image": "img/schemes/marquee.jpg",
            "grossSF": 64000,
            "floors": 4,
            "shelledFloors": 1,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 16000 },
                { "name": "B10 Superstructure", "square_footage": 64000 },
                { "name": "B20 Enclosure", "square_footage": 40000 },
                { "name": "B30 Roofing", "square_footage": 16000 },
                { "name": "C Interiors", "square_footage": 64000 },
                { "name": "D Services", "square_footage": 64000 },
                { "name": "E Equipment and Furnishings", "square_footage": 64000 },
                { "name": "F Special Construction", "square_footage": 30000 },
                { "name": "G Building Sitework", "square_footage": 35200 }
            ]
        },
        
        {
            "name": "Hillclimb",
            "description": "Consolidates gathering spaces in a volume that reaches down to the SW corner of the site.",
            "image": "img/schemes/hillclimb.jpg",
            "grossSF": 58000,
            "floors": 3,
            "shelledFloors": 0,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 20000 },
                { "name": "B10 Superstructure", "square_footage": 58000 },
                { "name": "B20 Enclosure", "square_footage": 40000 },
                { "name": "B30 Roofing", "square_footage": 20000 },
                { "name": "C Interiors", "square_footage": 58000 },
                { "name": "D Services", "square_footage": 58000 },
                { "name": "E Equipment and Furnishings", "square_footage": 58000 },
                { "name": "F Special Construction", "square_footage": 10000 },
                { "name": "G Building Sitework", "square_footage": 42495 }
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
            "overall_sf_cost": 643.43,
            "grossSF": 89800,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 11.60,
                    "systemDetail": "25-inch thick monolithic concrete foundation for vibration isolation of sensitive materials science instrumentation; includes an underground stormwater retention system."
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 68.68,
                    "systemDetail": "Exposed structural system of concrete, steel, and wood, designed to serve as a teaching tool for materials science."
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 99.10,
                    "systemDetail": "Facade of brick and metal panels with ceramic fritted glass on south-facing windows; exterior materials wrap into the interior.",
                    "image": "img/benchmarks/bsu-mat/enclosure.jpg"
                },
                { "name": "B30 Roofing", "cost": 11.39 },
                { 
                    "name": "C Interiors", 
                    "cost": 78.63,
                    "systemDetail": "Over 40 materials science labs, including core facilities for electron microscopy and surface science; features polished concrete and end-grain wood floors.",
                    "image": "img/benchmarks/bsu-mat/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 281.02,
                    "systemDetail": "High-precision Variable Air Volume (VAV) system with HEPA filtration and low-velocity laminar airflow for vibration and particulate control.",
                    "pros": "Provides exceptional environmental stability (temperature, vibration, particulates) for sensitive research; highly responsive.",
                    "cons": "High energy consumption due to tight controls and filtration; complex to design, install, and commission.",
                    "image": "img/benchmarks/bsu-mat/services.jpg"
                },
                { "name": "E Equipment and Furnishings", "cost": 54.78 },
                { "name": "F Special Construction", "cost": 4.14 },
                { 
                    "name": "G Building Sitework", 
                    "cost": 34.09,
                    "image": "img/benchmarks/bsu-mat/sitework.jpg"
                }
            ]
        },
        {
            "id": "B",
            "name": "OSU Johnson Hall",
            "image": "img/benchmarks/osu-johnson-hall/osu-johnson-hall.jpg",
            "overall_sf_cost": 778.76,
            "grossSF": 61886,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 19.42,
                    "systemDetail": "Detail needed."
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 65.66,
                    "systemDetail": "Five 52-foot, freestanding concrete shear walls. Structural steel frame with composite metal decks; features a full-story steel transfer truss to create a column-free auditorium."
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 124.22,
                    "systemDetail": "Extensive exterior glazing and interior glass walls to promote 'science on display'; cladding supported by a cold-formed steel backup system.",
                    "image": "img/benchmarks/osu-johnson-hall/enclosure.jpg"
                },
                { "name": "B30 Roofing", "cost": 16.35 },
                { 
                    "name": "C Interiors", 
                    "cost": 97.79,
                    "systemDetail": "Highly complex labs with 32 different specialty gas piping systems; features a 'Unit Ops' teaching lab and a biomedical prototyping facility.",
                    "image": "img/benchmarks/osu-johnson-hall/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 355.77,
                    "systemDetail": "Hybrid system using radiant floors/ceilings and chilled beams, with a dedicated VAV exhaust system (Phoenix) and heat recovery for lab safety.",
                    "pros": "Extremely energy-efficient due to radiant systems and heat recovery; provides superior, quiet occupant comfort.",
                    "cons": "Complex control integration between systems; radiant systems have slow thermal response times; potential condensation risk."
                },
                { 
                    "name": "E Equipment and Furnishings", 
                    "cost": 54.23,
                    "image": "img/benchmarks/osu-johnson-hall/equipment.jpg"
                },
                { "name": "F Special Construction", "cost": 2.11 },
                { 
                    "name": "G Building Sitework", 
                    "cost": 46.20,
                    "image": "img/benchmarks/osu-johnson-hall/sitework.jpg"
                }
            ]
        },
        {
            "id": "C",
            "name": "UI Integrated Research Building",
            "image": "img/benchmarks/ui-iric/ui-iric.jpg",
            "overall_sf_cost": 817.28,
            "grossSF": 78267,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 28.57,
                    "systemDetail": "Includes a 3,500 cubic foot rainwater catchment system for irrigation; specific structural foundation details are not available."
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 80.71,
                    "systemDetail": "Structural system accommodates a three-story central atrium; specific framing material and type are not available.",
                    "image": "img/benchmarks/ui-iric/superstructure.jpg"
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 118.38,
                    "systemDetail": "Perforated aluminum screen panel system over glazed curtainwall for solar shading; features a tiered, walkable green roof.",
                    "image": "img/benchmarks/ui-iric/enclosure.jpg"
                },
                { "name": "B30 Roofing", "cost": 21.72 },
                { 
                    "name": "C Interiors", 
                    "cost": 118.56,
                    "systemDetail": "Raised access flooring system with cementitious panels and modular workbenches to provide maximum lab flexibility for rotating research teams.",
                    "image": "img/benchmarks/ui-iric/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 349.49,
                    "systemDetail": "Mixed system with Variable Air Volume (VAV) controllers for labs, fan coil units for general spaces, and chilled beams for supplemental cooling.",
                    "pros": "Flexible design accommodates different research needs; uses proven VAV technology for lab safety; biomass boiler provides sustainable energy.",
                    "cons": "VAV portion has high energy use and potential for noise; multiple system types increase maintenance complexity.",
                    "image": "img/benchmarks/ui-iric/services.jpg"
                },
                { "name": "E Equipment and Furnishings", "cost": 49.78 },
                { "name": "F Special Construction", "cost": 0.35 },
                { 
                    "name": "G Building Sitework", 
                    "cost": 49.72,
                    "image": "img/benchmarks/ui-iric/sitework.jpg"
                }
            ]
        },
        {
            "id": "D",
            "name": "UO Knight Campus Phase 1",
            "image": "img/benchmarks/uo-knight/uo-knight.jpg",
            "overall_sf_cost": 922.89,
            "grossSF": 186729,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 24.14,
                    "systemDetail": "Foundation system required extensive site work, including the ecological restoration of an adjacent millrace."
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 136.08,
                    "systemDetail": "Hybrid system of concrete and mass timber (Cross-Laminated Timber, glulam, and mass plywood panels), including a vibration-controlled mass timber lab.",
                    "image": "img/benchmarks/uo-knight/superstructure.jpg"
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 140.63,
                    "systemDetail": "Signature double-skin 'Cascading Wall' facade with folded, fritted glass panels on a cantilevered outrigger system; includes a tied-arch pedestrian skybridge.",
                    "image": "img/benchmarks/uo-knight/enclosure.jpg"
                },
                { "name": "B30 Roofing", "cost": 13.32 },
                { 
                    "name": "C Interiors", 
                    "cost": 137.02,
                    "systemDetail": "Double-height research floors with floating faculty mezzanines overlooking open labs; features a basement cleanroom and a Biofabrication and Bioanalysis Core Facility.",
                    "image": "img/benchmarks/uo-knight/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 391.72,
                    "systemDetail": "Chilled beam system for cooling combined with a heat recovery chiller that repurposes waste heat for building heating and hot water.",
                    "pros": "Very energy efficient due to chilled beams and extensive heat recovery; quiet, draft-free cooling enhances occupant comfort.",
                    "cons": "Requires careful humidity control to prevent condensation; a separate air system is still needed for fume hood ventilation.",
                    "image": "img/benchmarks/uo-knight/services.jpg"
                },
                { 
                    "name": "E Equipment and Furnishings", 
                    "cost": 44.18,
                    "image": "img/benchmarks/uo-knight/equipment.jpg"
                },
                { 
                    "name": "F Special Construction", 
                    "cost": 0.00,
                    "image": "img/benchmarks/uo-knight/special.jpg"
                },
                { 
                    "name": "G Building Sitework", 
                    "cost": 35.79, 
                    "image": "img/benchmarks/uo-knight/sitework.jpg"
                }
            ]
        },
        {
            "id": "E",
            "name": "UW Molecular Engineering",
            "image": "img/benchmarks/uw-mole/uw-mole.jpg",
            "overall_sf_cost": 742.65,
            "grossSF": 90374,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 106.72,
                    "systemDetail": "Partially below-grade construction featuring a massive, isolated concrete foundation to create the largest vibration-free laboratory space on the West Coast.",
                    "image": "img/benchmarks/uw-mole/substructure.jpg"
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 28.49,
                    "systemDetail": "Long-span structural frame designed to create large, open, and reconfigurable laboratory and office areas with minimal interior columns.",
                    "image": "img/benchmarks/uw-mole/superstructure.jpg"
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 121.03,
                    "systemDetail": "High-performance, factory-assembled unitized curtainwall system with integrated sun shades, automated ventilation windows, and an adjacent stone rainscreen.",
                    "image": "img/benchmarks/uw-mole/enclosure.jpg"
                },
                { "name": "B30 Roofing", "cost": 14.37 },
                { 
                    "name": "C Interiors", 
                    "cost": 64.70,
                    "systemDetail": "Open-plan, shared labs with reconfigurable elements and 100% outside air systems; houses the Molecular Analysis Facility in the vibration-free basement.",
                    "image": "img/benchmarks/uw-mole/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 265.79,
                    "systemDetail": "Hybrid system featuring naturally ventilated offices and an optimized lab ventilation system using energy-efficient chilled beams.",
                    "pros": "Extremely energy efficient by using natural ventilation for offices; chilled beams provide quiet, comfortable lab cooling.",
                    "cons": "Natural ventilation is climate-dependent; lab system requires separate air handling for fume hoods and humidity control.",
                    "image": "img/benchmarks/uw-mole/services.jpg"
                },
                { "name": "E Equipment and Furnishings", "cost": 33.60 },
                { "name": "F Special Construction", "cost": 34.30 },
                { 
                    "name": "G Building Sitework", 
                    "cost": 73.65,
                    "image": "img/benchmarks/uw-mole/sitework.jpg"
                }
            ]
        },
        {
            "id": "F",
            "name": "WSU Tri-Cities",
            "image": "img/benchmarks/wsu-tricities/wsu-tricities.jpg",
            "overall_sf_cost": 544.25,
            "grossSF": 38391,
            "costOfWork": [
                { 
                    "name": "A Substructure", 
                    "cost": 4.87,
                    "systemDetail": "Conventional spread footings."
                },
                { 
                    "name": "B10 Superstructure", 
                    "cost": 106.57,
                    "systemDetail": "Conventional structural steel frame."
                },
                { 
                    "name": "B20 Enclosure", 
                    "cost": 71.53,
                    "systemDetail": "Simple, durable, and environmentally friendly finishes hold up under high traffic and aesthetically connect to the palette of the local desert ecosystem.",
                    "image": "img/benchmarks/wsu-tricities/enclosure.jpg"
                },
                { "name": "B30 Roofing", "cost": 14.36 },
                { 
                    "name": "C Interiors", 
                    "cost": 63.08,
                    "systemDetail": "Central feature is a grand staircase with integrated seating within an open atrium; contains a suite of teaching labs for core science disciplines.",
                    "image": "img/benchmarks/wsu-tricities/interiors.jpg"
                },
                { 
                    "name": "D Services", 
                    "cost": 237.97,
                    "systemDetail": "Conventional Variable Air Volume (VAV) system with full hydronics (boilers and chiller) and heat recovery.",
                    "pros": "Robust and reliable system using proven VAV technology for lab safety; heat recovery improves efficiency.",
                    "cons": "Higher energy consumption compared to radiant or chilled beam systems; requires significant space for ductwork."
                },
                { "name": "E Equipment and Furnishings", "cost": 26.29 },
                { "name": "F Special Construction", "cost": 0.06 },
                { "name": "G Building Sitework", "cost": 19.52 }
            ]
        }
    ]
}; 