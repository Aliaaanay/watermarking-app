from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont, ImageColor
import io
import base64
import math

def create_app():
    app = Flask(__name__)
    CORS(app)

    @app.route('/', methods=['GET'])
    def home():
        return jsonify({"message": "Backend Ultimate Watermark Ready!", "status": 200})

    @app.route('/process-image', methods=['POST'])
    def process_image():
        try:
            # --- 1. VALIDASI INPUT ---
            if 'file' not in request.files:
                return jsonify({'error': 'No main file uploaded'}), 400
            
            file = request.files['file']
            
            # Ambil Parameter
            mode = request.form.get('mode', 'text') # 'text' atau 'logo'
            position = request.form.get('position', 'center')
            is_tiled = request.form.get('tiled', 'false') == 'true'
            opacity = int(request.form.get('opacity', 128))
            size_scale = int(request.form.get('size', 20)) # Persentase ukuran
            rotation = int(request.form.get('rotation', 0))
            
            # Buka Gambar Utama
            base_img = Image.open(file.stream).convert("RGBA")
            width, height = base_img.size
            
            # Layer kosong untuk watermark
            overlay = Image.new("RGBA", base_img.size, (255, 255, 255, 0))

            # --- 2. LOGIKA MODE TEXT ---
            if mode == 'text':
                text = request.form.get('text', 'CONFIDENTIAL')
                hex_color = request.form.get('color', '#E50914')
                try:
                    rgb = ImageColor.getrgb(hex_color)
                except:
                    rgb = (255, 0, 0)
                
                final_color = (rgb[0], rgb[1], rgb[2], opacity)
                
                # Setup Font
                font_size = int(width / (50 - size_scale)) # Dinamis
                try:
                    font = ImageFont.truetype("arialbd.ttf", font_size)
                except:
                    font = ImageFont.load_default()

                # Buat Draw Object
                if is_tiled:
                    # --- MODE TILED (BERULANG) ---
                    # Buat canvas diagonal raksasa
                    diagonal = int(math.sqrt(width**2 + height**2))
                    tiled_layer = Image.new("RGBA", (diagonal * 2, diagonal * 2), (255,255,255,0))
                    tiled_draw = ImageDraw.Draw(tiled_layer)
                    
                    bbox = tiled_draw.textbbox((0, 0), text, font=font)
                    w_text, h_text = bbox[2] - bbox[0], bbox[3] - bbox[1]
                    
                    gap_x, gap_y = w_text + 100, h_text + 100
                    
                    # Looping gambar teks
                    for y in range(0, diagonal * 2, gap_y):
                        for x in range(0, diagonal * 2, gap_x):
                            tiled_draw.text((x, y), text, font=font, fill=final_color)
                    
                    # Rotasi dan Crop Tengah
                    rotated = tiled_layer.rotate(rotation)
                    cx, cy = rotated.size[0] // 2, rotated.size[1] // 2
                    overlay = rotated.crop((cx - width//2, cy - height//2, cx + width//2, cy + height//2))
                    
                else:
                    # --- MODE SINGLE TEXT ---
                    draw = ImageDraw.Draw(overlay)
                    bbox = draw.textbbox((0, 0), text, font=font)
                    w_text, h_text = bbox[2] - bbox[0], bbox[3] - bbox[1]
                    
                    # Tentukan koordinat (x, y)
                    x, y = 0, 0
                    padding = int(width * 0.05)
                    
                    if position == 'center':
                        x, y = (width - w_text)//2, (height - h_text)//2
                    elif position == 'top-left': x, y = padding, padding
                    elif position == 'top-right': x, y = width - w_text - padding, padding
                    elif position == 'bottom-left': x, y = padding, height - h_text - padding
                    elif position == 'bottom-right': x, y = width - w_text - padding, height - h_text - padding
                    
                    # Draw
                    # Jika di tengah, kita support rotasi
                    if position == 'center' and rotation != 0:
                        temp_layer = Image.new("RGBA", (width*2, height*2), (255,255,255,0))
                        temp_draw = ImageDraw.Draw(temp_layer)
                        cx, cy = temp_layer.size[0]//2, temp_layer.size[1]//2
                        temp_draw.text((cx - w_text//2, cy - h_text//2), text, font=font, fill=final_color)
                        rotated = temp_layer.rotate(rotation)
                        crop_x = (rotated.size[0] - width) // 2
                        crop_y = (rotated.size[1] - height) // 2
                        overlay = rotated.crop((crop_x, crop_y, crop_x + width, crop_y + height))
                    else:
                        draw.text((x, y), text, font=font, fill=final_color)

            # --- 3. LOGIKA MODE LOGO ---
            elif mode == 'logo':
                if 'logo_file' not in request.files:
                    return jsonify({'error': 'No logo file uploaded'}), 400
                
                logo_file = request.files['logo_file']
                logo = Image.open(logo_file.stream).convert("RGBA")
                
                # Resize Logo
                target_w = int(width * (size_scale / 100))
                aspect_ratio = logo.height / logo.width
                target_h = int(target_w * aspect_ratio)
                logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
                
                # Atur Opacity Logo
                r, g, b, alpha = logo.split()
                alpha = alpha.point(lambda p: p * (opacity / 255))
                logo.putalpha(alpha)
                
                # Rotasi Logo
                if rotation != 0:
                    logo = logo.rotate(rotation, expand=True, resample=Image.BICUBIC)
                
                # Tentukan Posisi Paste
                lw, lh = logo.size
                lx, ly = 0, 0
                padding = int(width * 0.05)
                
                if position == 'center': lx, ly = (width - lw)//2, (height - lh)//2
                elif position == 'top-left': lx, ly = padding, padding
                elif position == 'top-right': lx, ly = width - lw - padding, padding
                elif position == 'bottom-left': lx, ly = padding, height - lh - padding
                elif position == 'bottom-right': lx, ly = width - lw - padding, height - lh - padding
                
                # Paste Logo ke Overlay (Gunakan alpha channel logo sebagai mask)
                # Paste harus hati-hati agar tidak error out of bound
                # Kita buat canvas seukuran base img dulu
                logo_canvas = Image.new("RGBA", base_img.size, (255,255,255,0))
                logo_canvas.paste(logo, (lx, ly), logo)
                overlay = logo_canvas

            # --- 4. FINALISASI ---
            final_img = Image.alpha_composite(base_img, overlay)
            
            # Convert ke Base64
            buffered = io.BytesIO()
            final_img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            return jsonify({'image': f"data:image/png;base64,{img_str}"})

        except Exception as e:
            print(f"Error: {e}")
            return jsonify({'error': str(e)}), 500

    return app