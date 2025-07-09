const sampleData = {
    "phases": {
        "phase1": {
            "totalProjectBudget": 20000000,
            "projectAreaSF": 30000,
            "components": [
                { "name": "General Conditions", "target_value": 30, "current_rom": 29 },
                { "name": "Demo", "target_value": 25, "current_rom": 26 },
                { "name": "Site", "target_value": 55, "current_rom": 52 },
                { "name": "Utilities", "target_value": 40, "current_rom": 38 },
                { "name": "Weatherproofing", "target_value": 25, "current_rom": 22 }
            ]
        },
        "phase2": {
            "totalProjectBudget": 40000000,
            "projectAreaSF": 60000,
            "components": [
                { "name": "General Conditions", "target_value": 35, "current_rom": 33 },
                { "name": "Structure", "target_value": 65, "current_rom": 57 },
                { "name": "Envelope", "target_value": 70, "current_rom": 71 },
                { "name": "Labs", "target_value": 88, "current_rom": 87 },
                { "name": "Vertical Circulation", "target_value": 33, "current_rom": 34 },
                { "name": "Plumbing", "target_value": 26, "current_rom": 25 },
                { "name": "Electrical", "target_value": 48, "current_rom": 42 },
                { "name": "HVAC", "target_value": 50, "current_rom": 48 },
                { "name": "Fire Protection", "target_value": 28, "current_rom": 27 }
            ]
        }
    },
    "benchmarks": [
        {
            "id": "A",
            "name": "OSU Huang Collaborative Innovation Complex",
            "overall_sf_cost": 450,
            "components": [
                { "name": "General Conditions", "cost": 22 },
                { "name": "Demo", "cost": 28 },
                { "name": "Site", "cost": 42 },
                { "name": "Utilities", "cost": 30 },
                { "name": "Weatherproofing", "cost": 18 },
                { "name": "Structure", "cost": 55 },
                { "name": "Envelope", "cost": 60 },
                { "name": "Labs", "cost": 88 },
                { "name": "Vertical Circulation", "cost": 33 },
                { "name": "Plumbing", "cost": 22 },
                { "name": "Electrical", "cost": 45 },
                { "name": "HVAC", "cost": 42 },
                { "name": "Fire Protection", "cost": 25 }
            ]
        },
        {
            "id": "B",
            "name": "WSU The Spark",
            "overall_sf_cost": 680,
            "components": [
                { "name": "General Conditions", "cost": 35 },
                { "name": "Demo", "cost": 22 },
                { "name": "Site", "cost": 60 },
                { "name": "Utilities", "cost": 45 },
                { "name": "Weatherproofing", "cost": 28 },
                { "name": "Structure", "cost": 95 },
                { "name": "Envelope", "cost": 80 },
                { "name": "Labs", "cost": 115 },
                { "name": "Vertical Circulation", "cost": 45 },
                { "name": "Plumbing", "cost": 40 },
                { "name": "Electrical", "cost": 58 },
                { "name": "HVAC", "cost": 75 },
                { "name": "Fire Protection", "cost": 40 }
            ]
        },
        {
            "id": "C",
            "name": "WSU Everett",
            "overall_sf_cost": 455,
            "components": [
                { "name": "General Conditions", "cost": 20 },
                { "name": "Demo", "cost": 25 },
                { "name": "Site", "cost": 50 },
                { "name": "Utilities", "cost": 38 },
                { "name": "Weatherproofing", "cost": 15 },
                { "name": "Structure", "cost": 50 },
                { "name": "Envelope", "cost": 65 },
                { "name": "Labs", "cost": 78 },
                { "name": "Vertical Circulation", "cost": 29 },
                { "name": "Plumbing", "cost": 26 },
                { "name": "Electrical", "cost": 40 },
                { "name": "HVAC", "cost": 38 },
                { "name": "Fire Protection", "cost": 22 }
            ]
        },
        {
            "id": "D",
            "name": "WSU Tri-Cities Collaboration Hall",
            "overall_sf_cost": 710,
            "components": [
                { "name": "General Conditions", "cost": 30 },
                { "name": "Demo", "cost": 26 },
                { "name": "Site", "cost": 62 },
                { "name": "Utilities", "cost": 50 },
                { "name": "Weatherproofing", "cost": 30 },
                { "name": "Structure", "cost": 100 },
                { "name": "Envelope", "cost": 84 },
                { "name": "Labs", "cost": 120 },
                { "name": "Vertical Circulation", "cost": 47 },
                { "name": "Plumbing", "cost": 42 },
                { "name": "Electrical", "cost": 60 },
                { "name": "HVAC", "cost": 78 },
                { "name": "Fire Protection", "cost": 42 }
            ]
        }
    ]
}; 