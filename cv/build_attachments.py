from pathlib import Path
import shutil

from PIL import Image
from pypdf import PdfWriter


def main() -> None:
    assets_dir = Path("assets")
    output_file = Path("attachments.pdf")
    tmp_dir = Path(".attachments_tmp")

    allowed_suffixes = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"}
    asset_files = sorted(
        path for path in assets_dir.iterdir() if path.is_file() and path.suffix.lower() in allowed_suffixes
    )

    if not asset_files:
        raise SystemExit("No supported files found in cv/assets to build attachments.pdf")

    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    pdf_inputs: list[Path] = []
    print("Assets selected for attachments.pdf:")

    for file_path in asset_files:
        print(f" - {file_path}")

        if file_path.suffix.lower() == ".pdf":
            pdf_inputs.append(file_path)
            continue

        converted = tmp_dir / f"{file_path.stem}.pdf"
        with Image.open(file_path) as image:
            if image.mode != "RGB":
                image = image.convert("RGB")
            image.save(converted, "PDF", resolution=300.0)
        pdf_inputs.append(converted)

    writer = PdfWriter()
    for pdf_path in pdf_inputs:
        writer.append(str(pdf_path))

    writer.write(str(output_file))
    writer.close()

    print(f"Generated attachments PDF: {Path.cwd() / output_file}")
    print(f"Total source files: {len(asset_files)}")


if __name__ == "__main__":
    main()
