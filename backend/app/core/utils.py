import re
import random
import string
from typing import Optional

def generate_slug(text: str) -> str:
    """Generate URL-friendly slug from text"""
    # Convert to lowercase
    text = text.lower()
    # Remove special characters, keep letters, numbers, spaces and hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    # Replace spaces with hyphens
    text = re.sub(r'[-\s]+', '-', text)
    # Remove leading/trailing hyphens
    return text.strip('-')

def generate_random_string(length: int = 8) -> str:
    """Generate random string for slugs, codes, etc."""
    letters_and_digits = string.ascii_lowercase + string.digits
    return ''.join(random.choice(letters_and_digits) for _ in range(length))

def format_currency(amount: int, currency: str = "EUR") -> str:
    """Format amount in cents to currency string"""
    if currency == "EUR":
        return f"€{amount / 100:.2f}"
    elif currency == "USD":
        return f"${amount / 100:.2f}"
    return f"{amount / 100:.2f} {currency}"
