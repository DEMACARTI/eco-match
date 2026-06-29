# TACO Dataset Classes - 60 waste categories for comprehensive garbage detection
# Based on the TACO (Trash Annotations in Context) dataset

TACO_CLASSES = [
    # Plastic containers and bottles
    "Bottle",
    "Bottle cap",
    "Plastic bottle",
    "Plastic container",
    "Plastic cup",
    "Plastic lid",
    "Plastic utensils",
    "Disposable plastic cup",
    "Styrofoam piece",
    "Plastic film",
    "Plastic bag",
    "Plastic wrapper",
    "Plastic straw",
    "Plastic spoon",
    "Plastic fork",
    "Plastic knife",
    
    # Paper and cardboard
    "Paper",
    "Cardboard",
    "Paper bag",
    "Paper cup",
    "Toilet paper",
    "Magazine",
    "Newspaper",
    "Book",
    "Paper plate",
    "Napkin",
    "Tissue",
    
    # Metal items
    "Aluminium foil",
    "Aluminium blister pack",
    "Canned food",
    "Drink can",
    "Food can",
    "Aerosol",
    "Metal bottle cap",
    "Metal lid",
    "Scrap metal",
    
    # Glass items
    "Glass bottle",
    "Broken glass",
    "Glass cup",
    "Glass jar",
    
    # Food waste
    "Food waste",
    "Fruit",
    "Banana peel",
    "Orange peel",
    "Apple",
    "Vegetable",
    
    # Cigarettes and smoking waste
    "Cigarette",
    "Cigarette butt",
    "Tobacco pouch plastic",
    
    # Electronics and batteries
    "Battery",
    "Electronic waste",
    "Wire",
    "Cable",
    
    # Textile and clothing
    "Clothing",
    "Shoe",
    "Rope",
    "String",
    
    # Other waste
    "Other litter",
    "Foam cup",
    "Foam food container",
    "Foam tray",
    "Polylactic acid cup",
    "Six pack rings",
    "Pop tab",
    "Squeezable tube"
]

# Waste category mapping for recycling classification
WASTE_CATEGORIES = {
    "Plastic": [
        "Bottle", "Bottle cap", "Plastic bottle", "Plastic container", "Plastic cup",
        "Plastic lid", "Plastic utensils", "Disposable plastic cup", "Styrofoam piece",
        "Plastic film", "Plastic bag", "Plastic wrapper", "Plastic straw",
        "Plastic spoon", "Plastic fork", "Plastic knife", "Six pack rings", "Pop tab"
    ],
    "Paper": [
        "Paper", "Cardboard", "Paper bag", "Paper cup", "Toilet paper",
        "Magazine", "Newspaper", "Book", "Paper plate", "Napkin", "Tissue"
    ],
    "Metal": [
        "Aluminium foil", "Aluminium blister pack", "Canned food", "Drink can",
        "Food can", "Aerosol", "Metal bottle cap", "Metal lid", "Scrap metal"
    ],
    "Glass": [
        "Glass bottle", "Broken glass", "Glass cup", "Glass jar"
    ],
    "Organic": [
        "Food waste", "Fruit", "Banana peel", "Orange peel", "Apple", "Vegetable"
    ],
    "Hazardous": [
        "Cigarette", "Cigarette butt", "Tobacco pouch plastic", "Battery", "Electronic waste"
    ],
    "Non-recyclable": [
        "Other litter", "Foam cup", "Foam food container", "Foam tray",
        "Clothing", "Shoe", "Rope", "String", "Wire", "Cable",
        "Polylactic acid cup", "Squeezable tube"
    ]
}

# Color mapping for visualization
CATEGORY_COLORS = {
    "Plastic": (255, 0, 0),      # Red
    "Paper": (0, 255, 0),        # Green
    "Metal": (0, 0, 255),        # Blue
    "Glass": (255, 255, 0),      # Yellow
    "Organic": (255, 165, 0),    # Orange
    "Hazardous": (128, 0, 128),  # Purple
    "Non-recyclable": (128, 128, 128)  # Gray
}

def get_waste_category(class_name):
    """Get the waste category for a given class name"""
    for category, classes in WASTE_CATEGORIES.items():
        if class_name in classes:
            return category
    return "Unknown"

def get_category_color(class_name):
    """Get the color for visualization based on waste category"""
    category = get_waste_category(class_name)
    return CATEGORY_COLORS.get(category, (255, 255, 255))

def get_recycling_info(class_name):
    """Get recycling information for a detected object"""
    category = get_waste_category(class_name)
    
    recycling_info = {
        "Plastic": {
            "recyclable": True,
            "bin": "Recycling Bin",
            "note": "Clean before recycling. Remove caps and labels if possible."
        },
        "Paper": {
            "recyclable": True,
            "bin": "Paper Recycling Bin",
            "note": "Keep dry and clean. Remove any plastic components."
        },
        "Metal": {
            "recyclable": True,
            "bin": "Metal Recycling Bin",
            "note": "Rinse clean. Aluminum cans are highly recyclable."
        },
        "Glass": {
            "recyclable": True,
            "bin": "Glass Recycling Bin",
            "note": "Remove caps and lids. Rinse clean."
        },
        "Organic": {
            "recyclable": False,
            "bin": "Compost Bin",
            "note": "Compostable organic waste. Great for soil enrichment."
        },
        "Hazardous": {
            "recyclable": False,
            "bin": "Hazardous Waste Collection",
            "note": "Requires special disposal. Do not put in regular trash."
        },
        "Non-recyclable": {
            "recyclable": False,
            "bin": "General Waste Bin",
            "note": "Cannot be recycled with current technology."
        }
    }
    
    return recycling_info.get(category, {
        "recyclable": False,
        "bin": "General Waste Bin",
        "note": "Unknown recyclability. Check local guidelines."
    })
