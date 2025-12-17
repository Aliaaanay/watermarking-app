from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont, ImageColor
import io
import base64
import math

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "Server Watermark Ultimate Berjalan!",
        "status": "Ready",
        "features": ["Text Single", "Text Tiled", "Logo Watermark"]
    })

@app.route('/process-image', methods=['POST'])
def process_image():
    try:
        # 1. Cek File Upload Utama
        if 'file' not in request.files:
            return jsonify({'error': 'File gambar utama tidak ditemukan'}), 400
        
        file = request.files['file']
        
        # 2. Ambil Parameter Dasar
        mode = request.form.get('mode', 'text') # Opsi: 'text' atau 'logo'
        position = request.form.get('position', 'center')
        opacity_level = int(request.form.get('opacity', 128))
        size_scale = int(request.form.get('size', 20)) # Persentase ukuran (1-100)
        rotation_angle = int(request.form.get('rotation', 0))
        is_tiled = request.form.get('tiled', 'false') == 'true'

        # 3. Buka Gambar Utama
        img = Image.open(file.stream).convert("RGBA")
        width, height = img.size

        # Layer kosong (overlay) seukuran gambar asli
        overlay = Image.new("RGBA", (width, height), (255, 255, 255, 0))

        # ==========================================
        # LOGIKA MODE 1: TEKS (Single & Tiled)
        # ==========================================
        if mode == 'text':
            text = request.form.get('text', 'CONFIDENTIAL')
            hex_color = request.form.get('color', '#E50914')
            
            # Setup Warna
            try:
                rgb_color = ImageColor.getrgb(hex_color)
            except:
                rgb_color = (229, 9, 20) # Default Merah
            
            final_text_color = (rgb_color[0], rgb_color[1], rgb_color[2], opacity_level)
            
            # Setup Font (Dinamis berdasarkan lebar gambar)
            # size_scale 20 berarti font akan selebar 20% dari gambar (kira-kira)
            font_size = int(width * (size_scale / 100))
            if font_size < 10: font_size = 10 # Batas minimum
            
            try:
                font = ImageFont.truetype("arialbd.ttf", font_size)
            except:
                font = ImageFont.load_default()

            # --- SUB-MODE A: TILED (BERULANG) ---
            if is_tiled:
                # Buat canvas diagonal raksasa agar saat diputar area tetap tertutup
                diagonal = int(math.sqrt(width**2 + height**2))
                tiled_layer = Image.new("RGBA", (diagonal * 2, diagonal * 2), (255, 255, 255, 0))
                draw_tiled = ImageDraw.Draw(tiled_layer)
                
                # Hitung ukuran teks
                bbox = draw_tiled.textbbox((0, 0), text, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
                
                gap_x = text_w + int(width * 0.15) # Jarak horizontal
                gap_y = text_h + int(height * 0.15) # Jarak vertikal
                
                # Looping Menggambar Teks
                for y in range(0, diagonal * 2, gap_y):
                    for x in range(0, diagonal * 2, gap_x):
                        # Geser baris genap sedikit biar estetik (zig-zag)
                        offset_x = 0 if (y // gap_y) % 2 == 0 else gap_x // 2
                        draw_tiled.text((x - offset_x, y), text, font=font, fill=final_text_color)
                
                # Rotasi & Crop ke Tengah
                rotated_tiled = tiled_layer.rotate(rotation_angle)
                cx, cy = rotated_tiled.size[0] // 2, rotated_tiled.size[1] // 2
                
                left = cx - width // 2
                top = cy - height // 2
                overlay = rotated_tiled.crop((left, top, left + width, top + height))

            # --- SUB-MODE B: SINGLE TEXT ---
            else:
                # Canvas sementara besar untuk support rotasi center tanpa terpotong
                temp_layer = Image.new("RGBA", (width * 3, height * 3), (255, 255, 255, 0))
                draw = ImageDraw.Draw(temp_layer)
                
                bbox = draw.textbbox((0, 0), text, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]

                # Koordinat Tengah Canvas Temp
                cx_temp, cy_temp = temp_layer.size[0] // 2, temp_layer.size[1] // 2
                
                # Gambar di tengah canvas temp
                draw.text((cx_temp - text_w//2, cy_temp - text_h//2), text, font=font, fill=final_text_color)
                
                # Rotasi Canvas Temp
                rotated_temp = temp_layer.rotate(rotation_angle)
                
                # Crop kembali ke ukuran asli
                crop_x = (rotated_temp.size[0] - width) // 2
                crop_y = (rotated_temp.size[1] - height) // 2
                
                text_layer_cropped = rotated_temp.crop((crop_x, crop_y, crop_x + width, crop_y + height))
                
                # Jika posisi bukan center, kita tidak pakai hasil rotasi di atas secara langsung,
                # tapi kita geser manual (Rotasi biasanya hanya bagus untuk posisi Center)
                if position == 'center':
                    overlay = text_layer_cropped
                else:
                    # Reset overlay untuk posisi pojok (tanpa rotasi agar rapi)
                    overlay = Image.new("RGBA", (width, height), (255, 255, 255, 0))
                    draw_corner = ImageDraw.Draw(overlay)
                    padding = int(width * 0.05)
                    px, py = 0, 0
                    
                    if position == 'top-left': px, py = padding, padding
                    elif position == 'top-right': px, py = width - text_w - padding, padding
                    elif position == 'bottom-left': px, py = padding, height - text_h - padding
                    elif position == 'bottom-right': px, py = width - text_w - padding, height - text_h - padding
                    
                    draw_corner.text((px, py), text, font=font, fill=final_text_color)

        # ==========================================
        # LOGIKA MODE 2: LOGO
        # ==========================================
        elif mode == 'logo':
            if 'logo_file' not in request.files:
                return jsonify({'error': 'File logo tidak ditemukan'}), 400
            
            logo_file = request.files['logo_file']
            logo = Image.open(logo_file.stream).convert("RGBA")
            
            # 1. Resize Logo (Berdasarkan persentase lebar gambar utama)
            # size_scale 20 = logo selebar 20% gambar utama
            target_w = int(width * (size_scale / 100))
            if target_w < 10: target_w = 10
            
            aspect_ratio = logo.height / logo.width
            target_h = int(target_w * aspect_ratio)
            
            logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            # 2. Atur Opacity Logo
            # Kita manipulasi alpha channel pixel per pixel
            r, g, b, alpha = logo.split()
            # alpha value (0-255) dikali dengan opacity level (0-1.0 scale logic)
            # opacity_level dari input adalah 0-255
            factor = opacity_level / 255.0
            alpha = alpha.point(lambda p: int(p * factor))
            logo.putalpha(alpha)
            
            # 3. Rotasi Logo
            if rotation_angle != 0:
                logo = logo.rotate(rotation_angle, expand=True, resample=Image.BICUBIC)
            
            # 4. Tentukan Posisi Paste
            lw, lh = logo.size
            lx, ly = 0, 0
            padding = int(width * 0.05)
            
            if position == 'center': lx, ly = (width - lw)//2, (height - lh)//2
            elif position == 'top-left': lx, ly = padding, padding
            elif position == 'top-right': lx, ly = width - lw - padding, padding
            elif position == 'bottom-left': lx, ly = padding, height - lh - padding
            elif position == 'bottom-right': lx, ly = width - lw - padding, height - lh - padding
            
            # 5. Tempel Logo ke Overlay
            # Pastikan koordinat tidak negatif agar tidak error (walaupun crop otomatis handle biasanya)
            # Kita buat canvas seukuran base img
            logo_canvas = Image.new("RGBA", (width, height), (255, 255, 255, 0))
            # Paste logo menggunakan dirinya sendiri sebagai mask (param ke-3)
            logo_canvas.paste(logo, (lx, ly), logo)
            overlay = logo_canvas

        # ==========================================
        # FINALISASI
        # ==========================================
        # Gabungkan Gambar Asli + Overlay Watermark
        final_img = Image.alpha_composite(img, overlay)
        
        # Convert ke Base64 untuk dikirim balik ke Frontend
        buffered = io.BytesIO()
        final_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return jsonify({'image': f"data:image/png;base64,{img_str}"})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)