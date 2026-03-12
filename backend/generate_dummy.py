import pandas as pd
import random

def generate_dummy_requirements(filename="dummy_requirements_100.xlsx"):
    data = []
    
    components = ["Motor Controller", "Battery Management", "Telemetry", "User Interface", "Safety Interlock", "Navigation", "Power Distribution", "Sensor Fusion"]
    actions = ["shall monitor", "must validate", "should report", "will calculate", "shall transmit", "must restrict", "should calibrate"]
    constraints = ["within 10ms", "under 50 degrees Celsius", "with 99.9% accuracy", "via CAN bus", "using AES-256 encryption", "below 3.3V", "every 100ms"]

    for i in range(1, 101):
        comp = random.choice(components)
        act = random.choice(actions)
        cons = random.choice(constraints)
        
        # Make the text somewhat unstructured but clearly a requirement
        desc = f"The {comp} {act} the input signal {cons}."
        
        # Add some random messiness to simulate bad Excel data
        if random.random() > 0.8:
            desc = f"Client requested: {desc} (Note to self: check if this is possible later)"
            
        priority = random.choice(["Critical", "High", "Medium", "Low"])
        
        row = {
            "Item No.": f"REQ-{i:03d}",
            "Feature Area": comp,
            "Requirement details provided by client": desc,
            "Importance level": priority,
            "Notes": "Draft" if random.random() > 0.5 else ""
        }
        data.append(row)

    df = pd.DataFrame(data)
    
    # Save to Excel
    df.to_excel(filename, index=False)
    print(f"Successfully generated {filename} with {len(df)} rows.")

if __name__ == "__main__":
    generate_dummy_requirements()
