import os
import subprocess
from PIL import Image

def setup_assets():
    logo_path = r"c:\Piyush\Projects\Habbit tracker\HabitTracker\src\assets\logo.png"
    assets_dir = r"c:\Piyush\Projects\Habbit tracker\android\assets"
    
    # Create assets folder if it doesn't exist
    if not os.path.exists(assets_dir):
        os.makedirs(assets_dir)
        print(f"Created assets directory at: {assets_dir}")
        
    if not os.path.exists(logo_path):
        print(f"Error: Desktop logo not found at {logo_path}")
        return
        
    # Open desktop logo
    logo_img = Image.open(logo_path)
    print(f"Found desktop logo: size={logo_img.size}, format={logo_img.format}")
    
    # 1. Copy logo to icon-only.png (foreground for adaptive icon)
    icon_only_path = os.path.join(assets_dir, "icon-only.png")
    logo_img.save(icon_only_path)
    print(f"Saved {icon_only_path}")
    
    # 2. Create solid brand background icon-background.png (color: #0B0F19)
    bg_color = (11, 15, 25, 255) # #0B0F19 in RGBA
    icon_bg = Image.new("RGBA", (1024, 1024), bg_color)
    icon_bg_path = os.path.join(assets_dir, "icon-background.png")
    icon_bg.save(icon_bg_path)
    print(f"Generated solid background {icon_bg_path}")
    
    # 3. Create splash.png (2732x2732 px, centered logo)
    splash_bg = Image.new("RGBA", (2732, 2732), bg_color)
    # Resize logo to 600x600 for splash centering so it is not too large
    logo_resized = logo_img.resize((600, 600), Image.Resampling.LANCZOS)
    # Center position
    offset = ((2732 - 600) // 2, (2732 - 600) // 2)
    splash_bg.paste(logo_resized, offset, logo_resized if logo_resized.mode == 'RGBA' else None)
    
    splash_path = os.path.join(assets_dir, "splash.png")
    splash_bg.save(splash_path)
    print(f"Generated splash screen {splash_path}")
    
    # Also save as splash-dark.png
    splash_dark_path = os.path.join(assets_dir, "splash-dark.png")
    splash_bg.save(splash_dark_path)
    print(f"Generated dark splash screen {splash_dark_path}")
    
    print("\nRunning @capacitor/assets generator...")
    try:
        # Run local npx capacitor-assets generate --android command
        result = subprocess.run(
            ["npx", "-y", "@capacitor/assets", "generate", "--android"],
            cwd=r"c:\Piyush\Projects\Habbit tracker\android",
            capture_output=True,
            text=True,
            shell=True
        )
        print("STDOUT:")
        print(result.stdout)
        print("STDERR:")
        print(result.stderr)
        if result.returncode == 0:
            print("Successfully generated all Android asset resources!")
        else:
            print(f"Error running generator, exit code: {result.returncode}")
    except Exception as e:
        print(f"Error launching generator command: {e}")

if __name__ == "__main__":
    setup_assets()
