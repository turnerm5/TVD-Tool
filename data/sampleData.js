const sampleData = {
    "phases": {
        "phase1": {
            "totalProjectBudget": 20000000,
            "categories": [
                { "Category": "Special Construction", "Subcategory": "Demolition", "Total": 5000000 },
                { "Category": "Sitework", "Subcategory": "Site Preparation", "Total": 0 },
                { "Category": "Sitework", "Subcategory": "Site Improvements", "Total": 0 },
                { "Category": "Sitework", "Subcategory": "Civil & Mechanical Utilities", "Total": 0 },
                { "Category": "Sitework", "Subcategory": "Site Electrical Utilities", "Total": 0 },
                { "Category": "Sitework", "Subcategory": "Site Lighting", "Total": 0 },
                { "Category": "Mark-Ups", "Subcategory": "Construction Contingency", "Total": 500000 },
                { "Category": "Mark-Ups", "Subcategory": "Escalation", "Total": 524000 },
                { "Category": "Mark-Ups", "Subcategory": "Escalation Phase 2", "Total": 0 },
                { "Category": "Mark-Ups", "Subcategory": "Design Fees", "Total": 4300000 },
                { "Category": "Mark-Ups", "Subcategory": "MEP Design", "Total": 2000000 },
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
                { "name": "C Interiors", "square_footage": 49050, "current_rom": 95.00 },
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
            "image": "https://placecats.com/g/400/300",
            "components": [
                { "name": "A Substructure", "square_footage": 50000, "current_rom": 130.00 },
                { "name": "B10 Superstructure", "square_footage": 50000, "current_rom": 78.00 },
                { "name": "B20 Enclosure", "square_footage": 50000, "current_rom": 78.00 },
                { "name": "B30 Roofing", "square_footage": 12500, "current_rom": 39.00 },
                { "name": "C Interiors", "square_footage": 50000, "current_rom": 95.00 },
                { "name": "D Services", "square_footage": 50000, "current_rom": 220.00 },
                { "name": "E Equipment and Furnishings", "square_footage": 50000, "current_rom": 50.00 },
                { "name": "F Special Construction", "square_footage": 11000, "current_rom": 84.00 },
                { "name": "G Building Sitework", "square_footage": 50000, "current_rom": 41.00 }
            ]
        },
        {
            "name": "The Canopy",
            "image": "https://placecats.com/g/400/300",
            "components": [
                { "name": "A Substructure", "square_footage": 60000, "current_rom": 130.00 },
                { "name": "B10 Superstructure", "square_footage": 60000, "current_rom": 78.00 },
                { "name": "B20 Enclosure", "square_footage": 60000, "current_rom": 78.00 },
                { "name": "B30 Roofing", "square_footage": 20000, "current_rom": 39.00 },
                { "name": "C Interiors", "square_footage": 60000, "current_rom": 95.00 },
                { "name": "D Services", "square_footage": 60000, "current_rom": 220.00 },
                { "name": "E Equipment and Furnishings", "square_footage": 60000, "current_rom": 50.00 },
                { "name": "F Special Construction", "square_footage": 15000, "current_rom": 84.00 },
                { "name": "G Building Sitework", "square_footage": 60000, "current_rom": 41.00 }
            ]
        },
        {
            "name": "The Courtyard",
            "image": "https://placecats.com/g/400/300",
            "components": [
                { "name": "A Substructure", "square_footage": 45000, "current_rom": 130.00 },
                { "name": "B10 Superstructure", "square_footage": 45000, "current_rom": 78.00 },
                { "name": "B20 Enclosure", "square_footage": 45000, "current_rom": 78.00 },
                { "name": "B30 Roofing", "square_footage": 10000, "current_rom": 39.00 },
                { "name": "C Interiors", "square_footage": 45000, "current_rom": 95.00 },
                { "name": "D Services", "square_footage": 45000, "current_rom": 220.00 },
                { "name": "E Equipment and Furnishings", "square_footage": 45000, "current_rom": 50.00 },
                { "name": "F Special Construction", "square_footage": 8000, "current_rom": 84.00 },
                { "name": "G Building Sitework", "square_footage": 45000, "current_rom": 41.00 }
            ]
        },
        {
            "name": "The Terraces",
            "image": "https://placecats.com/g/400/300",
            "components": [
                { "name": "A Substructure", "square_footage": 55000, "current_rom": 130.00 },
                { "name": "B10 Superstructure", "square_footage": 55000, "current_rom": 78.00 },
                { "name": "B20 Enclosure", "square_footage": 55000, "current_rom": 78.00 },
                { "name": "B30 Roofing", "square_footage": 15000, "current_rom": 39.00 },
                { "name": "C Interiors", "square_footage": 55000, "current_rom": 95.00 },
                { "name": "D Services", "square_footage": 55000, "current_rom": 220.00 },
                { "name": "E Equipment and Furnishings", "square_footage": 55000, "current_rom": 50.00 },
                { "name": "F Special Construction", "square_footage": 12000, "current_rom": 84.00 },
                { "name": "G Building Sitework", "square_footage": 55000, "current_rom": 41.00 }
            ]
        }
    ],
    "benchmarks": [
        {
            "id": "A",
            "name": "OSU Johnson Hall",
            "image": "img/osu-johnson-hall.jpg",
            "overall_sf_cost": 939.20,
            "square_footage": 65000,
            "components": [
                { "name": "A Substructure", "cost": 176.06 },
                { "name": "B10 Superstructure", "cost": 95 },
                { "name": "B20 Enclosure", "cost": 90 },
                { "name": "B30 Roofing", "cost": 45 },
                { "name": "C Interiors", "cost": 108.12 },
                { "name": "D Services", "cost": 227.34 },
                { "name": "E Equipment and Furnishings", "cost": 49.06 },
                { "name": "F Special Construction", "cost": 98.11 },
                { "name": "G Building Sitework", "cost": 63 }
            ]
        },
        {
            "id": "B",
            "name": "WSU The Spark",
            "image": "img/wsu-spark.jpg",
            "overall_sf_cost": 721.17,
            "square_footage": 83000,
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
            "square_footage": 96000,
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
            "name": "WSU Tri-Cities Collaboration Hall",
            "image": "img/wsu-tricities.jpg",
            "overall_sf_cost": 746.33,
            "square_footage": 37300,
            "components": [
                { "name": "A Substructure", "cost": 139.63 },
                { "name": "B10 Superstructure", "cost": 78 },
                { "name": "B20 Enclosure", "cost": 70 },
                { "name": "B30 Roofing", "cost": 35 },
                { "name": "C Interiors", "cost": 87.06 },
                { "name": "D Services", "cost": 205.45 },
                { "name": "E Equipment and Furnishings", "cost": 85.21 },
                { "name": "F Special Construction", "cost": 80.67 },
                { "name": "G Building Sitework", "cost": 50 }
            ]
        }
    ]
}; 