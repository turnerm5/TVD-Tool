const sampleData = {
    "phases": {
        "phase1": {
            "totalProjectBudget": 20000000,
            "costOfWork": [
                { "Category": "Special Construction & Demo", "Subcategory": "Demolition", "Total": 5000000 },
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
            "totalProjectBudget": 40000000,
            "projectAreaSF": 49050,
            "indirectCosts": [
                { "Category": "GCs and Insurance", "Subcategory": "Precon and Fee", "Total": 2744000 },
                { "Category": "Escalation & Contingency", "Subcategory": "Contingency", "Total": 4304000 },
                { "Category": "GCs and Insurance", "Subcategory": "Bonds and Insurance", "Total": 1748000 },
                { "Category": "Permits", "Subcategory": "Building Permit", "Total": 136000 }
            ],
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 40000, "target_value": 33.50 },
                { "name": "B10 Superstructure", "square_footage": 40000, "target_value": 98 },
                { "name": "B20 Enclosure", "square_footage": 30000, "target_value": 100 },
                { "name": "B30 Roofing", "square_footage": 10000, "target_value": 15 },
                { 
                    "name": "C Interiors", 
                    "square_footage": 40000, 
                    "target_value": 115,
                    "building_efficiency": 0.575,
                    "breakdown": [
                        { "name": "Classroom", "percentage": 0.40, "cost": 125, "sf": 10000 },
                        { "name": "Research", "percentage": 0.35, "cost": 150, "sf": 6000 },
                        { "name": "Student Space", "percentage": 0.15, "cost": 100, "sf": 3000 },
                        { "name": "Offices", "percentage": 0.10, "cost": 120, "sf": 4000 }
                    ]
                },
                { "name": "D Services", "square_footage": 40000, "target_value": 265 },
                { "name": "E Equipment and Furnishings", "square_footage": 40000, "target_value": 50.00 },
                { "name": "F Special Construction", "square_footage": 10000, "target_value": 20 },
                { "name": "G Building Sitework", "square_footage": 20000, "target_value": 42 }
            ]
        }
    },
    "schemes": [
        {
            "name": "Four Story + Shell Space",
            "description": "A four story, cubical building with two stories of shell space for future expansion.",
            "image": "https://placecats.com/g/400/320",
            "projectAreaSF": 60000,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 15000 },
                { "name": "B10 Superstructure", "square_footage": 60000 },
                { "name": "B20 Enclosure", "square_footage": 50000 },
                { "name": "B30 Roofing", "square_footage": 15000 },
                { "name": "C Interiors", "square_footage": 30000 },
                { "name": "D Services", "square_footage": 60000 },
                { "name": "E Equipment and Furnishings", "square_footage": 20000 },
                { "name": "F Special Construction", "square_footage": 10000 },
                { "name": "G Building Sitework", "square_footage": 40000 }
            ]
        },
        {
            "name": "Three Story + Shell Space",
            "description": "A three story, rectangular building with a single story of shell space for future expansion.",
            "image": "https://placecats.com/g/401/300",
            "projectAreaSF": 40000,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 40000 },
                { "name": "B10 Superstructure", "square_footage": 40000 },
                { "name": "B20 Enclosure", "square_footage": 40000 },
                { "name": "B30 Roofing", "square_footage": 10000 },
                { "name": "C Interiors", "square_footage": 20000 },
                { "name": "D Services", "square_footage": 30000 },
                { "name": "E Equipment and Furnishings", "square_footage": 20000 },
                { "name": "F Special Construction", "square_footage": 15000 },
                { "name": "G Building Sitework", "square_footage": 60000 }
            ]
        },
        {
            "name": "Medium Rectangular + No Shell Space",
            "description": "A medium-sized building with no shell space. Medium amount of sitework.",
            "image": "https://placecats.com/g/400/301",
            "projectAreaSF": 45000,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 22500 },
                { "name": "B10 Superstructure", "square_footage": 45000 },
                { "name": "B20 Enclosure", "square_footage": 45000 },
                { "name": "B30 Roofing", "square_footage": 22500 },
                { "name": "C Interiors", "square_footage": 45000 },
                { "name": "D Services", "square_footage": 45000 },
                { "name": "E Equipment and Furnishings", "square_footage": 45000 },
                { "name": "F Special Construction", "square_footage": 8000 },
                { "name": "G Building Sitework", "square_footage": 45000 }
            ]
        },
        {
            "name": "Medium Cubical + No Shell Space",
            "description": "A medium-sized building with no shell space. Medium amount of sitework.",
            "image": "https://placecats.com/g/401/301",
            "projectAreaSF": 55000,
            "costOfWork": [
                { "name": "A Substructure", "square_footage": 45000 },
                { "name": "B10 Superstructure", "square_footage": 45000 },
                { "name": "B20 Enclosure", "square_footage": 45000 },
                { "name": "B30 Roofing", "square_footage": 10000 },
                { "name": "C Interiors", "square_footage": 45000 },
                { "name": "D Services", "square_footage": 45000 },
                { "name": "E Equipment and Furnishings", "square_footage": 45000 },
                { "name": "F Special Construction", "square_footage": 12000 },
                { "name": "G Building Sitework", "square_footage": 55000 }
            ]
        }
    ],
    "benchmarks": [
        {
            "id": "A",
            "name": "BSU Materials Science",
            "image": "img/bsu-mat.jpg",
            "overall_sf_cost": 643.43,
            "projectAreaSF": 89800,
            "costOfWork": [
                { "name": "A Substructure", "cost": 11.60 },
                { "name": "B10 Superstructure", "cost": 68.68 },
                { "name": "B20 Enclosure", "cost": 99.10 },
                { "name": "B30 Roofing", "cost": 11.39 },
                { "name": "C Interiors", "cost": 78.63 },
                { "name": "D Services", "cost": 281.02 },
                { "name": "E Equipment and Furnishings", "cost": 54.78 },
                { "name": "F Special Construction", "cost": 4.14 },
                { "name": "G Building Sitework", "cost": 34.09 }
            ]
        },
        {
            "id": "B",
            "name": "OSU Johnson Hall",
            "image": "img/osu-johnson-hall.jpg",
            "overall_sf_cost": 778.76,
            "projectAreaSF": 61886,
            "costOfWork": [
                { "name": "A Substructure", "cost": 19.42 },
                { "name": "B10 Superstructure", "cost": 65.66 },
                { "name": "B20 Enclosure", "cost": 121.22 },
                { "name": "B30 Roofing", "cost": 16.35 },
                { "name": "C Interiors", "cost": 97.79 },
                { "name": "D Services", "cost": 355.77 },
                { "name": "E Equipment and Furnishings", "cost": 54.23 },
                { "name": "F Special Construction", "cost": 2.11 },
                { "name": "G Building Sitework", "cost": 46.20 }
            ]
        },
        {
            "id": "C",
            "name": "UI Integrated Research Building",
            "image": "img/ui-iric.jpg",
            "overall_sf_cost": 817.28,
            "projectAreaSF": 78267,
            "costOfWork": [
                { "name": "A Substructure", "cost": 28.57 },
                { "name": "B10 Superstructure", "cost": 80.71 },
                { "name": "B20 Enclosure", "cost": 118.38 },
                { "name": "B30 Roofing", "cost": 21.72 },
                { "name": "C Interiors", "cost": 118.56 },
                { "name": "D Services", "cost": 349.49 },
                { "name": "E Equipment and Furnishings", "cost": 49.78 },
                { "name": "F Special Construction", "cost": 0.35 },
                { "name": "G Building Sitework", "cost": 49.72 }
            ]
        },
        {
            "id": "D",
            "name": "UO Knight Campus Phase 2",
            "image": "img/uo-knight-2.jpg",
            "overall_sf_cost": 922.89,
            "projectAreaSF": 186729,
            "costOfWork": [
                { "name": "A Substructure", "cost": 24.14 },
                { "name": "B10 Superstructure", "cost": 136.08 },
                { "name": "B20 Enclosure", "cost": 140.63 },
                { "name": "B30 Roofing", "cost": 13.32 },
                { "name": "C Interiors", "cost": 137.02 },
                { "name": "D Services", "cost": 391.72 },
                { "name": "E Equipment and Furnishings", "cost": 44.18 },
                { "name": "F Special Construction", "cost": 0.00 },
                { "name": "G Building Sitework", "cost": 35.79 }
            ]
        },
        {
            "id": "E",
            "name": "UW Molecular Engineering",
            "image": "img/uw-mole.jpg",
            "overall_sf_cost": 742.65,
            "projectAreaSF": 90374,
            "costOfWork": [
                { "name": "A Substructure", "cost": 106.72 },
                { "name": "B10 Superstructure", "cost": 28.49 },
                { "name": "B20 Enclosure", "cost": 121.03 },
                { "name": "B30 Roofing", "cost": 14.37 },
                { "name": "C Interiors", "cost": 64.70 },
                { "name": "D Services", "cost": 265.79 },
                { "name": "E Equipment and Furnishings", "cost": 33.60 },
                { "name": "F Special Construction", "cost": 34.30 },
                { "name": "G Building Sitework", "cost": 73.65 }
            ]
        },
        {
            "id": "F",
            "name": "WSU Tri-Cities",
            "image": "img/wsu-tricities.jpg",
            "overall_sf_cost": 544.25,
            "projectAreaSF": 38391,
            "costOfWork": [
                { "name": "A Substructure", "cost": 4.87 },
                { "name": "B10 Superstructure", "cost": 106.57 },
                { "name": "B20 Enclosure", "cost": 71.53 },
                { "name": "B30 Roofing", "cost": 14.36 },
                { "name": "C Interiors", "cost": 63.08 },
                { "name": "D Services", "cost": 237.97 },
                { "name": "E Equipment and Furnishings", "cost": 26.29 },
                { "name": "F Special Construction", "cost": 0.06 },
                { "name": "G Building Sitework", "cost": 19.52 }
            ]
        }
    ]
}; 