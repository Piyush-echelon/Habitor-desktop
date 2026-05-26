import os
from PIL import Image, ImageOps, ImageFilter

logo_path = r"c:\Piyush\Projects\Habbit tracker\HabitTracker\src\assets\logo.png"
electron_icon_path = r"c:\Piyush\Projects\Habbit tracker\electron-app\assets\icon.ico"
windows_icon_path = r"c:\Piyush\Projects\Habbit tracker\HabitTracker\windows\HabitTracker\HabitTracker.ico"
package_images_dir = r"c:\Piyush\Projects\Habbit tracker\HabitTracker\windows\HabitTracker.Package\Images"

try:
    print("Reading logo...")
    img = Image.open(logo_path).convert("RGB")
    w, h = img.size
    
    # Create target RGBA image
    rgba_img = Image.new("RGBA", (w, h))
    
    # Process pixels for smooth transparency feathering
    pixels = img.load()
    rgba_pixels = rgba_img.load()
    
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            brightness = max(r, g, b)
            
            if brightness < 15:
                # Black background - fully transparent
                rgba_pixels[x, y] = (0, 0, 0, 0)
            elif brightness < 45:
                # Edge transition - calculate feathered alpha
                alpha = int((brightness - 15) / 30 * 255)
                # Blend with the orange color, preserving transparency
                rgba_pixels[x, y] = (r, g, b, alpha)
            else:
                # Solid logo - fully opaque
                rgba_pixels[x, y] = (r, g, b, 255)
                
    # Save the processed image back to logo.png as a real transparent PNG
    rgba_img.save(logo_path, "PNG")
    print(f"Saved transparent source PNG to: {logo_path}")
    
    # Setup filter
    if hasattr(Image, "Resampling"):
        resample_filter = Image.Resampling.LANCZOS
    else:
        resample_filter = Image.LANCZOS
        
    # Generate transparent ICO file for Electron app
    ico_img = rgba_img.resize((256, 256), resample_filter)
    ico_img.save(electron_icon_path, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print(f"Generated transparent Electron ICO to: {electron_icon_path}")
    
    # Generate transparent ICO for standard Windows App
    ico_img.save(windows_icon_path, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print(f"Generated transparent Windows App ICO to: {windows_icon_path}")
    
    # Also regenerate standard Package App images
    targets = {
        "LockScreenLogo.scale-200.png": (96, 96),
        "Square150x150Logo.scale-200.png": (300, 300),
        "Square44x44Logo.scale-200.png": (88, 88),
        "Square44x44Logo.targetsize-24_altform-unplated.png": (24, 24),
        "StoreLogo.png": (50, 50),
    }
    
    for filename, size in targets.items():
        out_path = os.path.join(package_images_dir, filename)
        resized = rgba_img.resize(size, resample_filter)
        resized.save(out_path, "PNG")
        print(f"Updated Package asset: {filename}")
        
except Exception as e:
    print(f"Error during transparent asset generation: {e}")
