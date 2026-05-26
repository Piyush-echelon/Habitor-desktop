import os
from PIL import Image

logo_path = r"c:\Piyush\Projects\Habbit tracker\HabitTracker\src\assets\logo.png"

try:
    img = Image.open(logo_path)
    print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
    
    # Check the 4 corners
    w, h = img.size
    corners = [
        (0, 0), (w - 1, 0),
        (0, h - 1), (w - 1, h - 1),
        (10, 10), (w - 11, 10),
        (10, h - 11), (w - 11, h - 11)
    ]
    
    img_rgba = img.convert("RGBA")
    for coord in corners:
        pixel = img_rgba.getpixel(coord)
        print(f"Pixel at {coord}: {pixel}")
except Exception as e:
    print(f"Error: {e}")
