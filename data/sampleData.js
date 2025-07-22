const sampleData = {
    "phases": {
        "phase1": {
            "totalProjectBudget": 20000000,
            "categories": [
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
            "components": [
                { "name": "A Substructure", "square_footage": 49050, "current_rom": 130.00 },
                { "name": "B10 Superstructure", "square_footage": 49050, "current_rom": 78.00 },
                { "name": "B20 Enclosure", "square_footage": 49050, "current_rom": 78.00 },
                { "name": "B30 Roofing", "square_footage": 12263, "current_rom": 39.00 },
                { 
                    "name": "C Interiors", 
                    "square_footage": 49050, 
                    "current_rom": 95.00,
                    "building_efficiency": 0.85,
                    "breakdown": [
                        { "name": "Classroom", "percentage": 0.30, "cost": 125, "sf": 12498 },
                        { "name": "Research", "percentage": 0.25, "cost": 150, "sf": 10414 },
                        { "name": "Student Space", "percentage": 0.15, "cost": 100, "sf": 6248 },
                        { "name": "Offices", "percentage": 0.10, "cost": 120, "sf": 4166 },
                        { "name": "Circulation", "percentage": 0.15, "cost": 80, "sf": 6248 },
                        { "name": "Mechanical and Support", "percentage": 0.05, "cost": 60, "sf": 2083 }
                    ]
                },
                { "name": "D Services", "square_footage": 49050, "current_rom": 220.00 },
                { "name": "E Equipment and Furnishings", "square_footage": 49050, "current_rom": 50.00 },
                { "name": "F Special Construction", "square_footage": 10000, "current_rom": 84 },
                { "name": "G Building Sitework", "square_footage": 49050, "current_rom": 41 }
            ]
        }
    },
    "schemes": [
        {
            "name": "The Monolith",
            "image": "https://placecats.com/g/400/320",
            "projectAreaSF": 50000,
            "components": [
                { "name": "A Substructure", "square_footage": 50000 },
                { "name": "B10 Superstructure", "square_footage": 50000 },
                { "name": "B20 Enclosure", "square_footage": 50000 },
                { "name": "B30 Roofing", "square_footage": 12500 },
                { "name": "C Interiors", "square_footage": 50000 },
                { "name": "D Services", "square_footage": 50000 },
                { "name": "E Equipment and Furnishings", "square_footage": 50000 },
                { "name": "F Special Construction", "square_footage": 11000 },
                { "name": "G Building Sitework", "square_footage": 50000 }
            ]
        },
        {
            "name": "The Canopy",
            "image": "https://placecats.com/g/401/300",
            "projectAreaSF": 60000,
            "components": [
                { "name": "A Substructure", "square_footage": 60000 },
                { "name": "B10 Superstructure", "square_footage": 60000 },
                { "name": "B20 Enclosure", "square_footage": 60000 },
                { "name": "B30 Roofing", "square_footage": 20000 },
                { "name": "C Interiors", "square_footage": 60000 },
                { "name": "D Services", "square_footage": 60000 },
                { "name": "E Equipment and Furnishings", "square_footage": 60000 },
                { "name": "F Special Construction", "square_footage": 15000 },
                { "name": "G Building Sitework", "square_footage": 60000 }
            ]
        },
        {
            "name": "The Courtyard",
            "image": "https://placecats.com/g/400/301",
            "projectAreaSF": 45000,
            "components": [
                { "name": "A Substructure", "square_footage": 45000 },
                { "name": "B10 Superstructure", "square_footage": 45000 },
                { "name": "B20 Enclosure", "square_footage": 45000 },
                { "name": "B30 Roofing", "square_footage": 10000 },
                { "name": "C Interiors", "square_footage": 45000 },
                { "name": "D Services", "square_footage": 45000 },
                { "name": "E Equipment and Furnishings", "square_footage": 45000 },
                { "name": "F Special Construction", "square_footage": 8000 },
                { "name": "G Building Sitework", "square_footage": 45000 }
            ]
        },
        {
            "name": "The Terraces",
            "image": "https://placecats.com/g/401/301",
            "projectAreaSF": 55000,
            "components": [
                { "name": "A Substructure", "square_footage": 55000 },
                { "name": "B10 Superstructure", "square_footage": 55000 },
                { "name": "B20 Enclosure", "square_footage": 55000 },
                { "name": "B30 Roofing", "square_footage": 15000 },
                { "name": "C Interiors", "square_footage": 55000 },
                { "name": "D Services", "square_footage": 55000 },
                { "name": "E Equipment and Furnishings", "square_footage": 55000 },
                { "name": "F Special Construction", "square_footage": 12000 },
                { "name": "G Building Sitework", "square_footage": 55000 }
            ]
        }
    ],
    "benchmarks": [
        {
            "id": "A",
            "name": "OSU Johnson Hall",
            "image": "img/osu-johnson-hall.jpg",
            "overall_sf_cost": 991.69,
            "projectAreaSF": 61886,
            "components": [
                { "name": "A Substructure", "cost": 185.34 },
                { "name": "B10 Superstructure", "cost": 100.06 },
                { "name": "B20 Enclosure", "cost": 94.81 },
                { "name": "B30 Roofing", "cost": 47.40 },
                { "name": "C Interiors", "cost": 113.85 },
                { "name": "D Services", "cost": 239.39 },
                { "name": "E Equipment and Furnishings", "cost": 51.67 },
                { "name": "F Special Construction", "cost": 103.33 },
                { "name": "G Building Sitework", "cost": 66.34 }
            ]
        },
        {
            "id": "B",
            "name": "WSU The Spark",
            "image": "img/wsu-spark.jpg",
            "overall_sf_cost": 721.17,
            "projectAreaSF": 83000,
            "components": [
                { "name": "A Substructure", "cost": 125.78 },
                { "name": "B10 Superstructure", "cost": 80 },
                { "name": "B20 Enclosure", "cost": 98 },
                { "name": "B30 Roofing", "cost": 38 },
                { "name": "C Interiors", "cost": 85.42 },
                { "name": "D Services", "cost": 205.28 },
                { "name": "E Equipment and Furnishings", "cost": 42.63 },
                { "name": "F Special Construction", "cost": 88.88 },
                { "name": "G Building Sitework", "cost": 70 }
            ]
        },
        {
            "id": "C",
            "name": "WSU Everett",
            "image": "img/wsu-everett.jpg",
            "overall_sf_cost": 964.36,
            "projectAreaSF": 96000,
            "components": [
                { "name": "A Substructure", "cost": 187.06 },
                { "name": "B10 Superstructure", "cost": 72 },
                { "name": "B20 Enclosure", "cost": 75 },
                { "name": "B30 Roofing", "cost": 48 },
                { "name": "C Interiors", "cost": 75.05 },
                { "name": "D Services", "cost": 210.28 },
                { "name": "E Equipment and Furnishings", "cost": 55.45 },
                { "name": "F Special Construction", "cost": 109.91 },
                { "name": "G Building Sitework", "cost": 39.31 }
            ]
        },
        {
            "id": "D",
            "name": "UW Nanoengineering",
            "image": "img/uw-nano.jpg",
            "overall_sf_cost": 1011.65,
            "projectAreaSF": 78374,
            "components": [
                { "name": "A Substructure", "cost": 189.09 },
                { "name": "B10 Superstructure", "cost": 102.07 },
                { "name": "B20 Enclosure", "cost": 96.71 },
                { "name": "B30 Roofing", "cost": 48.36 },
                { "name": "C Interiors", "cost": 116.14 },
                { "name": "D Services", "cost": 244.21 },
                { "name": "E Equipment and Furnishings", "cost": 52.71 },
                { "name": "F Special Construction", "cost": 105.41 },
                { "name": "G Building Sitework", "cost": 67.68 }
            ]
        },
        {
            "id": "E",
            "name": "UI Integrated Research Building",
            "image": "img/ui-iric.jpg",
            "overall_sf_cost": 908.77,
            "projectAreaSF": 78267,
            "components": [
                { "name": "A Substructure", "cost": 169.89 },
                { "name": "B10 Superstructure", "cost": 91.69 },
                { "name": "B20 Enclosure", "cost": 86.88 },
                { "name": "B30 Roofing", "cost": 43.44 },
                { "name": "C Interiors", "cost": 104.33 },
                { "name": "D Services", "cost": 219.36 },
                { "name": "E Equipment and Furnishings", "cost": 47.35 },
                { "name": "F Special Construction", "cost": 94.69 },
                { "name": "G Building Sitework", "cost": 60.80 }
            ]
        },
        {
            "id": "F",
            "name": "BSU Materials Science",
            "image": "img/bsu-mat.jpg",
            "overall_sf_cost": 735.78,
            "projectAreaSF": 89314,
            "components": [
                { "name": "A Substructure", "cost": 137.52 },
                { "name": "B10 Superstructure", "cost": 74.24 },
                { "name": "B20 Enclosure", "cost": 70.34 },
                { "name": "B30 Roofing", "cost": 35.17 },
                { "name": "C Interiors", "cost": 84.47 },
                { "name": "D Services", "cost": 177.63 },
                { "name": "E Equipment and Furnishings", "cost": 38.33 },
                { "name": "F Special Construction", "cost": 76.67 },
                { "name": "G Building Sitework", "cost": 49.22 }
            ]
        },
        {
            "id": "G",
            "name": "UO Knight Campus",
            "image": "img/uo-knight.jpg",
            "overall_sf_cost": 1377.17,
            "projectAreaSF": 166714,
            "components": [
                { "name": "A Substructure", "cost": 257.37 },
                { "name": "B10 Superstructure", "cost": 138.96 },
                { "name": "B20 Enclosure", "cost": 131.66 },
                { "name": "B30 Roofing", "cost": 65.83 },
                { "name": "C Interiors", "cost": 158.10 },
                { "name": "D Services", "cost": 332.50 },
                { "name": "E Equipment and Furnishings", "cost": 71.75 },
                { "name": "F Special Construction", "cost": 143.50 },
                { "name": "G Building Sitework", "cost": 92.13 }
            ]
        },
        {
            "id": "H",
            "name": "WSU Tri-Cities",
            "image": "img/wsu-tricities.jpg",
            "overall_sf_cost": 780.44,
            "projectAreaSF": 37031,
            "components": [
                { "name": "A Substructure", "cost": 145.88 },
                { "name": "B10 Superstructure", "cost": 78.75 },
                { "name": "B20 Enclosure", "cost": 74.61 },
                { "name": "B30 Roofing", "cost": 37.31 },
                { "name": "C Interiors", "cost": 89.60 },
                { "name": "D Services", "cost": 188.42 },
                { "name": "E Equipment and Furnishings", "cost": 40.66 },
                { "name": "F Special Construction", "cost": 81.32 },
                { "name": "G Building Sitework", "cost": 52.21 }
            ]
        }
    ]
}; 