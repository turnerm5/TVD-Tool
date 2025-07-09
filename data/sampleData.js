const sampleData = {
    "phases": {
        "phase1": {
            "totalProjectBudget": 20000000,
            "projectAreaSF": 30000,
            "components": [
                { "name": "General Conditions", "square_footage": 30000, "current_rom": 140 },
                { "name": "Demo", "square_footage": 15000, "current_rom": 125 },
                { "name": "Site", "square_footage": 30000, "current_rom": 240 },
                { "name": "Utilities", "square_footage": 30000, "current_rom": 180 },
                { "name": "Weatherproofing", "square_footage": 12000, "current_rom": 100 }
            ]
        },
        "phase2": {
            "totalProjectBudget": 40000000,
            "projectAreaSF": 60000,
            "components": [
                { "name": "General Conditions", "square_footage": 60000, "current_rom": 70 },
                { "name": "Structure", "square_footage": 60000, "current_rom": 115 },
                { "name": "Envelope", "square_footage": 45000, "current_rom": 145 },
                { "name": "Labs", "square_footage": 25000, "current_rom": 180 },
                { "name": "Vertical Circulation", "square_footage": 5000, "current_rom": 70 },
                { "name": "Plumbing", "square_footage": 60000, "current_rom": 50 },
                { "name": "Electrical", "square_footage": 60000, "current_rom": 85 },
                { "name": "HVAC", "square_footage": 60000, "current_rom": 100 },
                { "name": "Fire Protection", "square_footage": 60000, "current_rom": 55 }
            ]
        }
    },
    "benchmarks": [
        {
            "id": "A",
            "name": "OSU Huang Collaborative Innovation Complex",
            "overall_sf_cost": 850.50,
            "square_footage": 152000,
            "components": [
                { "name": "Substructure", "cost": 65.75 },
                { "name": "Shell", "cost": 180.25 },
                { "name": "General Conditions", "cost": 95 },
                { "name": "Demo", "cost": 110 },
                { "name": "Site", "cost": 220 },
                { "name": "Utilities", "cost": 160 },
                { "name": "Weatherproofing", "cost": 90 },
                { "name": "Structure", "cost": 105 },
                { "name": "Envelope", "cost": 130 },
                { "name": "Labs", "cost": 170 },
                { "name": "Vertical Circulation", "cost": 65 },
                { "name": "Plumbing", "cost": 45 },
                { "name": "Electrical", "cost": 75 },
                { "name": "HVAC", "cost": 90 },
                { "name": "Fire Protection", "cost": 50 }
            ]
        },
        {
            "id": "B",
            "name": "WSU The Spark",
            "overall_sf_cost": 910.00,
            "square_footage": 83500,
            "components": [
                { "name": "Substructure", "cost": 72.50 },
                { "name": "Shell", "cost": 195.80 },
                { "name": "General Conditions", "cost": 110 },
                { "name": "Demo", "cost": 130 },
                { "name": "Site", "cost": 250 },
                { "name": "Utilities", "cost": 185 },
                { "name": "Weatherproofing", "cost": 110 },
                { "name": "Structure", "cost": 120 },
                { "name": "Envelope", "cost": 150 },
                { "name": "Labs", "cost": 185 },
                { "name": "Vertical Circulation", "cost": 75 },
                { "name": "Plumbing", "cost": 55 },
                { "name": "Electrical", "cost": 90 },
                { "name": "HVAC", "cost": 105 },
                { "name": "Fire Protection", "cost": 60 }
            ]
        },
        {
            "id": "C",
            "name": "WSU Everett",
            "overall_sf_cost": 880.75,
            "square_footage": 96000,
            "components": [
                { "name": "Substructure", "cost": 68.00 },
                { "name": "Shell", "cost": 188.50 },
                { "name": "General Conditions", "cost": 85 },
                { "name": "Demo", "cost": 115 },
                { "name": "Site", "cost": 210 },
                { "name": "Utilities", "cost": 150 },
                { "name": "Weatherproofing", "cost": 85 },
                { "name": "Structure", "cost": 100 },
                { "name": "Envelope", "cost": 125 },
                { "name": "Labs", "cost": 160 },
                { "name": "Vertical Circulation", "cost": 60 },
                { "name": "Plumbing", "cost": 40 },
                { "name": "Electrical", "cost": 80 },
                { "name": "HVAC", "cost": 85 },
                { "name": "Fire Protection", "cost": 48 }
            ]
        },
        {
            "id": "D",
            "name": "WSU Tri-Cities Collaboration Hall",
            "overall_sf_cost": 825.00,
            "square_footage": 58000,
            "components": [
                { "name": "Substructure", "cost": 62.20 },
                { "name": "Shell", "cost": 175.40 },
                { "name": "General Conditions", "cost": 140 },
                { "name": "Demo", "cost": 140 },
                { "name": "Site", "cost": 260 },
                { "name": "Utilities", "cost": 190 },
                { "name": "Weatherproofing", "cost": 115 },
                { "name": "Structure", "cost": 125 },
                { "name": "Envelope", "cost": 155 },
                { "name": "Labs", "cost": 190 },
                { "name": "Vertical Circulation", "cost": 80 },
                { "name": "Plumbing", "cost": 60 },
                { "name": "Electrical", "cost": 95 },
                { "name": "HVAC", "cost": 110 },
                { "name": "Fire Protection", "cost": 65 }
            ]
        }
    ]
}; 