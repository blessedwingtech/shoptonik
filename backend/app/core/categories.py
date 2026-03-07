# backend/app/core/categories.py
"""
Catégories standardisées pour les boutiques et produits
"""

# Catégories principales pour les boutiques
SHOP_CATEGORIES = [
    ("electronique", "Électronique & High-Tech"),
    ("mode", "Mode & Vêtements"),
    ("bijoux", "Bijoux & Accessoires"),
    ("maison", "Maison & Déco"),
    ("beaute", "Beauté & Cosmétiques"),
    ("art", "Art & Créations"),
    ("enfant", "Enfant & Bébé"),
    ("sport", "Sport & Loisirs"),
    ("alimentation", "Alimentation & Boissons"),
    ("sante", "Santé & Bien-être"),
    ("livre", "Livres & Médias"),
    ("jeu", "Jeux & Jouets"),
    ("jardin", "Jardin & Bricolage"),
    ("automobile", "Auto & Moto"),
    ("voyage", "Voyage & Loisirs"),
    ("autre", "Autre"),
]

# Catégories pour les produits (peuvent être différentes)
PRODUCT_CATEGORIES = [
    # Électronique
    ("smartphone", "Smartphones"),
    ("ordinateur", "Ordinateurs & Tablettes"),
    ("tv", "TV & Home Cinéma"),
    ("audio", "Audio & Casques"),
    ("photo", "Photo & Vidéo"),
    
    # Mode
    ("vetement-homme", "Vêtements Homme"),
    ("vetement-femme", "Vêtements Femme"),
    ("chaussures", "Chaussures"),
    ("accessoire", "Accessoires"),
    ("sportswear", "Vêtements de sport"),
    
    # Maison
    ("mobilier", "Meubles"),
    ("decoration", "Décoration"),
    ("cuisine", "Cuisine"),
    ("linge-maison", "Linge de maison"),
    
    # Numérique
    ("logiciel", "Logiciels"),
    ("ebook", "Livres numériques"),
    ("musique", "Musique numérique"),
    ("video", "Vidéos en ligne"),
    ("formation", "Formations en ligne"),
    ("template", "Modèles & Templates"),
    ("graphisme", "Design & Graphisme"),
    
    ("autre", "Autre"),
]

def get_shop_categories():
    """Retourne les catégories pour les boutiques"""
    return [{"value": value, "label": label} for value, label in SHOP_CATEGORIES]

def get_product_categories():
    """Retourne les catégories pour les produits"""
    return [{"value": value, "label": label} for value, label in PRODUCT_CATEGORIES]

def is_valid_shop_category(category: str) -> bool:
    """Vérifie si une catégorie est valide"""
    return category in [cat[0] for cat in SHOP_CATEGORIES]

def is_valid_product_category(category: str) -> bool:
    """Vérifie si une catégorie produit est valide"""
    return category in [cat[0] for cat in PRODUCT_CATEGORIES]
