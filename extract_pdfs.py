"""Extract text and images from all Valispace PDFs."""
import fitz  # PyMuPDF
import os
import json

PDF_DIR = r"C:\Users\DJTim\Desktop\創業大聯盟\Valispace"
OUT_DIR = os.path.join(os.path.dirname(__file__), "valispace_extracts")

os.makedirs(OUT_DIR, exist_ok=True)

results = {}

for fname in sorted(os.listdir(PDF_DIR)):
    if not fname.endswith(".pdf"):
        continue
    fpath = os.path.join(PDF_DIR, fname)
    doc = fitz.open(fpath)
    
    pdf_info = {
        "filename": fname,
        "num_pages": len(doc),
        "pages": []
    }
    
    img_count = 0
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        
        # Extract images
        image_list = page.get_images(full=True)
        page_images = []
        for img_idx, img in enumerate(image_list):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                img_bytes = base_image["image"]
                img_ext = base_image["ext"]
                img_w = base_image.get("width", 0)
                img_h = base_image.get("height", 0)
                
                if img_w > 50 and img_h > 50:
                    img_fname = f"{fname.replace('.pdf','')}__p{page_num+1}_img{img_idx+1}.{img_ext}"
                    img_path = os.path.join(OUT_DIR, img_fname)
                    with open(img_path, "wb") as imgf:
                        imgf.write(img_bytes)
                    page_images.append({
                        "file": img_fname,
                        "width": img_w,
                        "height": img_h,
                        "ext": img_ext
                    })
                    img_count += 1
            except Exception as e:
                page_images.append({"error": str(e)})
        
        pdf_info["pages"].append({
            "page_number": page_num + 1,
            "text": text,
            "text_length": len(text),
            "num_images": len(page_images),
            "images": page_images
        })
    
    pdf_info["total_images_saved"] = img_count
    results[fname] = pdf_info
    doc.close()
    print(f"[OK] {fname}: {pdf_info['num_pages']} pages, {img_count} images saved")

# Save full summary
with open(os.path.join(OUT_DIR, "extraction_summary.json"), "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

# Print text content for analysis
for fname, info in results.items():
    print(f"\n{'='*60}")
    print(f"FILE: {fname} ({info['num_pages']} pages, {info['total_images_saved']} images)")
    print(f"{'='*60}")
    for page in info["pages"]:
        print(f"\n--- Page {page['page_number']} ({page['text_length']} chars, {page['num_images']} images) ---")
        print(page["text"][:2000])
