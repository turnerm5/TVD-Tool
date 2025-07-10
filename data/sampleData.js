const sampleData = {
    "phases": {
        "phase1": {
            "totalProjectBudget": 12000000,
            "projectAreaSF": 22500,
            "components": [
                { "name": "A Substructure", "square_footage": 22500, "current_rom": 140.00 },
                { "name": "B Shell", "square_footage": 22500, "current_rom": 0 },
                { "name": "C Interiors", "square_footage": 22500, "current_rom": 0 },
                { "name": "D Services", "square_footage": 22500, "current_rom": 0 },
                { "name": "E Equipment and Furnishings", "square_footage": 22500, "current_rom": 0 },
                { "name": "F Special Construction", "square_footage": 40000, "current_rom": 102 },
                { "name": "G Building Sitework", "square_footage": 40000, "current_rom": 105.00 }
            ]
        },
        "phase2": {
            "totalProjectBudget": 38000000,
            "projectAreaSF": 49050,
            "components": [
                { "name": "A Substructure", "square_footage": 49050, "current_rom": 130.00 },
                { "name": "B Shell", "square_footage": 49050, "current_rom": 195.00 },
                { "name": "C Interiors", "square_footage": 49050, "current_rom": 95.00 },
                { "name": "D Services", "square_footage": 49050, "current_rom": 220.00 },
                { "name": "E Equipment and Furnishings", "square_footage": 49050, "current_rom": 50.00 },
                { "name": "F Special Construction", "square_footage": 10000, "current_rom": 84 },
                { "name": "G Building Sitework", "square_footage": 49050, "current_rom": 41 }
            ]
        }
    },
    "benchmarks": [
        {
            "id": "A",
            "name": "WSU Schweitzer Engineering Hall",
            "overall_sf_cost": 939.20,
            "square_footage": 65000,
            "components": [
                { "name": "A Substructure", "cost": 176.06 },
                { "name": "B Shell", "cost": 200 },
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
            "overall_sf_cost": 721.17,
            "square_footage": 83000,
            "components": [
                { "name": "A Substructure", "cost": 125.78 },
                { "name": "B Shell", "cost": 205 },
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
            "overall_sf_cost": 964.36,
            "square_footage": 96000,
            "components": [
                { "name": "A Substructure", "cost": 187.06 },
                { "name": "B Shell", "cost": 210.24 },
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
            "overall_sf_cost": 746.33,
            "square_footage": 37300,
            "components": [
                { "name": "A Substructure", "cost": 139.63 },
                { "name": "B Shell", "cost": 190 },
                { "name": "C Interiors", "cost": 87.06 },
                { "name": "D Services", "cost": 205.45 },
                { "name": "E Equipment and Furnishings", "cost": 85.21 },
                { "name": "F Special Construction", "cost": 80.67 },
                { "name": "G Building Sitework", "cost": 50 }
            ]
        }
    ]
}; 