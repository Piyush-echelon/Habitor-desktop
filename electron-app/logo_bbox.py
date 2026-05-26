from PIL import Image

logo_path = r"c:\Piyush\Projects\Habbit tracker\HabitTracker\src\assets\logo.png"

try:
    img = Image.open(logo_path).convert("RGB")
    w, h = img.size
    
    # Find bounding box of non-black pixels
    left, top, right, bottom = w, h, 0, 0
    
    for y in range(h):
        for x in range(w):
            r, g, b = img.getpixel((x, y))
            # If the pixel is not black (threshold of 15)
            if r > 15 or g > 15 or b > 15:
                if x < left: left = x
                if x > right: right = x
                if y < top: top = y
                if y > bottom: bottom = y
                
    print(f"Bounding Box: Left={left}, Top={top}, Right={right}, Bottom={bottom}")
    print(f"Width={right - left + 1}, Height={bottom - top + 1}")
    
except Exception as e:
    print(f"Error: {e}")
